<template>
  <div class="mf-main-component">
    <h2>
      Micro Frontend Main Panel - <time>{{ selectedDate.toLocaleString() }}</time>
    </h2>
    <v-btn variant="flat" color="primary" @click="snackbar = true">Show message</v-btn>
    <v-card>
      <v-card-text>Props: {{ Object.keys(props) }}</v-card-text>
      <v-card-text>Emits: {{ emit }}</v-card-text>
    </v-card>
    <br />
    <D3Map
      :selectedDate="selectedDate"
      :topologyNode="topologyNode"
      :hostSettings="hostSettings"
      :settings="settings"
      @navigate="onNavigate"
    />
    <v-snackbar v-model="snackbar">
      This is a snackbar message.
      <template v-slot:actions>
        <v-btn color="pink" variant="text" @click="snackbar = false"> Close </v-btn>
      </template>
    </v-snackbar>
  </div>
</template>
<script setup lang="ts">
import type { TopologyNode } from '@deltares/fews-pi-requests'
import D3Map from './D3Map.vue'
import { ref, watch } from 'vue'

interface HostSettings {
  baseUrl: string
  webservicesUrl: string
  getHeaders: () => Promise<Headers>
}

interface D3MapSettings {
  locationsRequest?: string
  selectedLocationId?: string
  navigateRouteName?: string
}

interface Props {
  selectedDate: Date
  topologyNode: TopologyNode
  hostSettings: HostSettings
  settings: D3MapSettings
}

interface Emits {
  (event: 'navigate', route: { name: string; params?: { locationIds: string } }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const snackbar = ref(false)

watch(
  () => props.selectedDate,
  (newSelectedDate) => {
    console.log('MainComponent selectedDate changed to', newSelectedDate)
  },
)

watch(
  () => props.settings.selectedLocationId,
  (newLocationId) => {
    console.log('MainComponent selectedLocationId changed to', newLocationId)
  },
)

function onNavigate(route: { name: string; params?: { locationIds?: string } }) {
  if (!route.params?.locationIds) return

  emit('navigate', {
    name: route.name,
    params: { locationIds: route.params.locationIds },
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
