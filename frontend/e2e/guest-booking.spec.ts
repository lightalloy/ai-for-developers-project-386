import { expect, test } from '@playwright/test'
import { fillGuestForm, openEventType } from './helpers'

test.describe('Guest booking', () => {
  test('catalog → slot → booking success', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { name: 'Виды брони' })).toBeVisible()
    await expect(page.getByText('Знакомство')).toBeVisible()
    await expect(page.getByText('30 мин').first()).toBeVisible()

    await openEventType(page, 'intro-call')
    const firstSlot = page.getByTestId('slot-button').first()
    await expect(firstSlot).toBeVisible()
    await firstSlot.click()

    await fillGuestForm(page, {
      name: 'Анна Гость',
      email: 'anna.guest@example.com',
    })

    const responsePromise = page.waitForResponse(
      (res) => res.url().includes('/bookings') && res.request().method() === 'POST',
    )
    await page.getByTestId('submit-booking').click()
    const response = await responsePromise
    expect(response.status()).toBe(201)

    await expect(page.getByTestId('booking-success')).toBeVisible()
    await expect(page.getByTestId('booking-id')).toContainText('ID:')
  })
})
