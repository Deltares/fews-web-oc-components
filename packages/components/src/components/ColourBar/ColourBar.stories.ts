import type { Meta, StoryObj } from '@storybook/vue3-vite'
import { AxisPosition } from '@deltares/fews-web-oc-charts'

import ColourBar from './ColourBar.vue'

const defaultColourMap = [
  { lowerValue: 0, color: '#313695' },
  { lowerValue: 25, color: '#4575b4' },
  { lowerValue: 50, color: '#74add1' },
  { lowerValue: 75, color: '#abd9e9' },
  { lowerValue: 100, color: '#e0f3f8' },
]

const meta = {
  title: 'ColourBar',
  component: ColourBar,
  tags: ['autodocs'],
  args: {
    colourMap: defaultColourMap,
    width: 250,
    height: 20,
  },
} satisfies Meta<typeof ColourBar>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const TopAxis: Story = {
  args: {
    options: { position: AxisPosition.Top },
  },
}

export const WithGradients: Story = {
  args: {
    options: { useGradients: true },
  },
}

export const WithTitle: Story = {
  args: {
    options: { title: 'Temperature (°C)' },
  },
}

export const Tall: Story = {
  args: {
    height: 60,
  },
}
