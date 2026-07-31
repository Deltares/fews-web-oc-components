import { expect, test } from '@playwright/test'

test.describe('DateTimeSlider', () => {
  test('should toggle now mode when now button is clicked', async ({ mount }) => {
    const component = await mount('components/DateTimeSlider/DateTimeSlider/Stateful')

    await expect(component.getByText(/10\/22\/2099/)).toBeVisible()
    await expect(component.getByTestId('now-value')).toHaveValue('false')

    await component.locator('button').first().click()

    await expect(component.getByTestId('now-value')).toHaveValue('true')
  })
})
