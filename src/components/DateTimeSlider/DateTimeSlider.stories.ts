import { action } from '@storybook/addon-actions'
import { withKnobs, text, boolean } from '@storybook/addon-knobs'
import DateTimeSlider from './DateTimeSlider.vue'

const value = new Date('2021-10-21')
const dates = [
  new Date('2021-10-21'),
  new Date('2021-10-22'),
  new Date('2021-10-23'),
  new Date('2021-10-24'),
  new Date('2021-10-25')
]

export default {
  title: 'DateTimeSlider',
  component: DateTimeSlider
}

const Template = (args: any, { argTypes }: any) => ({
  args,
  components: { DateTimeSlider },
  props: Object.keys(argTypes),
  template: '<DateTimeSlider :value="value" :dates="dates" @input="input" @select-now="selectNow" />',
  methods: {
    input: action('input'),
    selectNow: action('selectNow')
  }
})

export const Default: any = Template.bind({})
Default.args = {
  value,
  dates
}
