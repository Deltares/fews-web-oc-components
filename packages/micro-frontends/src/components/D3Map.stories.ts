import type { Location } from '@deltares/fews-pi-requests'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { userEvent, expect, fn, waitFor } from 'storybook/test'

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
  {
    type: 'Feature',
    geometry: {
      type: 'Point',
      coordinates: [31.032, -29.9678],
    },
    properties: {
      locationId: 'bluff',
    } as unknown as Location,
  },
]

const geojson: FeatureCollection<Geometry, Location> = {
  type: 'FeatureCollection',
  features,
}

const onNavigate = fn<(route: { name: string; params?: { locationIds?: string } }) => void>()

const meta = {
  title: 'MicroFrontends/D3Map',
  component: D3Map,
  tags: ['autodocs'],
  args: {
    selectedDate: new Date('2026-08-05T12:00:00Z'),
    topologyNode: {
      id: 'durban-coast',
      name: 'Durban Coast',
    },
    hostSettings: {
      baseUrl: '/weboc',
      webservicesUrl: 'https://example.invalid/fews',
      getHeaders: async () => new Headers({ Authorization: 'Bearer storybook-token' }),
    },
    settings: {
      selectedLocationId: 'phoenix',
      navigateRouteName: 'MicroFrontendTimeSeriesDisplay',
      mockGeojson: geojson,
    },
  },
  parameters: {
    actions: {
      handles: ['navigate'],
    },
    layout: 'centered',
  },
} satisfies Meta<typeof D3Map>

export default meta
type Story = StoryObj<typeof meta>

function renderWithNavigate(args: Story['args']) {
  return {
    components: { D3Map },
    setup() {
      return { args, onNavigate }
    },
    template: '<D3Map v-bind="args" @navigate="onNavigate" />',
  }
}

export const Default: Story = {
  render: renderWithNavigate,
  play: async ({ canvasElement }) => {
    onNavigate.mockClear()

    const circles = canvasElement.querySelectorAll('circle')
    expect(circles.length).toBeGreaterThan(0)

    const firstCircle = circles[0]
    expect(firstCircle).toBeDefined()
    await userEvent.click(firstCircle as SVGCircleElement)

    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledTimes(1)
    })

    expect(onNavigate).toHaveBeenLastCalledWith({
      name: 'MicroFrontendTimeSeriesDisplay',
      params: { locationIds: 'durban-central' },
    })
    expect(canvasElement.querySelector('svg')).toBeTruthy()
  },
}

export const NoSelection: Story = {
  args: {
    settings: {
      selectedLocationId: '',
      navigateRouteName: 'MicroFrontendTimeSeriesDisplay',
      mockGeojson: geojson,
    },
  },
}

export const DifferentSelection: Story = {
  render: renderWithNavigate,
  args: {
    settings: {
      selectedLocationId: 'bluff',
      navigateRouteName: 'MicroFrontendTimeSeriesDisplay',
      mockGeojson: geojson,
    },
  },
  play: async ({ canvasElement }) => {
    onNavigate.mockClear()

    const circles = canvasElement.querySelectorAll('circle')

    expect(circles).toHaveLength(3)
    const circle0 = circles[0]
    const circle1 = circles[1]
    const circle2 = circles[2]
    expect(circle0).toBeDefined()
    expect(circle1).toBeDefined()
    expect(circle2).toBeDefined()
    expect((circle0 as SVGCircleElement).getAttribute('fill')).toBe('rgb(33, 150, 243)')
    expect((circle1 as SVGCircleElement).getAttribute('fill')).toBe('rgb(33, 150, 243)')
    expect((circle2 as SVGCircleElement).getAttribute('fill')).toBe('orange')

    await userEvent.click(circle2 as SVGCircleElement)

    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledTimes(1)
    })

    expect(onNavigate).toHaveBeenLastCalledWith({
      name: 'MicroFrontendTimeSeriesDisplay',
      params: { locationIds: 'bluff' },
    })
  },
}

export const WithFetchRequestTemplate: Story = {
  args: {
    selectedDate: new Date('2026-08-10T09:30:00Z'),
    topologyNode: {
      id: 'umhlanga',
      name: 'Umhlanga',
    },
    settings: {
      selectedLocationId: 'durban-central',
      navigateRouteName: 'MicroFrontendTimeSeriesDisplay',
      locationsRequest:
        '/locations?documentFormat=GEOJSON&topologyNodeId={topologyNodeId}&time={selectedDateIso}',
      mockGeojson: geojson,
    },
  },
}
