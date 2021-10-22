import { storiesOf } from '@storybook/vue'
import { withKnobs, text, boolean } from '@storybook/addon-knobs'
import Vue2ssdViewer from './Vue2ssdViewer.vue'

export const DefaultText = 'Get Ready To Play'

storiesOf('Text', module)
  .addDecorator(withKnobs)
  .add('Default', () => ({
    components: { Vue2ssdViewer },
    props: {
      largeText: {
        default: boolean('Large Text', false)
      },
      data: {
        default: text('Text', DefaultText)
      }
    },
    template: '<Vue2ssdViewer :data="data" :largeText="largeText"  /> '
  }))
