import type {
  TimeSeriesResponse,
  TimeSeriesResult,
} from '@deltares/fews-pi-requests'

export interface CriticalPointValue {
  time: number
  value: number
}

export interface CriticalPointLevel {
  id: string
  name: string
  value: number
}

export interface CriticalPoint {
  locationId: string
  name: string
  parameterId: string
  units: string
  values: CriticalPointValue[]
  /** High level thresholds, sorted ascending by value. */
  levels: CriticalPointLevel[]
  current?: CriticalPointValue
  peak?: CriticalPointValue
  /** Index in `levels` of the highest threshold exceeded by the peak, or -1. */
  levelIndex: number
  /** Time at which the lowest threshold is first reached. */
  firstExceedance?: number
  /** Distance from the peak to the next (not exceeded) threshold. */
  margin?: number
}

const HOUR_MS = 3_600_000

function parsePiTime(date: string, time: string, offsetHours: number): number {
  return Date.parse(`${date}T${time}Z`) - offsetHours * HOUR_MS
}

function toValues(
  series: TimeSeriesResult,
  offsetHours: number,
): CriticalPointValue[] {
  const missVal = series.header?.missVal
  const values: CriticalPointValue[] = []
  for (const event of series.events ?? []) {
    if (event.value === missVal) continue
    const value = Number(event.value)
    const time = parsePiTime(event.date, event.time, offsetHours)
    if (Number.isFinite(value) && Number.isFinite(time)) {
      values.push({ time, value })
    }
  }
  return values
}

function toLevels(series: TimeSeriesResult): CriticalPointLevel[] {
  return (series.header?.thresholds ?? [])
    .filter((t) => !t.type || t.type === 'highLevelThreshold')
    .map((t) => ({
      id: t.id ?? t.name ?? '',
      name: t.label ?? t.name ?? t.id ?? '',
      value: Number(t.value),
    }))
    .filter((level) => Number.isFinite(level.value))
    .sort((a, b) => a.value - b.value)
}

function summarize(
  series: TimeSeriesResult,
  offsetHours: number,
  referenceTime: number | undefined,
): CriticalPoint {
  const header = series.header!
  const values = toValues(series, offsetHours)
  const levels = toLevels(series)

  const forecastTime = header.forecastDate
    ? parsePiTime(header.forecastDate.date, header.forecastDate.time, offsetHours)
    : undefined
  const reference = referenceTime ?? forecastTime

  let current: CriticalPointValue | undefined = values[0]
  let peak: CriticalPointValue | undefined
  for (const point of values) {
    if (reference !== undefined && point.time <= reference) current = point
    if (!peak || point.value > peak.value) peak = point
  }

  const peakValue = peak?.value ?? -Infinity
  const levelIndex =
    levels.filter((level) => peakValue >= level.value).length - 1
  const next = levels[levelIndex + 1]
  const lowestLevel = levels[0]

  return {
    locationId: header.locationId,
    name: header.stationName ?? header.locationId,
    parameterId: header.parameterId,
    units: header.units ?? '',
    values,
    levels,
    current,
    peak,
    levelIndex,
    firstExceedance: lowestLevel
      ? values.find((point) => point.value >= lowestLevel.value)?.time
      : undefined,
    margin: peak && next ? next.value - peak.value : undefined,
  }
}

/** Relative position of the peak with respect to the threshold ladder. */
function severityScore(point: CriticalPoint): number {
  const lowestLevel = point.levels[0]
  if (!lowestLevel || !point.peak) return -Infinity
  const lowest = lowestLevel.value
  const highest = Math.max(...point.levels.map((level) => level.value))
  const span = highest - lowest || 1
  return (point.peak.value - lowest) / span
}

/**
 * Converts a time series response to one critical point per location, picking
 * the first time series with thresholds, ordered from most to least critical.
 */
export function toCriticalPoints(
  response: TimeSeriesResponse | undefined,
  referenceTime?: number,
): CriticalPoint[] {
  const offsetHours = Number(response?.timeZone ?? 0) || 0
  const byLocation = new Map<string, TimeSeriesResult>()

  for (const series of response?.timeSeries ?? []) {
    const locationId = series.header?.locationId
    if (!locationId) continue
    const existing = byLocation.get(locationId)
    const hasThresholds = (series.header?.thresholds?.length ?? 0) > 0
    if (!existing || (hasThresholds && !existing.header?.thresholds?.length)) {
      byLocation.set(locationId, series)
    }
  }

  return [...byLocation.values()]
    .map((series) => summarize(series, offsetHours, referenceTime))
    .sort(
      (a, b) =>
        b.levelIndex - a.levelIndex ||
        severityScore(b) - severityScore(a) ||
        a.name.localeCompare(b.name),
    )
}

const LEVEL_COLORS = ['#fbc02d', '#fb8c00', '#e53935'] as const

/** Colour of a threshold, with the highest threshold always red. */
export function levelColor(index: number, count: number): string {
  if (index < 0) return '#43a047'
  const offset = Math.max(0, LEVEL_COLORS.length - count)
  return LEVEL_COLORS[Math.min(index + offset, LEVEL_COLORS.length - 1)] ?? '#e53935'
}
