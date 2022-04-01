import { action } from '@storybook/addon-actions'
import { withKnobs, text, boolean } from '@storybook/addon-knobs'
import ColumnMenu from './ColumnMenu.vue'

const items = {
  id: 1,
  text: 'parent1',
  children: [{
    id: 11,
    text: 'child1',
    to: 'child1'
  }, {
    id: 12,
    text: 'child2',
    to: 'child2'
  }, {
    id: 13,
    text: 'child3',
    to: 'child3',
    children: [
      {
        id: 131,
        text: 'grandchild1',
        to: 'grandchild1'
      }, {
        id: 132,
        text: 'grandchild2',
        to: 'grandchild2'
      }
    ]
  }]
}


const value = {
  panelId: 0,
  groupId: 1
}

export default {
  title: 'ColumnMenu',
  component: ColumnMenu
}

const Template = (args: any, { argTypes }: any) => ({
  args,
  components: { ColumnMenu },
  props: Object.keys(argTypes),
  template: '<ColumnMenu :items="items" :value="value" @click="onItemClick" />',
  methods: {
    onItemClick: action('click')
  },
  parameters: {
    docs: {
      storyDescription: 'test'
    }
  }
})

export const Default: any = Template.bind({})
Default.args = {
  items,
  value
}
