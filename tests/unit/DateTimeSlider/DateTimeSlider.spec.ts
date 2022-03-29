import { shallowMount } from '@vue/test-utils'
import DateTimeSlider from '../../../src/components/DateTimeSlider'
import { Default } from '../../../src/components/DateTimeSlider/DateTimeSlider.stories'

describe('DateTimeSlider', () => {
  let vm: any
  let wrapper: any
  beforeEach(() => {
    wrapper = shallowMount(DateTimeSlider, {
      propsData: Default.args
    })
    vm = wrapper.vm
  })

  it('renders the component in the Default state', () => {
    vm.$emit = jest.fn()
    expect(wrapper.find('.date-time-slider').exists()).toBe(true)
  })

  it('emits input', () => {
    vm.$emit = jest.fn()
    vm.toggleNow()
    expect(vm.$emit.mock.calls[0]).toEqual(['update:now', false])
    expect(vm.$emit.mock.calls[1]).toEqual(['input', new Date('2021-10-21')])
  })
})
