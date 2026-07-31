import { expect, test } from '@playwright/test'

test.use({ viewport: { width: 500, height: 500 } })

test.describe('ColourBar', () => {
  test('should exist', async ({ mount }) => {
    const component = await mount('components/ColourBar/Default')
    await expect(component.getByTestId('colourbar')).toBeVisible()
  })
})
