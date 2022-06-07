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

  it('get max: return max of dates array', () => {
    vm.dates = ['test', 'test']
    expect(vm.max).toEqual(1)
  })

  it('get nowInDateRange: returns true', () => {
    expect(vm.nowInDateRange).toBeTruthy()
  })

  it('get dateString: returns true', () => {
    vm.dates = []
    expect(vm.dateString).toEqual('')
  })

  it('get nowColor', () => {
    vm.useNow = false
    expect(vm.nowColor).toEqual('')
    vm.useNow = true
    expect(vm.nowColor).toEqual('orange')
  })

  it('get playColor', () => {
    vm.isPlaying = false
    expect(vm.playColor).toEqual('')
    vm.isPlaying = true
    expect(vm.playColor).toEqual('orange')
  })

  it('togglePlay: updates intervalTimer when playing', () => {
    vm.isPlaying = true
    expect(vm.intervalTimer).toEqual(0)
    vm.isPlaying = false
    expect(vm.playColor).toEqual('orange')
  })
})
