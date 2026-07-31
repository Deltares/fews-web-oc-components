import DateTimeSlider from './DateTimeSlider.vue'

const value = new Date('2021-10-21')
const dates = [
  new Date('2021-10-21'),
  new Date('2021-10-22'),
  new Date('2021-10-23'),
  new Date('2021-10-24'),
  new Date('2021-10-25')
]
const now = true

export default {
  title: 'DateTimeSlider',
  component: DateTimeSlider
}

const action = (name: string) => (...args: unknown[]) => {
  // Keep lightweight logging in stories without requiring addon-actions.
  console.log(name, ...args)
}

const Template = (args: any, { argTypes }: any) => ({
  args,
  components: { DateTimeSlider },
  props: Object.keys(argTypes),
  template:
    '<DateTimeSlider v-model="value" :dates="dates" v-model:now="now" @update:modelValue="onInput" @update:now="selectNow" />',
  methods: {
    onInput: action('update:modelValue'),
    selectNow: action('update:now')
  },
  parameters: {
    docs: {
      storyDescription: 'test'
    }
  }
})

export const Default: any = Template.bind({})
Default.args = {
  value,
  dates,
  now,
}
