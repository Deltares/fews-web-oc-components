<template>
  <svg ref="svgRef">
    <pattern
      id="diagonalHatch"
      patternUnits="userSpaceOnUse"
      width="4"
      height="4"
    >
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
import type { FeatureCollection, Feature, Geometry } from 'geojson'
import { onMounted, ref, useTemplateRef, watchEffect } from 'vue'
import * as d3 from 'd3'
import boundaries from '@/assets/eThekwini_Municipal_Boundary.geojson.json'
import land from '@/assets/south-africa.geojson.json'
import { type Location as PiLocation } from '@deltares/fews-pi-requests'

interface Props {
  selectedDate: Date
  geojson?: FeatureCollection<Geometry, PiLocation>
  heightShiftScale?: number
}

interface Emits {
  (
    event: 'navigate',
    route: { name: string; params?: { locationIds?: string } },
  ): void
}

const {
  geojson = { type: 'FeatureCollection', features: [] },
  heightShiftScale = 0.1,
} = defineProps<Props>()
const emit = defineEmits<Emits>()

const selectedLocationId = ref('')

const svgRef = useTemplateRef('svgRef')
const width = 800
const height = 700
const margin = { top: 10, right: 10, bottom: 10, left: 10 }

let locationsGroup: d3.Selection<SVGGElement, unknown, null, undefined>
let projection: d3.GeoProjection

onMounted(() => {
  const svgElemement = svgRef.value
  if (!svgElemement) return

  const size = [
    width - margin.left - margin.right,
    height - margin.top - margin.bottom,
  ]
  projection = d3
    .geoMercator()
    // @ts-expect-error --- IGNORE ---
    .fitSize(size, boundaries)

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
})

watchEffect(() => {
  drawLocations(geojson, heightShiftScale)
})

function drawLocations(
  geojson: FeatureCollection<Geometry, PiLocation>,
  heightShiftScale = 0,
) {
  if (!locationsGroup || !geojson) return

  const features = geojson.features

  const projectLocation = (d: Feature<Geometry, PiLocation>) => {
    if (d.geometry.type !== 'Point') return null

    return projection(d.geometry.coordinates as [number, number])
  }

  const getPosition = (d: Feature<Geometry, PiLocation>) => {
    const projected = projectLocation(d)

    if (!projected) {
      return { x: 0, y: 0 }
    }

    const height = Number.parseFloat(d.properties.z ?? '0') * heightShiftScale

    return {
      x: projected[0],
      y: projected[1] - height,
    }
  }

  // Ground → elevated marker lines.
  locationsGroup
    .selectAll<SVGLineElement, Feature<Geometry, PiLocation>>('line')
    .data(features, (d) => d.properties.locationId)
    .join(
      (enter) =>
        enter.append('line').attr('stroke', '#666').attr('stroke-width', 1),
      (update) => update,
      (exit) => exit.remove(),
    )
    .attr('x1', (d) => getPosition(d).x)
    .attr('y1', (d) => {
      const projected = projectLocation(d)
      return projected?.[1] ?? 0
    })
    .attr('x2', (d) => getPosition(d).x)
    .attr('y2', (d) => getPosition(d).y)

  // Elevated location markers.
  locationsGroup
    .selectAll<SVGCircleElement, Feature<Geometry, PiLocation>>('circle')
    .data(features, (d) => d.properties.locationId)
    .join(
      (enter) =>
        enter
          .append('circle')
          .attr('r', 5)
          .attr('stroke', '#fff')
          .attr('stroke-width', 1)
          .on('click', (event, d) => {
            selectedLocationId.value = d.properties.locationId

            emit('navigate', {
              name: 'MicroFrontendTimeSeriesDisplay',
              params: {
                locationIds: d.properties.locationId,
              },
            })
          }),
      (update) => update,
      (exit) => exit.remove(),
    )
    .attr('cx', (d) => getPosition(d).x)
    .attr('cy', (d) => getPosition(d).y)
    .attr('fill', (d) =>
      d.properties.locationId === selectedLocationId.value
        ? 'orange'
        : 'rgb(33, 150, 243)',
    )
}
</script>
