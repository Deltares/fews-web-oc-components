<template>
  <svg ref="svgRef">
    <pattern id="diagonalHatch" patternUnits="userSpaceOnUse" width="4" height="4">
      <path
        d="M-1,1 l2,-2
           M0,4 l4,-4
           M3,5 l2,-2"
        style="stroke: #add8e6; stroke-width: 1"
      />
    </pattern>
  </svg>
</template>

<script setup lang="ts">
import type { Location } from '@deltares/fews-pi-requests'
import type { FeatureCollection, Feature, Geometry } from 'geojson'
import { onMounted, useTemplateRef, watch } from 'vue'
import * as d3 from 'd3'
import boundaries from '@/assets/eThekwini_Municipal_Boundary.geojson.json'
import land from '@/assets/south-africa.geojson.json'

interface Props {
  locationIds: string | null
  geojson: FeatureCollection<Geometry, Location>
}

interface Emits {
  (event: 'click:location', location: Location): void
}

const props = withDefaults(defineProps<Props>(), {
  locationIds: null,
})
const emit = defineEmits<Emits>()

const svgRef = useTemplateRef('svgRef')
const width = 800
const height = 800
const margin = { top: 10, right: 10, bottom: 10, left: 10 }
let locationsGroup: d3.Selection<SVGGElement, unknown, null, undefined>
let projection: d3.GeoProjection
let circles: d3.Selection<SVGCircleElement, Feature<Geometry, Location>, SVGGElement, unknown>

onMounted(() => {
  const svgElemement = svgRef.value
  if (!svgElemement) return

  projection = d3
    .geoMercator()
    // @ts-expect-error --- IGNORE ---
    .fitSize([width - margin.left - margin.right, height - margin.top - margin.bottom], boundaries)

  const path = d3.geoPath(projection)

  const selection = d3
    .select(svgRef.value!)
    .attr('width', width)
    .attr('height', height)
    .append('g')
    .attr('transform', `translate(${margin.left},${margin.top})`)

  selection
    .append('g')
    .selectAll('path')
    .data(land.features)
    .enter()
    .append('path')
    // @ts-expect-error --- IGNORE ---
    .attr('d', path)
    .attr('fill', 'url(#diagonalHatch)')

  selection
    .append('g')
    .selectAll('path')
    .data(boundaries.features)
    .enter()
    .append('path')
    // @ts-expect-error --- IGNORE ---
    .attr('d', path)
    .attr('fill', '#eee')
    .attr('stroke', '#999')

  locationsGroup = selection.append('g')
  drawLocations(props.geojson)
})

watch(
  () => props.geojson,
  () => {
    drawLocations(props.geojson)
  },
)

function drawLocations(geojson: FeatureCollection<Geometry, Location>) {
  if (!locationsGroup || !geojson) return

  locationsGroup.selectAll<SVGCircleElement, Feature<Geometry, Location>>('circle').remove()

  circles = locationsGroup
    .selectAll<SVGCircleElement, Feature<Geometry, Location>>('circle')
    .data(geojson.features)
    .join('circle')

  circles
    .attr('cx', (d) => {
      const coords = d.geometry.type === 'Point' ? d.geometry.coordinates : [0, 0]
      // @ts-expect-error --- IGNORE ---
      return projection(coords as [number, number])[0]
    })
    .attr('cy', (d) => {
      const coords = d.geometry.type === 'Point' ? d.geometry.coordinates : [0, 0]
      // @ts-expect-error --- IGNORE ---
      return projection(coords as [number, number])[1]
    })
    .attr('r', 5)
    .attr('fill', (d) =>
      d.properties.locationId === props.locationIds ? 'orange' : 'rgb(33, 150, 243)',
    )
    .attr('stroke', '#fff')
    .attr('stroke-width', 1)
    .on('click', (event, d) => {
      emit('click:location', d.properties)
    })

  circles.exit().remove()
}

watch(
  () => props.locationIds,
  (newLocationId) => {
    if (!locationsGroup) return
    circles.attr('fill', (d: Feature<Geometry, Location>) => {
      return d.properties.locationId === newLocationId ? 'orange' : 'rgb(33, 150, 243)'
    })
  },
)
</script>
