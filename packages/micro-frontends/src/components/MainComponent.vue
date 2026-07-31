<template>
  <div class="mf-main-component">
    <h2>
      Micro Frontend Main Panel - <time>{{ time.toLocaleString() }}</time>
    </h2>
    <v-btn variant="flat" color="primary" @click="snackbar = true">Show message</v-btn>
    <v-card>
      <v-card-text>Props: {{ Object.keys(props) }}</v-card-text>
      <v-card-text>Emits: {{ emit }}</v-card-text>
    </v-card>
    <br />
    <D3Map :geojson="geojson" :locationIds="locationIds" @click:location="onLocation"></D3Map>
    <v-snackbar v-model="snackbar">
      This is a snackbar message.
      <template v-slot:actions>
        <v-btn color="pink" variant="text" @click="snackbar = false"> Close </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>
<script setup lang="ts">
import type { TopologyNode, Location, LocationsFilter } from '@deltares/fews-pi-requests'
import type { FeatureCollection, Geometry } from 'geojson'
import D3Map from './D3Map.vue'
import { ref, watch } from 'vue'

interface Props {
  locationIds?: string
  time: Date
  geojson: FeatureCollection<Geometry, Location>
  topologyNode: TopologyNode
}

interface Emits {
  (event: 'navigate', route: { name: string; params?: { locationIds: string } }): void
  (event: 'getLocations', filter: LocationsFilter): void
}

const props = withDefaults(defineProps<Props>(), {
  locationIds: '',
})
const emit = defineEmits<Emits>()
const snackbar = ref(false)

watch(
  () => props.time,
  (newTime) => {
    console.log('MainComponent time changed to', newTime)
  },
)

watch(
  () => props.locationIds,
  (newLocationIds) => {
    console.log('MainComponent locationIds changed to', newLocationIds)
  },
)

function onLocation(location: Location) {
  emit('navigate', {
    name: 'MicroFrontendTimeSeriesDisplay',
    params: { locationIds: location.locationId },
  })
}
</script>

<style scoped>
.mf-main-component {
  width: 100%;
  padding: 20px;
  justify-content: center;
  background-color: cadetblue;
  overflow: auto;
}
</style>
