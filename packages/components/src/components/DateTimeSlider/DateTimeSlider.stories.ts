import type { Meta, StoryObj } from '@storybook/vue3-vite'

import DateTimeSlider from './DateTimeSlider.vue'

const dates = [
  new Date('2021-10-21'),
  new Date('2021-10-22'),
  new Date('2021-10-23'),
  new Date('2021-10-24'),
  new Date('2021-10-25'),
]

const meta = {
  title: 'DateTimeSlider',
  component: DateTimeSlider,
  tags: ['autodocs'],
  args: {
    selectedDate: dates[0],
    dates,
    doFollowNow: false,
    isLoading: false,
  },
} satisfies Meta<typeof DateTimeSlider>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {}

export const Loading: Story = {
  args: {
    isLoading: true,
  },
}

export const NowActive: Story = {
  args: {
    doFollowNow: true,
  },
}

