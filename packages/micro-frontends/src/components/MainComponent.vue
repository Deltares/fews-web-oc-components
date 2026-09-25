<template>
  <div class="d-flex flex-column h-100 w-100">
    <!-- Header -->
    <v-toolbar density="compact">
      <v-toolbar-title class="text-title-medium">
        Demo Micro Frontend Main Panel
      </v-toolbar-title>

      <v-spacer />

      <span class="text-body-small text-medium-emphasis mr-4">
        <time>{{ selectedDate.toLocaleString() }}</time>
      </span>

      <v-btn
        size="small"
        icon="mdi-refresh"
        aria-label="Refresh locations"
        @click="refresh()"
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
      <v-card class="d-flex flex-1-1 overflow-hidden" elevation="1">
        <D3Map
          class="map"
          :selected-date="selectedDate"
          :topology-node="topologyNode"
          :height-shift-scale="heightShiftScale"
          :geojson="geojson"
          @navigate="onNavigate"
        />
      </v-card>

      <!-- Controls -->
      <v-card class="ml-2 controls-panel" width="320" elevation="1">
        <!-- Controls -->
        <v-card-title class="text-title-medium"> Controls </v-card-title>

        <v-divider />

        <v-card-text>
          <div class="text-body-small text-medium-emphasis mb-2">
            Location elevation
          </div>

          <div class="d-flex align-center">
            <v-slider
              v-model="heightShiftScale"
              class="flex-grow-1"
              min="0"
              max="0.2"
              step="0.01"
              thumb-label
              hide-details
            />

            <span class="text-body-small ml-3 value-label">
              {{ heightShiftScale.toFixed(2) }}
            </span>
          </div>
        </v-card-text>

        <v-divider />

        <!-- Props -->
        <v-card-title class="text-title-medium"> Props </v-card-title>

        <v-card-text class="pa-0">
          <!-- Table header -->
          <div class="props-header px-4 py-2">
            <span>Prop / Property</span>
            <span>Value</span>
          </div>

          <v-divider />

          <div class="props-content">
            <!-- selectedDate -->
            <div class="prop-row px-4 py-2">
              <span class="prop-name">selectedDate</span>
              <span class="prop-value">
                {{ selectedDate.toLocaleString() }}
              </span>
            </div>

            <!-- topologyNode -->
            <div class="prop-group">
              <div class="prop-row px-4 py-2">
                <span class="prop-name"> topologyNode </span>
                <span class="prop-value"> TopologyNode </span>
              </div>

              <div
                v-for="(value, key) in topologyNode"
                :key="String(key)"
                class="prop-row prop-row-nested"
              >
                <span class="prop-name">
                  {{ key }}
                </span>

                <span class="prop-value">
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
import {
  type TopologyNode,
  type LocationsFilter,
} from '@deltares/fews-pi-requests'
import {
  useHostNotifications,
  usePiLocations,
} from '@deltares/fews-web-oc-composables'

import D3Map from './D3Map.vue'

interface Props {
  selectedDate: Date
  topologyNode: TopologyNode
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

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const alertStore = useHostNotifications()
const heightShiftScale = ref(0.1)

const filter = computed<LocationsFilter>(() => {
  const filterId = props.topologyNode.filterIds?.[0]

  return filterId
    ? {
        filterId,
      }
    : {}
})

const { geojson, loading, refresh } = usePiLocations({ filter })

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
.map {
  min-width: 0;
  min-height: 0;
  width: 100%;
  height: 100%;
}

.controls-panel {
  overflow: hidden;
}

.props-content {
  overflow-y: auto;
  max-height: 500px;
}

.props-header {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(100px, 1.5fr);
  gap: 16px;
  font-size: 0.75rem;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.6);
  background: rgba(var(--v-theme-on-surface), 0.03);
}

.prop-row {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(100px, 1.5fr);
  gap: 16px;
  align-items: start;
  min-height: 40px;
}

.prop-group-header {
  display: flex;
  align-items: center;
  min-height: 40px;
}

.prop-row-nested {
  padding-left: 48px !important;
}

.prop-name {
  font-size: 0.8125rem;
  font-weight: 500;
  overflow-wrap: anywhere;
}

.prop-value {
  font-size: 0.8125rem;
  color: rgba(var(--v-theme-on-surface), 0.7);
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}

.value-label {
  min-width: 36px;
  text-align: right;
}
</style>
