import { test, expect } from '@playwright/experimental-ct-vue'
import ColourBar from '../src/components/ColourBar.vue'

test.use({ viewport: { width: 500, height: 500 } })

test('should exist', async ({ mount }) => {
  const component = await mount(ColourBar)
  expect(component.getByTestId('colourbar')).toBeTruthy()
})

