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
    geojson,
    locationIds: 'phoenix',
  },
  parameters: {
    actions: {
      handles: ['click:location'],
    },
    layout: 'centered',
  },
} satisfies Meta<typeof D3Map>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const NoSelection: Story = {
  args: {
    locationIds: '',
  },
}

export const DifferentSelection: Story = {
  args: {
    locationIds: 'bluff',
  },
}
