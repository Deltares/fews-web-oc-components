import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import type { Location } from '@deltares/fews-pi-requests'
import type { Feature, FeatureCollection, Geometry } from 'geojson'

import D3Map from './D3Map.vue'

const features: Array<Feature<Geometry, Location>> = [
  {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [31.0218, -29.8587],
    },
    properties: {
      locationId: 'durban-central',
    } as unknown as Location,
  },
  {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [30.9258, -29.7242],
    },
    properties: {
      locationId: 'phoenix',
    } as unknown as Location,
  },
]

const geojson: FeatureCollection<Geometry, Location> = {
  type: 'FeatureCollection',
  features,
}

const selectedDate = new Date('2026-08-05T12:30:00Z')

describe('D3Map', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('emits navigate with clicked location id', async () => {
    const wrapper = mount(D3Map, {
      props: {
        selectedDate,
        geojson,
      },
    })

    const circles = wrapper.findAll('circle')
    expect(circles).toHaveLength(2)
    const firstCircle = circles[0]
    expect(firstCircle).toBeDefined()

    await firstCircle!.trigger('click')

    const navigateEvents = wrapper.emitted('navigate')
    expect(navigateEvents).toBeTruthy()
    expect(navigateEvents?.[0]?.[0]).toEqual({
      name: 'MicroFrontendTimeSeriesDisplay',
      params: { locationIds: 'durban-central' },
    })
  })

  it('updates highlighted circle when selectedLocationId changes', async () => {
    const wrapper = mount(D3Map, {
      props: {
        selectedDate,
        geojson,
      },
    })

    let circles = wrapper.findAll('circle')
    const firstCircle = circles[0]
    const secondCircle = circles[1]
    expect(firstCircle).toBeDefined()
    expect(secondCircle).toBeDefined()
    expect(firstCircle!.attributes('fill')).toBe('rgb(33, 150, 243)')
    expect(secondCircle!.attributes('fill')).toBe('orange')

    await wrapper.setProps({ geojson })

    circles = wrapper.findAll('circle')
    const updatedFirstCircle = circles[0]
    const updatedSecondCircle = circles[1]
    expect(updatedFirstCircle).toBeDefined()
    expect(updatedSecondCircle).toBeDefined()
    expect(updatedFirstCircle!.attributes('fill')).toBe('orange')
    expect(updatedSecondCircle!.attributes('fill')).toBe('rgb(33, 150, 243)')
  })
})
