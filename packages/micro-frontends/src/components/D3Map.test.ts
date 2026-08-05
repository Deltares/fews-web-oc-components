import { beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import type { Location, TopologyNode } from '@deltares/fews-pi-requests'
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

const mockGeojson: FeatureCollection<Geometry, Location> = {
  type: 'FeatureCollection',
  features,
}

const topologyNode: TopologyNode = {
  id: 'durban coast',
  name: 'Durban Coast',
} as TopologyNode

const selectedDate = new Date('2026-08-05T12:30:00Z')

async function flushMicrotasks() {
  await Promise.resolve()
  await Promise.resolve()
  await Promise.resolve()
}

describe('D3Map', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('builds locations request URL with placeholders and forwards headers', async () => {
    const getHeaders = vi.fn(async () => new Headers({ Authorization: 'Bearer test-token' }))
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      ok: true,
      json: async () => mockGeojson,
    } as Response)

    mount(D3Map, {
      props: {
        selectedDate,
        topologyNode,
        hostSettings: {
          baseUrl: '/weboc',
          webservicesUrl: 'https://example.test/fews/',
          getHeaders,
        },
        settings: {
          locationsRequest:
            '/locations?documentFormat=GEOJSON&topologyNodeId={topologyNodeId}&time={selectedDateIso}',
          selectedLocationId: 'phoenix',
        },
      },
    })

    await flushMicrotasks()

    expect(getHeaders).toHaveBeenCalledTimes(1)
    expect(fetchSpy).toHaveBeenCalledTimes(1)

    const firstCall = fetchSpy.mock.calls[0]
    expect(firstCall).toBeDefined()
    const [requestUrl, requestInit] = firstCall!
    expect(requestUrl).toBe(
      'https://example.test/locations?documentFormat=GEOJSON&topologyNodeId=durban%20coast&time=2026-08-05T12%3A30%3A00.000Z',
    )

    expect((requestInit as RequestInit).headers).toBeInstanceOf(Headers)
    expect(((requestInit as RequestInit).headers as Headers).get('Authorization')).toBe(
      'Bearer test-token',
    )
  })

  it('emits navigate with clicked location id', async () => {
    const wrapper = mount(D3Map, {
      props: {
        selectedDate,
        topologyNode,
        hostSettings: {
          baseUrl: '/weboc',
          webservicesUrl: 'https://example.test/fews/',
          getHeaders: async () => new Headers(),
        },
        settings: {
          selectedLocationId: 'phoenix',
          navigateRouteName: 'MicroFrontendTimeSeriesDisplay',
          mockGeojson,
        },
      },
    })

    await flushMicrotasks()

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
        topologyNode,
        hostSettings: {
          baseUrl: '/weboc',
          webservicesUrl: 'https://example.test/fews/',
          getHeaders: async () => new Headers(),
        },
        settings: {
          selectedLocationId: 'phoenix',
          mockGeojson,
        },
      },
    })

    await flushMicrotasks()

    let circles = wrapper.findAll('circle')
    const firstCircle = circles[0]
    const secondCircle = circles[1]
    expect(firstCircle).toBeDefined()
    expect(secondCircle).toBeDefined()
    expect(firstCircle!.attributes('fill')).toBe('rgb(33, 150, 243)')
    expect(secondCircle!.attributes('fill')).toBe('orange')

    await wrapper.setProps({
      settings: {
        selectedLocationId: 'durban-central',
        mockGeojson,
      },
    })

    await flushMicrotasks()

    circles = wrapper.findAll('circle')
    const updatedFirstCircle = circles[0]
    const updatedSecondCircle = circles[1]
    expect(updatedFirstCircle).toBeDefined()
    expect(updatedSecondCircle).toBeDefined()
    expect(updatedFirstCircle!.attributes('fill')).toBe('orange')
    expect(updatedSecondCircle!.attributes('fill')).toBe('rgb(33, 150, 243)')
  })
})
