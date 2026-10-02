<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import {
  createDateRegistry,
  provideHostNotifications,
  provideHostRefreshContext,
  provideHostWebserviceContext,
} from '@deltares/fews-web-oc-composables'
import MainComponent from './components/MainComponent.vue'
import CriticalPointsOverview from './components/CriticalPointsOverview.vue'
import DemoLanding from './components/DemoLanding.vue'

const route = useRoute()
const showLanding = computed(() => route.path === '/')
const showCriticalPoints = computed(() => route.path === '/critical-points')
const pageTitle = computed(() => {
  if (showCriticalPoints.value) return 'Critical points'
  if (showLanding.value) return ''
  return 'Palmiet locations'
})
const criticalPointsNode: TopologyNode = {
  id: 'viewer_rivers_critical_points_forecast',
  name: 'Critical points',
  filterIds: ['SWMM Models_Simplified'],
}
const selectedLocationIds = ref('')
// The sample data is historical, so the demo starts at a fixed time within the forecast.
const selectedTime = ref(Date.parse('2025-03-13T13:00:00Z'))
const selectedDate = computed(() => new Date(selectedTime.value))

const { combinedDates } = createDateRegistry()
const dateFormat = new Intl.DateTimeFormat(undefined, {
  dateStyle: 'medium',
  timeStyle: 'short',
})
const dateItems = computed(() =>
  combinedDates.value.map((date) => ({
    title: dateFormat.format(date),
    value: date.getTime(),
  })),
)

const notification = ref('')
const showNotification = ref(false)
const topologyNode: TopologyNode = {
  id: 'palmiet',
  name: 'Palmiet',
  filterIds: ['palmiet'],
}

provideHostNotifications({
  addAlert(request) {
    notification.value = request.message
    showNotification.value = true
  },
})
provideHostRefreshContext({ systemTick: ref<Date>() })
provideHostWebserviceContext({
  getBaseUrl: () =>
    new URL('sample/', new URL(import.meta.env.BASE_URL, window.location.origin))
      .href,
  getAuthorizationHeaders: async () => new Headers(),
})
</script>

<template>
  <v-app class="demo-app">
    <v-app-bar density="compact" flat border>
      <template v-if="!showLanding" #prepend>
        <v-btn icon="mdi-arrow-left" to="/" aria-label="Back to demos" />
      </template>
      <v-app-bar-title class="text-title-medium"
        >Micro Frontend Demo</v-app-bar-title
      >
      <v-select
        v-if="showCriticalPoints"
        v-model="selectedTime"
        :items="dateItems"
        class="flex-0-0 mr-3"
        width="240"
        prepend-inner-icon="mdi-clock-outline"
        density="compact"
        variant="outlined"
        hide-details
      />
      <span
        v-if="pageTitle"
        class="text-body-small text-medium-emphasis mr-3"
        >{{ pageTitle }}</span
      >
    </v-app-bar>

    <v-main class="demo-main" :class="{ 'overflow-y-auto': showLanding }">
      <DemoLanding v-if="showLanding" />
      <CriticalPointsOverview
        v-else-if="showCriticalPoints"
        :topologyNode="criticalPointsNode"
        :selectedDate="selectedDate"
        :locationIds="selectedLocationIds"
        @navigate="selectedLocationIds = $event.params.locationIds"
      />
      <MainComponent v-else :topologyNode="topologyNode" />
    </v-main>

    <v-snackbar v-model="showNotification">{{ notification }}</v-snackbar>
  </v-app>
</template>

<style>
html,
body,
#app {
  margin: 0;
  padding: 0;
  height: 100%;
}
</style>

<style scoped>
.demo-app {
  height: 100vh;
}

.demo-main {
  min-height: 0;
  overflow: hidden;
}
</style>
