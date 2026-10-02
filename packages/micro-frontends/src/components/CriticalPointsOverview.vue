<template>
  <div class="d-flex flex-column h-100 w-100">
    <v-toolbar density="compact">
      <v-toolbar-title class="text-title-medium">
        {{ topologyNode.name ?? 'Critical points' }} — forecast overview
      </v-toolbar-title>

      <span v-if="lastRefreshAt" class="text-body-small text-medium-emphasis mr-2">
        Updated {{ lastRefreshAt.toLocaleTimeString() }}
      </span>

      <v-btn
        class="mr-2"
        size="small"
        icon="mdi-refresh"
        aria-label="Refresh critical points"
        :loading="refreshing"
        @click="fetch()"
      />
    </v-toolbar>

    <v-progress-linear :indeterminate="loading" :active="loading" height="3" />

    <div class="d-flex flex-wrap align-center ga-2 pa-2">
      <v-chip-group
        v-model="selectedCategories"
        class="py-0"
        multiple
        filter
        column
      >
        <v-chip
          v-for="item in summary"
          :key="item.key"
          :value="item.key"
          :color="item.color"
          :base-color="item.color"
          size="small"
          variant="tonal"
        >
          {{ item.label }}: {{ item.count }}
        </v-chip>
      </v-chip-group>

      <v-spacer />

      <v-text-field
        v-model="search"
        class="flex-0-1"
        min-width="180"
        max-width="240"
        placeholder="Search location"
        prepend-inner-icon="mdi-magnify"
        density="compact"
        variant="outlined"
        clearable
        hide-details
      />
    </div>

    <v-alert
      v-if="error"
      class="mx-2 mb-2"
      type="error"
      density="compact"
      :text="error.message"
    />

    <v-data-table
      class="flex-1-1"
      :headers="headers"
      :items="visiblePoints"
      item-value="locationId"
      :items-per-page="-1"
      :loading="loading"
      :row-props="rowProps"
      density="compact"
      no-data-text="No critical points to show."
      fixed-header
      hide-default-footer
      hover
      @click:row="onRowClick"
    >
      <template #[`item.status`]="{ item }">
        <v-icon
          icon="mdi-circle"
          size="small"
          :color="statusColor(item)"
          :title="statusLabel(item)"
        />
      </template>

      <template #[`item.name`]="{ item }">
        <div class="d-flex flex-column py-1">
          <span class="text-body-medium">{{ item.name }}</span>
          <span class="text-body-small text-medium-emphasis">
            {{ statusLabel(item) }}
            <template v-if="item.current">
              · now {{ formatValue(item.current.value) }} {{ item.units }}
            </template>
          </span>
        </div>
      </template>

      <template #[`item.forecast`]="{ item }">
        <svg
          :width="SPARK_WIDTH"
          :height="SPARK_HEIGHT"
          :viewBox="`0 0 ${SPARK_WIDTH} ${SPARK_HEIGHT}`"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <line
            v-for="(level, index) in sparklines.get(item.locationId)?.levels"
            :key="index"
            x1="0"
            :x2="SPARK_WIDTH"
            :y1="level.y"
            :y2="level.y"
            :stroke="level.color"
            stroke-dasharray="3 2"
            stroke-width="1"
            vector-effect="non-scaling-stroke"
          />
          <line
            v-if="sparklines.get(item.locationId)?.nowX !== undefined"
            :x1="sparklines.get(item.locationId)?.nowX"
            :x2="sparklines.get(item.locationId)?.nowX"
            :y1="SPARK_LABEL_HEIGHT"
            :y2="SPARK_HEIGHT"
            stroke="currentColor"
            stroke-opacity="0.5"
            stroke-width="1"
          >
            <title>Now: {{ formatTime(now) }}</title>
          </line>
          <path
            :d="sparklines.get(item.locationId)?.path"
            fill="none"
            :stroke="statusColor(item)"
            stroke-width="1.5"
          />
          <template v-if="item.peak && sparklines.get(item.locationId)?.peak">
            <circle
              :cx="sparklines.get(item.locationId)?.peak?.x"
              :cy="sparklines.get(item.locationId)?.peak?.y"
              r="3"
              :fill="statusColor(item)"
              stroke="white"
              stroke-width="1"
            >
              <title>
                Peak {{ formatValue(item.peak.value) }} {{ item.units }} ·
                {{ formatTime(item.peak.time) }}
              </title>
            </circle>
            <text
              :x="sparklines.get(item.locationId)?.peak?.x"
              y="9"
              :text-anchor="sparklines.get(item.locationId)?.peak?.anchor"
              font-size="10"
              fill="currentColor"
            >
              {{ formatRelative(item.peak.time) }}
            </text>
          </template>
        </svg>
      </template>

      <template #[`item.peak`]="{ item }">
        <div v-if="item.peak" class="d-flex flex-column align-end py-1">
          <span class="text-body-medium">
            {{ formatValue(item.peak.value) }} {{ item.units }}
          </span>
          <span class="text-body-small text-medium-emphasis">
            {{ formatTime(item.peak.time) }}
          </span>
        </div>
        <template v-else>—</template>
      </template>

      <template #[`item.firstExceedance`]="{ item }">
        {{ formatLead(item.firstExceedance) }}
      </template>

      <template #[`item.margin`]="{ item }">
        <template v-if="item.margin !== undefined">
          {{ formatValue(item.margin) }} {{ item.units }}
        </template>
        <template v-else>—</template>
      </template>
    </v-data-table>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import * as d3 from 'd3'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import {
  useDateRegistry,
  usePiTimeSeries,
  type PiTimeSeriesRequest,
} from '@deltares/fews-web-oc-composables'

import {
  levelColor,
  toCriticalPoints,
  type CriticalPoint,
} from './criticalPoints'

interface Props {
  selectedDate?: Date
  topologyNode: TopologyNode
  locationIds?: string
}

interface Emits {
  (
    event: 'navigate',
    route: {
      name: string
      params: {
        locationIds: string
      }
    },
  ): void
}

const { selectedDate, topologyNode, locationIds = '' } = defineProps<Props>()
const emit = defineEmits<Emits>()

const SPARK_WIDTH = 160
const SPARK_HEIGHT = 48
const SPARK_LABEL_HEIGHT = 12
const REQUEST_KEY = 'criticalPoints'

const now = computed(() => (selectedDate ?? new Date()).getTime())

const search = ref('')
const selectedCategories = ref<string[]>([])

const BELOW = 'below'
const NO_THRESHOLDS = 'none'

const headers = computed(
  () =>
    [
      { key: 'status', title: '', sortable: false, width: 32 },
      { key: 'name', title: 'Location' },
      { key: 'forecast', title: forecastTitle.value, sortable: false },
      {
        key: 'peak',
        title: 'Peak',
        align: 'end',
        value: (item: CriticalPoint) => item.peak?.value,
      },
      { key: 'firstExceedance', title: 'First exceedance', align: 'end' },
      { key: 'margin', title: 'To next level', align: 'end' },
    ] as const,
)

const requests = computed<PiTimeSeriesRequest[]>(() => {
  const filterId = topologyNode.filterIds?.[0]
  if (!filterId) return []
  return [
    {
      key: REQUEST_KEY,
      filter: { filterId, showThresholds: true, omitMissing: true },
    },
  ]
})

const { responses, errors, loading, refreshing, fetch, lastRefreshAt } =
  usePiTimeSeries({
    requests,
    query: { useDisplayUnits: true, convertDatum: true },
  })

const error = computed(() => errors.value[REQUEST_KEY])

const criticalPoints = computed(() =>
  toCriticalPoints(responses.value[REQUEST_KEY], now.value),
)

const selectedIds = computed(() => new Set(locationIds.split(',')))

const selectableDates = computed(() => {
  const times = new Set<number>()
  for (const point of criticalPoints.value) {
    for (const { time } of point.values) times.add(time)
  }
  return [...times].sort((a, b) => a - b).map((time) => new Date(time))
})

useDateRegistry(selectableDates)

const timeSpan = computed(() => {
  const [start, end] = d3.extent(
    visiblePoints.value.flatMap((point) => point.values),
    (d) => d.time,
  )
  return start === undefined || end === undefined ? undefined : { start, end }
})

const forecastTitle = computed(() => {
  const span = timeSpan.value
  if (!span) return 'Forecast'
  return `Forecast (${formatRelative(span.start)} – ${formatRelative(span.end)})`
})

const visiblePoints = computed(() => {
  const term = search.value?.trim().toLowerCase() ?? ''
  const categories = new Set(selectedCategories.value)
  return criticalPoints.value.filter(
    (point) =>
      (categories.size === 0 || categories.has(category(point))) &&
      (!term ||
        point.name.toLowerCase().includes(term) ||
        point.locationId.toLowerCase().includes(term)),
  )
})

const summary = computed(() => {
  const counts = new Map<
    string,
    { label: string; count: number; color: string; rank: number }
  >([
    [BELOW, { label: 'Below thresholds', count: 0, color: levelColor(-1, 0), rank: -1 }],
    [NO_THRESHOLDS, { label: 'No thresholds', count: 0, color: 'grey', rank: -2 }],
  ])

  for (const point of criticalPoints.value) {
    const key = category(point)
    const entry = counts.get(key) ?? {
      label: key,
      count: 0,
      color: statusColor(point),
      rank: point.levelIndex,
    }
    entry.count++
    counts.set(key, entry)
  }

  return [...counts.entries()]
    .map(([key, entry]) => ({ key, ...entry }))
    .filter((item) => item.key !== NO_THRESHOLDS || item.count > 0)
    .sort((a, b) => b.rank - a.rank)
})

const sparklines = computed(() => {
  const result = new Map<
    string,
    {
      path: string
      levels: { y: number; color: string }[]
      nowX?: number
      peak?: { x: number; y: number; anchor: 'start' | 'middle' | 'end' }
    }
  >()

  for (const point of visiblePoints.value) {
    const span = timeSpan.value
    const [v0, v1] = d3.extent([
      ...point.values.map((d) => d.value),
      ...point.levels.map((level) => level.value),
    ])
    if (!span || v0 === undefined || v1 === undefined) {
      result.set(point.locationId, { path: '', levels: [] })
      continue
    }
    const { start: t0, end: t1 } = span

    const x = d3.scaleLinear().domain([t0, t1]).range([3, SPARK_WIDTH - 3])
    const y = d3
      .scaleLinear()
      .domain([v0, v1 === v0 ? v0 + 1 : v1])
      .range([SPARK_HEIGHT - 3, SPARK_LABEL_HEIGHT + 3])
    const line = d3
      .line<CriticalPoint['values'][number]>()
      .x((d) => x(d.time))
      .y((d) => y(d.value))

    const peakX = point.peak ? x(point.peak.time) : undefined

    result.set(point.locationId, {
      path: line(point.values) ?? '',
      levels: point.levels.map((level, index) => ({
        y: y(level.value),
        color: levelColor(index, point.levels.length),
      })),
      nowX: now.value >= t0 && now.value <= t1 ? x(now.value) : undefined,
      peak:
        point.peak && peakX !== undefined
          ? {
              x: peakX,
              y: y(point.peak.value),
              anchor: sparkLabelAnchor(peakX),
            }
          : undefined,
    })
  }
  return result
})

function sparkLabelAnchor(x: number): 'start' | 'middle' | 'end' {
  if (x < SPARK_WIDTH * 0.2) return 'start'
  if (x > SPARK_WIDTH * 0.8) return 'end'
  return 'middle'
}

function category(point: CriticalPoint): string {
  if (!point.levels.length) return NO_THRESHOLDS
  if (point.levelIndex < 0) return BELOW
  return point.levels[point.levelIndex]?.name ?? BELOW
}

function statusColor(point: CriticalPoint): string {
  if (!point.levels.length) return 'grey'
  return levelColor(point.levelIndex, point.levels.length)
}

function statusLabel(point: CriticalPoint): string {
  if (!point.levels.length) return 'No thresholds'
  if (point.levelIndex < 0) return 'Below thresholds'
  return point.levels[point.levelIndex]?.name ?? 'Below thresholds'
}

const valueFormat = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 2,
})

function formatValue(value: number): string {
  return valueFormat.format(value)
}

const timeFormat = new Intl.DateTimeFormat(undefined, {
  day: '2-digit',
  month: 'short',
  hour: '2-digit',
  minute: '2-digit',
})

function formatTime(time: number): string {
  return timeFormat.format(time)
}

const relativeFormat = new Intl.RelativeTimeFormat(undefined, {
  numeric: 'auto',
  style: 'short',
})

function formatRelative(time: number): string {
  const minutes = Math.round((time - now.value) / 60_000)
  if (Math.abs(minutes) < 60) return relativeFormat.format(minutes, 'minute')
  const hours = Math.round(minutes / 60)
  if (Math.abs(hours) < 48) return relativeFormat.format(hours, 'hour')
  return relativeFormat.format(Math.round(hours / 24), 'day')
}

function formatLead(time: number | undefined): string {
  return time === undefined ? '—' : formatRelative(time)
}

function rowProps({ item }: { item: CriticalPoint }) {
  return {
    class: selectedIds.value.has(item.locationId) ? 'bg-surface-light' : '',
    style: 'cursor: pointer',
  }
}

function onRowClick(_event: Event, { item }: { item: CriticalPoint }) {
  emit('navigate', {
    name: 'MicroFrontendTimeSeriesDisplay',
    params: { locationIds: item.locationId },
  })
}
</script>
