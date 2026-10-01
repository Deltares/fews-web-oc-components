<template>
  <div class="d-flex flex-column h-100 w-100">
    <!-- Header -->
    <v-toolbar density="compact">
      <v-toolbar-title class="text-title-medium">
        Demo Micro Frontend Main Panel
      </v-toolbar-title>

      <span class="text-body-small text-medium-emphasis mr-4">
        Last refresh
        <time v-if="lastRefreshAt">
          {{ lastRefreshAt.toLocaleString() }}
        </time>
        <v-chip
          v-if="lastTriggerPolicy"
          class="ml-2"
          size="small"
          variant="tonal"
          prepend-icon="mdi-refresh"
        >
          {{ formatRefreshPolicy(lastTriggerPolicy) }}
        </v-chip>
      </span>

      <v-btn
        size="small"
        icon="mdi-refresh"
        aria-label="Refresh locations"
        @click="fetch()"
      />

      <v-btn
        class="mr-2"
        size="small"
        variant="flat"
        color="primary"
        @click="showInfoMessage()"
      >
        Show notification
      </v-btn>
    </v-toolbar>

    <!-- Loading indicator -->
    <v-progress-linear :indeterminate="loading" :active="loading" height="3" />

    <!-- Main content -->
    <div class="d-flex flex-1-1 overflow-hidden pa-2">
      <!-- Map -->
      <v-card class="d-flex flex-1-1 overflow-hidden map-card" elevation="1">
        <D3WorldMap
          class="map"
          :geojson="geojson"
          :locationIds="locationIds"
          :zoom="debouncedZoom"
          @navigate="onNavigate"
        />
        <div class="zoom-control">
          <v-tooltip text="Zoom level" location="top start">
            <template #activator="{ props }">
              <div v-bind="props" class="zoom-slider-activator">
                <v-slider
                  v-model="zoom"
                  aria-label="Zoom level"
                  direction="vertical"
                  min="0"
                  max="32"
                  step="1"
                  show-ticks="always"
                  thumb-label
                  hide-details
                />
              </div>
            </template>
          </v-tooltip>
        </div>
      </v-card>

      <!-- Component props -->
      <v-card
        v-if="!locationIds"
        class="ml-2 controls-panel"
        width="320"
        elevation="1"
      >
        <v-card-title class="text-title-medium"> Component Props </v-card-title>

        <v-card-text class="pa-0">
          <div class="props-content">
            <!-- selectedDate -->
            <div class="prop-row px-3 py-1">
              <span class="prop-name">selectedDate</span>
              <span class="prop-value">
                {{ selectedDate?.toLocaleString() }}
              </span>
            </div>

            <v-divider />

            <div class="prop-row px-3 py-1">
              <span class="prop-name">locationIds</span>
              <span class="prop-value">
                {{ locationIds }}
              </span>
            </div>

            <v-divider />

            <!-- topologyNode -->
            <div class="prop-group">
              <div class="prop-group-title px-3 py-1">topologyNode</div>

              <div
                v-for="(value, key) in topologyNode"
                :key="String(key)"
                class="prop-row px-3 py-1"
                :class="{ 'prop-row-long': isLongValue(value) }"
              >
                <span class="prop-name">
                  {{ key }}
                </span>

                <span class="prop-value" :title="formatValue(value)">
                  {{ formatValue(value) }}
                </span>
              </div>
            </div>
          </div>
        </v-card-text>
      </v-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import { refThrottled } from '@vueuse/core'
import {
  type TopologyNode,
  type LocationsFilter,
} from '@deltares/fews-pi-requests'
import {
  useHostNotifications,
  usePiLocations,
} from '@deltares/fews-web-oc-composables'

import D3WorldMap from './D3WorldMap.vue'
import type { RefreshPolicy } from '@deltares/fews-web-oc-composables/dist/useRefreshCoordinator/index'

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
      params?: {
        locationIds: string
      }
    },
  ): void
}

const { selectedDate, topologyNode, locationIds = '' } = defineProps<Props>()
const emit = defineEmits<Emits>()

const alertStore = useHostNotifications()

const zoom = ref(16)
const debouncedZoom = refThrottled(zoom, 100)

const filter = computed<LocationsFilter>(() => {
  const filterId = topologyNode.filterIds?.[0]

  return filterId
    ? {
        filterId,
      }
    : {}
})

const { geojson, loading, fetch, lastRefreshAt, lastTriggerPolicy } =
  usePiLocations({ filter })

function isLongValue(value: unknown): boolean {
  return formatValue(value).length > 40
}

function formatValue(value: unknown): string {
  if (value === null || value === undefined) {
    return '—'
  }

  if (value instanceof Date) {
    return value.toLocaleString()
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

function formatRefreshPolicy(policy: RefreshPolicy): string {
  switch (policy) {
    case 'onSystemTick':
      return 'System tick'
    case 'onInterval':
      return 'Interval'
    case 'onVisibilityResume':
      return 'Visibility'
    case 'manual':
      return 'Manual'
  }
}

function onNavigate(route: {
  name: string
  params?: {
    locationIds?: string
  }
}) {
  if (!route.params?.locationIds) return

  emit('navigate', {
    name: route.name,
    params: {
      locationIds: route.params.locationIds,
    },
  })
}

function showInfoMessage() {
  alertStore.addAlert({
    id: 'main_component',
    type: 'info',
    message:
      '🤜 Hello WebOC this is a notification from the μf-Demo component 🤛',
  })
}
</script>

<style scoped>
.map-card {
  position: relative;
}

.map {
  min-width: 0;
  min-height: 0;
  width: 100%;
  height: 100%;
}

.zoom-control {
  position: absolute;
  top: 40px;
  left: 16px;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  height: 220px;
  padding: 8px;
}

.zoom-control .v-slider {
  min-height: 0;
  flex: 1;
}

.zoom-slider-activator {
  display: flex;
  flex: 1;
  min-height: 0;
}

.controls-panel {
  overflow: hidden;
}

.props-content {
  width: 100%;
  overflow: hidden;
}

.prop-row {
  display: grid;
  grid-template-columns: max-content minmax(0, 1fr);
  gap: 8px;
  align-items: center;
  min-height: 26px;
  font-size: 0.75rem;
}

.prop-name {
  min-width: 0;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.65);
  white-space: nowrap;
}

.prop-value {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  text-align: right;
}

.prop-row-long {
  grid-template-columns: 1fr;
  gap: 2px;
  align-items: start;
  padding-top: 5px !important;
  padding-bottom: 5px !important;
}

.prop-row-long .prop-value {
  width: 100%;
  overflow-wrap: anywhere;
  white-space: normal;
  text-align: left;
  line-height: 1.35;
  color: rgba(var(--v-theme-on-surface), 0.65);
}

.prop-group-title {
  display: flex;
  align-items: center;
  min-height: 28px;
  font-size: 0.75rem;
  color: rgb(var(--v-theme-on-surface));
  background: rgba(var(--v-theme-on-surface), 0.04);
}

.prop-row-nested {
  padding-left: 24px !important;
}

.value-label {
  min-width: 36px;
  text-align: right;
}
</style>
