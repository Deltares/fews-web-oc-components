<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import * as d3 from 'd3'
import type { FeatureCollection, Geometry, Point } from 'geojson'
import { type Location as PiLocation } from '@deltares/fews-pi-requests'
import land from '@/assets/ne_50m_land.json'

interface Props {
  geojson?: FeatureCollection<Geometry, PiLocation>
  zoom?: number
}

const props = withDefaults(defineProps<Props>(), {
  zoom: 1,
})

const emit = defineEmits<{
  navigate: [
    {
      name: 'MicroFrontendTimeSeriesDisplay'
      params: {
        locationIds: string
      }
    },
  ]
}>()

const container = ref<HTMLElement | null>(null)
const selectedLocationId = ref<string>()

let resizeObserver: ResizeObserver | undefined

type LocationFeature = {
  type: 'Feature'
  geometry: Point
  properties: PiLocation
}

/**
 * Natural Earth ne_50m_land.json.
 *
 * Depending on how the JSON was generated, this will normally
 * be a GeoJSON FeatureCollection containing Polygon/MultiPolygon
 * land geometry.
 */
const landGeoJson = land as FeatureCollection<Geometry, Record<string, unknown>>

function getLocations(): LocationFeature[] {
  return (
    props.geojson?.features.filter(
      (feature): feature is LocationFeature =>
        feature.geometry?.type === 'Point',
    ) ?? []
  )
}

function getLocationCenter(locations: LocationFeature[]): [number, number] {
  if (!locations.length) {
    return [0, 0]
  }

  /*
   * For the usual case, calculate the arithmetic center.
   *
   * Coordinates are GeoJSON:
   * [longitude, latitude]
   */
  const longitudes = locations.map(
    (location) => location.geometry.coordinates[0],
  )

  const latitudes = locations.map(
    (location) => location.geometry.coordinates[1],
  )

  return [d3.mean(longitudes) ?? 0, d3.mean(latitudes) ?? 0]
}

const MIN_ZOOM = 0
const MAX_ZOOM = 32

function getZoomScale(zoom: number, baseRadius: number): number {
  const clampedZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoom))

  const scaleMultiplier = Math.pow(2, clampedZoom / 4)

  return baseRadius * scaleMultiplier
}

function render() {
  if (!container.value) {
    return
  }

  const width = container.value.clientWidth
  const height = container.value.clientHeight

  if (!width || !height) {
    return
  }

  d3.select(container.value).selectAll('svg').remove()

  const svg = d3
    .select(container.value)
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('viewBox', `0 0 ${width} ${height}`)
    .attr('role', 'img')
    .attr('aria-label', 'Location globe')

  const locations = getLocations()

  /*
   * Orient the globe using the locations.
   */
  const [longitude, latitude] = getLocationCenter(locations)

  const baseRadius = Math.min(width, height) * 0.45

  const projection = d3
    .geoOrthographic()
    .translate([width / 2, height / 2])
    .scale(getZoomScale(props.zoom, baseRadius))
    .rotate([-longitude, -latitude])
    .clipAngle(90)
    .precision(0.5)

  const path = d3.geoPath(projection)

  /*
   * ----------------------------------------------------------
   * Ocean
   * ----------------------------------------------------------
   */

  const sphere: d3.GeoSphere = {
    type: 'Sphere',
  }
  svg.append('path').datum(sphere).attr('class', 'ocean').attr('d', path)

  /*
   * ----------------------------------------------------------
   * Natural Earth land
   * ----------------------------------------------------------
   *
   * ne_110m_land.json contains the actual land masses,
   * rather than country boundaries.
   */

  svg.append('path').datum(landGeoJson).attr('class', 'land').attr('d', path)

  /*
   * ----------------------------------------------------------
   * Graticule
   * ----------------------------------------------------------
   */

  svg
    .append('path')
    .datum(d3.geoGraticule10())
    .attr('class', 'graticule')
    .attr('d', path)

  /*
   * ----------------------------------------------------------
   * Location markers
   * ----------------------------------------------------------
   */

  const locationSelection = svg
    .append('g')
    .attr('class', 'locations')
    .selectAll<SVGCircleElement, LocationFeature>('circle')
    .data(locations, (d) => d.properties.locationId)
    .join('circle')
    .attr('class', (d) =>
      d.properties.locationId === selectedLocationId.value
        ? 'location selected'
        : 'location',
    )
    .attr('r', 6)
    .style('cursor', 'pointer')
    .on('click', (_event, d) => {
      selectedLocationId.value = d.properties.locationId

      emit('navigate', {
        name: 'MicroFrontendTimeSeriesDisplay',
        params: {
          locationIds: d.properties.locationId,
        },
      })

      locationSelection.classed(
        'selected',
        (location) =>
          location.properties.locationId === selectedLocationId.value,
      )
    })

  /*
   * Only display locations that are on the visible
   * hemisphere of the orthographic globe.
   */
  locationSelection.each(function (d) {
    const point = projection(d.geometry.coordinates as [number, number])

    d3.select(this)
      .attr('cx', point?.[0] ?? -1000)
      .attr('cy', point?.[1] ?? -1000)
      .style('display', point ? 'inherit' : 'none')
  })
}

watch(() => [props.geojson, props.zoom], render, { deep: true })

onMounted(() => {
  render()

  if (container.value) {
    resizeObserver = new ResizeObserver(render)
    resizeObserver.observe(container.value)
  }
})

onBeforeUnmount(() => {
  resizeObserver?.disconnect()
})
</script>

<template>
  <div ref="container" class="location-globe" />
</template>

<style scoped>
.location-globe {
  width: 100%;
  height: 100%;
  min-height: 300px;
}

.location-globe :deep(svg) {
  display: block;
  width: 100%;
  height: 100%;
}

.location-globe :deep(.ocean) {
  fill: #eef4f8;
  stroke: #8796a5;
  stroke-width: 1.5;
}

.location-globe :deep(.land) {
  fill: #d9e0e5;
  stroke: none;
}

.location-globe :deep(.graticule) {
  fill: none;
  stroke: #aeb9c3;
  stroke-width: 0.5;
  opacity: 0.5;
}

.location-globe :deep(.location) {
  fill: #2563eb;
  stroke: #ffffff;
  stroke-width: 2;
  transition:
    r 120ms ease,
    fill 120ms ease;
}

.location-globe :deep(.location:hover) {
  r: 8;
}

.location-globe :deep(.location.selected) {
  fill: #dc2626;
  r: 8;
}
</style>
