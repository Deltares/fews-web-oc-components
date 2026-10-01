export interface PiTimeSeriesQueryOptions {
  /**
   * Overrides the start time of every request.
   */
  startTime?: Date | null

  /**
   * Overrides the end time of every request.
   */
  endTime?: Date | null

  /**
   * Requests thinned data with a resolution based on the estimated chart width.
   */
  thinning?: boolean

  /**
   * Converts values to the datum of the location.
   */
  convertDatum?: boolean

  /**
   * Returns values in display units instead of the stored units.
   */
  useDisplayUnits?: boolean

  /**
   * Returns only time series headers, without events.
   */
  onlyHeaders?: boolean
}

const DEFAULT_CHART_WIDTH_PX = 1000

function toPiDateTime(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, 'Z')
}

function estimateChartWidth(): number {
  const outerWidth = (globalThis as { outerWidth?: number }).outerWidth
  return outerWidth ? 0.5 * outerWidth : DEFAULT_CHART_WIDTH_PX
}

/**
 * Applies the query options to a time series URL and sorts the search
 * parameters, so equivalent requests result in identical URLs.
 */
export function applyTimeSeriesQueryOptions(
  url: URL,
  options: PiTimeSeriesQueryOptions,
): URL {
  const result = new URL(url)
  const params = result.searchParams

  if (options.startTime) params.set('startTime', toPiDateTime(options.startTime))
  if (options.endTime) params.set('endTime', toPiDateTime(options.endTime))

  if (options.thinning) {
    const start = Date.parse(params.get('startTime') ?? '')
    const end = Date.parse(params.get('endTime') ?? '')
    if (!Number.isNaN(start) && !Number.isNaN(end) && end > start) {
      const msPerPixel = Math.round((end - start) / estimateChartWidth())
      params.set('thinning', msPerPixel.toString())
    }
  }

  if (options.convertDatum) params.set('convertDatum', 'true')
  if (options.useDisplayUnits) params.set('useDisplayUnits', 'true')
  if (options.onlyHeaders) params.set('onlyHeaders', 'true')

  params.sort()
  return result
}
