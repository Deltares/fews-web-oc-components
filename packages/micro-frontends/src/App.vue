<script setup lang="ts">
import { ref } from 'vue'
import { RouterView } from 'vue-router'

const times = ref([new Date('2025-05-26T22:00:00Z'), new Date('2025-05-27T22:00:00Z')])
const currentTime = ref(times.value[0])
const geosjon = ref({
  type: 'FeatureCollection',
  features: [
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        // set point to be clost to Durban, South Africa
        coordinates: [31.0, -29.0],
      },
      properties: {
        locationId: 'location-1',
        name: 'Location 1',
      },
    },
    {
      type: 'Feature',
      geometry: {
        type: 'Point',
        // set point to be in South Africa
        coordinates: [31.0, -29.0],
      },
      properties: {
        locationId: 'location-2',
        name: 'Location 2',
      },
    },
  ],
})
</script>

<template>
  <RouterView :time="currentTime" :timeSeries="times" :geojson="geosjon" />
</template>

<style>
html,
body {
  margin: 0;
  padding: 0;
}
</style>
