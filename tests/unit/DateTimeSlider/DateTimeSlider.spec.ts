import { shallowMount } from '@vue/test-utils'
import DateTimeSlider from '@/components/DateTimeSlider'
import { Default } from '@/components/DateTimeSlider/DateTimeSlider.stories'

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
    expect(wrapper.findComponent(DateTimeSlider).exists()).toBe(true)
  })

  it('emits input', () => {
    vm.$emit = jest.fn()
    vm.toggleNow()
    expect(vm.$emit.mock.calls[0]).toEqual(['update:now', false])
  })
})
