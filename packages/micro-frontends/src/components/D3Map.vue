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
import type { Location, TopologyNode } from '@deltares/fews-pi-requests'
import type { FeatureCollection, Feature, Geometry } from 'geojson'
import { onMounted, ref, useTemplateRef, watch } from 'vue'
import * as d3 from 'd3'
import boundaries from '@/assets/eThekwini_Municipal_Boundary.geojson.json'
import land from '@/assets/south-africa.geojson.json'

interface HostSettings {
  baseUrl: string
  webservicesUrl: string
  getHeaders: () => Promise<Headers>
}

interface D3MapSettings {
  locationsRequest?: string
  selectedLocationId?: string
  navigateRouteName?: string
  mockGeojson?: FeatureCollection<Geometry, Location>
}

interface Props {
  selectedDate: Date
  topologyNode: TopologyNode
  hostSettings: HostSettings
  settings: D3MapSettings
}

interface Emits {
  (event: 'navigate', route: { name: string; params?: { locationIds?: string } }): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const svgRef = useTemplateRef('svgRef')
const width = 800
const height = 800
const margin = { top: 10, right: 10, bottom: 10, left: 10 }
const geojson = ref<FeatureCollection<Geometry, Location>>({ type: 'FeatureCollection', features: [] })
let locationsGroup: d3.Selection<SVGGElement, unknown, null, undefined>
let projection: d3.GeoProjection
let circles: d3.Selection<SVGCircleElement, Feature<Geometry, Location>, SVGGElement, unknown> | null =
  null

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
  void loadLocationsAndDraw()
})

watch(
  () => [
    props.selectedDate.getTime(),
    getTopologyNodeIdentifier(props.topologyNode),
    props.settings.locationsRequest,
    props.settings.mockGeojson,
  ],
  () => {
    void loadLocationsAndDraw()
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
      const projected = projection(coords as [number, number])
      return projected ? projected[0] : 0
    })
    .attr('cy', (d) => {
      const coords = d.geometry.type === 'Point' ? d.geometry.coordinates : [0, 0]
      const projected = projection(coords as [number, number])
      return projected ? projected[1] : 0
    })
    .attr('r', 5)
    .attr('fill', (d) =>
      d.properties.locationId === props.settings.selectedLocationId ? 'orange' : 'rgb(33, 150, 243)',
    )
    .attr('stroke', '#fff')
    .attr('stroke-width', 1)
    .on('click', (event, d) => {
      emit('navigate', {
        name: props.settings.navigateRouteName ?? 'MicroFrontendTimeSeriesDisplay',
        params: { locationIds: d.properties.locationId },
      })
    })
}

watch(
  () => props.settings.selectedLocationId,
  (newLocationId) => {
    if (!circles) return
    circles.attr('fill', (d: Feature<Geometry, Location>) => {
      return d.properties.locationId === newLocationId ? 'orange' : 'rgb(33, 150, 243)'
    })
  },
)

async function loadLocationsAndDraw() {
  try {
    const fetchedGeojson = await loadGeojson()
    geojson.value = fetchedGeojson
    drawLocations(fetchedGeojson)
  } catch {
    const emptyGeojson = { type: 'FeatureCollection', features: [] } as FeatureCollection<
      Geometry,
      Location
    >
    geojson.value = emptyGeojson
    drawLocations(emptyGeojson)
  }
}

async function loadGeojson(): Promise<FeatureCollection<Geometry, Location>> {
  if (props.settings.mockGeojson) {
    return props.settings.mockGeojson
  }

  const requestPath = props.settings.locationsRequest
  if (!requestPath) {
    return { type: 'FeatureCollection', features: [] }
  }

  const requestUrl = toRequestUrl(requestPath)
  const headers = await props.hostSettings.getHeaders()
  const response = await fetch(requestUrl, { headers })

  if (!response.ok) {
    throw new Error(`Failed to load map locations (${response.status})`)
  }

  const data = await response.json()
  if (!isFeatureCollection(data)) {
    throw new Error('Locations response is not a GeoJSON FeatureCollection')
  }

  return data
}

function getTopologyNodeIdentifier(topologyNode: TopologyNode): string {
  const dynamicTopologyNode = topologyNode as unknown as Record<string, unknown>
  const id = dynamicTopologyNode.id ?? dynamicTopologyNode.nodeId
  return typeof id === 'string' ? id : ''
}

function toRequestUrl(pathOrUrl: string): string {
  const topologyNodeId = encodeURIComponent(getTopologyNodeIdentifier(props.topologyNode))
  const selectedDateIso = encodeURIComponent(props.selectedDate.toISOString())
  const resolvedPath = pathOrUrl
    .replaceAll('{topologyNodeId}', topologyNodeId)
    .replaceAll('{selectedDateIso}', selectedDateIso)

  if (/^https?:\/\//i.test(resolvedPath)) {
    return resolvedPath
  }

  return new URL(resolvedPath, props.hostSettings.webservicesUrl).toString()
}

function isFeatureCollection(value: unknown): value is FeatureCollection<Geometry, Location> {
  if (!value || typeof value !== 'object') return false
  const candidate = value as { type?: unknown; features?: unknown }
  return candidate.type === 'FeatureCollection' && Array.isArray(candidate.features)
}
</script>
