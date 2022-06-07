import { shallowMount } from '@vue/test-utils'
import ColumnMenu from '../../../src/components/ColumnMenu'
import { Default } from '../../../src/components/ColumnMenu/ColumnMenu.stories'

describe('ColumnMenu', () => {
  let vm: any
  let wrapper: any
  beforeEach(() => {
    wrapper = shallowMount(ColumnMenu, {
      propsData: Default.args
    })
    vm = wrapper.vm
  })

  it('renders the component in the Default state', () => {
    vm.$emit = jest.fn()
    expect(wrapper.find('.column-menu').exists()).toBe(true)
  })

  it('onItemsChange: updates stack', () => {
    vm.stack = []
    vm.value.panelId = false
    vm.items = {
      id: 'test'
    }
    expect(vm.stack).toEqual([])
  })

  it('get currentTitle: retrieves currentTitle if any item in stack', () => {
    vm.stack = [{
      text: 'test'
    }]
    expect(vm.currentTitle).toEqual('test')
  })

  it('get currentTitle: retrieves empty string if no item in stack', () => {
    vm.stack = []
    expect(vm.currentTitle).toEqual('')
  })

  it('get currentLevel: retrieves current level', () => {
    vm.stack = ['test']
    expect(vm.currentLevel).toEqual(0)
  })

  it('onTitleClick: updates stack when not empty', () => {
    vm.$emit = jest.fn()
    vm.stack = []
    vm.onTitleClick()
    console.log(vm.stack)
    expect(vm.stack.length).toEqual(0)
  })

  it('onTitleClick: updates stack when not empty', () => {
    vm.$emit = jest.fn()
    vm.stack = ['test']
    vm.onTitleClick()
    expect(vm.stack.length).toEqual(1)
  })

  it('onTitleClick: updates stack when not empty', () => {
    vm.$emit = jest.fn()
    vm.stack = ['test', 'test']
    vm.onTitleClick()
    expect(vm.stack.length).toEqual(1)
  })

  it('onItemClick: emits input', () => {
    vm.$emit = jest.fn()
    vm.onItemClick('foo', ['test'])
    expect(vm.$emit.mock.calls[0]).toEqual(['click', 'foo', ['test']])
  })

  it('findInCurrentLevel: return true if currentlevel.id == id', () => {
    vm.stack = [{
      id: 'foo'
    }]
    expect(vm.findInCurrentLevel('foo')).toBeTruthy()
  })
})
