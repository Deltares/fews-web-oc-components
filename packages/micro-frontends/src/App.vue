<script setup lang="ts">
import { ref } from 'vue'
import { RouterView } from 'vue-router'

const times = ref([new Date('2025-05-26T22:00:00Z'), new Date('2025-05-27T22:00:00Z')])
const currentTime = ref(times.value[0])

const topologyNode = ref({ id: 'durban-coast', name: 'Durban Coast' })
const hostSettings = {
  baseUrl: '/',
  webservicesUrl: 'https://example.invalid/fews',
  getHeaders: async () => new Headers(),
}
const settings = {
  selectedLocationId: 'location-1',
  locationsRequest:
    '/locations?documentFormat=GEOJSON&topologyNodeId={topologyNodeId}&time={selectedDateIso}',
}
</script>

<template>
  <RouterView
    :selectedDate="currentTime"
    :topologyNode="topologyNode"
    :hostSettings="hostSettings"
    :settings="settings"
  />
</template>

<style>
html,
body {
  margin: 0;
  padding: 0;
}
</style>
