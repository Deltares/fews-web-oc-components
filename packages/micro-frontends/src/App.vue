<script setup lang="ts">
import { ref } from 'vue'
import type { TopologyNode } from '@deltares/fews-pi-requests'
import {
  provideHostNotifications,
  provideHostRefreshContext,
  provideHostWebserviceContext,
} from '@deltares/fews-web-oc-composables'
import MainComponent from './components/MainComponent.vue'

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
  getBaseUrl: () => new URL('/sample/', window.location.origin).href,
  getAuthorizationHeaders: async () => new Headers(),
})
</script>

<template>
  <v-app class="demo-app">
    <v-app-bar density="compact" flat border>
      <v-app-bar-title class="text-title-medium"
        >Micro Frontend Demo</v-app-bar-title
      >
      <span class="text-body-small text-medium-emphasis mr-3"
        >Palmiet locations</span
      >
    </v-app-bar>

    <v-main class="demo-main">
      <MainComponent :topologyNode="topologyNode" />
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
