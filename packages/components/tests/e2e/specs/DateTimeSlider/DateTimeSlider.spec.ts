import { expect, test } from '@playwright/test'

test.describe('DateTimeSlider', () => {
  test('should toggle now mode when now button is clicked', async ({
    mount,
  }) => {
    const component = await mount(
      'components/DateTimeSlider/DateTimeSlider/Stateful',
    )
    await expect(component.getByRole('status')).toBeVisible()
    await expect(
      component.getByRole('slider').getByText('/21/2099, 2:00:00 AM'),
    ).toBeHidden()
  })
})
