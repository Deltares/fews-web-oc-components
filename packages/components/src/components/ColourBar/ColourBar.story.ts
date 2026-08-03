import { defineComponent, h } from 'vue'
import ColourBarVue from './ColourBar.vue'
import type { ColourMap } from '@deltares/fews-web-oc-charts'

const defaultColourMap: ColourMap = [
  { lowerValue: 0, color: '#313695' },
  { lowerValue: 25, color: '#4575b4' },
  { lowerValue: 50, color: '#74add1' },
  { lowerValue: 75, color: '#abd9e9' },
  { lowerValue: 100, color: '#e0f3f8' },
]

export const Default = defineComponent(() => () =>
  h(ColourBarVue, { colourMap: defaultColourMap, width: 250, height: 20 }),
)

export default Default
