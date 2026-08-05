import type { Location } from '@deltares/fews-pi-requests'
import type { Feature, FeatureCollection, Geometry } from 'geojson'
import type { Meta, StoryObj } from '@storybook/vue3-vite'

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

export const Default: Story = {}

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
  args: {
    settings: {
      selectedLocationId: 'bluff',
      navigateRouteName: 'MicroFrontendTimeSeriesDisplay',
      mockGeojson: geojson,
    },
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
