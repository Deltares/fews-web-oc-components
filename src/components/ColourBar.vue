<template>
  <div id="legend">
    <svg id="colourbar" class="colourbar"></svg>
  </div>
</template>

<script setup lang="ts">
import { onMounted, watch } from 'vue'
import * as webOcCharts from '@deltares/fews-web-oc-charts'
import * as d3 from 'd3'

interface Props {
  colourMap?: webOcCharts.ColourMap
  title?: string
}

const props = defineProps<Props>()

let group: d3.Selection<SVGGElement, unknown, HTMLElement, any>

onMounted(() => {
  const svg = d3.select('#colourbar')
  group = svg
    .append('g')
    .attr('transform', 'translate(10, 50)')
    .style('pointer-events', 'visiblePainted')
  updateColourBar()
})

watch(props, updateColourBar)

function updateColourBar() {
  if (!props.colourMap) return
  if (!group) return

  // Remove possible previous colour map.
  group.selectAll('*').remove()
  // Create new colour bar and make it visible.
  const options: webOcCharts.ColourBarOptions = {
    type: 'nonlinear',
    useGradients: true,
    position: webOcCharts.AxisPosition.Bottom,
    title: props.title,
  }
  new webOcCharts.ColourBar(group as any, props.colourMap, 250, 10, options)
}
</script>

<style scoped>
.colourbar {
  width: 300px;
  height: 85px;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-rendering: optimizeLegibility;
  text-shadow:
    rgb(var(--v-theme-background)) 0px 0px 1px,
    rgb(var(--v-theme-background)) 0px 0px 1px,
    rgb(var(--v-theme-background)) 0px 0px 1px,
    rgb(var(--v-theme-background)) 0px 0px 1px,
    rgb(var(--v-theme-background)) 0px 0px 1px,
    rgb(var(--v-theme-background)) 0px 0px 1px;
}

.colourbar :deep(.axis .tick line) {
  filter: drop-shadow(0px 0px 1px rgb(var(--v-theme-background)))
    drop-shadow(0px 0px 1px rgb(var(--v-theme-background)))
    drop-shadow(0px 0px 1px rgb(var(--v-theme-background)));
}

:deep(g) {
  pointer-events: none;
  font-family: var(--primary-font);
}

:deep(svg text) {
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
  user-select: none;
  font-size: 1em;
}
</style>
