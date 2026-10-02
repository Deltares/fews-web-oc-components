<script setup lang="ts">
import { computed, ref, watchEffect } from 'vue'
import { RouterView, useRoute, useRouter } from 'vue-router'
import { useDark } from '@vueuse/core'
import { useTheme } from 'vuetify'
import {
  createDateRegistry,
  provideHostNotifications,
  provideHostRefreshContext,
  provideHostWebserviceContext,
} from '@deltares/fews-web-oc-composables'
import { resolveSelectedTime } from './demoConfig.js'

const route = useRoute()
const router = useRouter()
const theme = useTheme()
const isDark = useDark()
watchEffect(() => theme.change(isDark.value ? 'dark' : 'light'))
const selectedTime = computed({
  get: () => resolveSelectedTime(route.query.selectedTime),
  set: (value: number) => {
    void router.replace({
      query: { ...route.query, selectedTime: String(value) },
    })
  },
})

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

function onNavigate(event: { params?: { locationIds?: string } }): void {
  const locationIds = event.params?.locationIds
  if (!locationIds) return

  void router.replace({ query: { ...route.query, locationIds } })
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
      <template v-if="route.name !== 'landing'" #prepend>
        <v-btn icon="mdi-arrow-left" to="/" aria-label="Back to demos" />
      </template>
      <v-app-bar-title class="text-title-medium"
        >FEWS WebOC Micro Frontend Demo</v-app-bar-title
      >
      <v-select
        v-if="route.name === 'critical-points'"
        v-model="selectedTime"
        :items="dateItems"
        class="flex-0-0 mr-3"
        width="240"
        prepend-inner-icon="mdi-clock-outline"
        density="compact"
        variant="outlined"
        hide-details
      />
      <v-switch
        v-model="isDark"
        class="flex-0-0 mr-3"
        false-icon="mdi-weather-sunny"
        true-icon="mdi-weather-night"
        :aria-label="isDark ? 'Switch to light theme' : 'Switch to dark theme'"
        density="compact"
        inset
        hide-details
      />
    </v-app-bar>

    <v-main
      class="demo-main"
      :class="{ 'overflow-y-auto': route.name === 'landing' }"
    >
      <RouterView v-slot="{ Component }">
        <component :is="Component" @navigate="onNavigate" />
      </RouterView>
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
