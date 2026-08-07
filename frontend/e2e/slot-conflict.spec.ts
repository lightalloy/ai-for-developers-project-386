import { expect, test } from '@playwright/test'
import { fillGuestForm, openEventType } from './helpers'

test.describe('Slot conflict', () => {
  test('two browser contexts: only one booking wins', async ({ browser }) => {
    const contextA = await browser.newContext()
    const contextB = await browser.newContext()
    const pageA = await contextA.newPage()
    const pageB = await contextB.newPage()

    await openEventType(pageA, 'office-hours')
    await openEventType(pageB, 'office-hours')

    const startAt = await pageA.getByTestId('slot-button').first().getAttribute('data-start')
    expect(startAt).toBeTruthy()

    const slotA = pageA.locator(`[data-testid="slot-button"][data-start="${startAt}"]`)
    const slotB = pageB.locator(`[data-testid="slot-button"][data-start="${startAt}"]`)
    await slotA.click()
    await slotB.click()

    await fillGuestForm(pageA, { name: 'Alice', email: 'alice@example.com' })
    await fillGuestForm(pageB, { name: 'Bob', email: 'bob@example.com' })

    const waitA = pageA.waitForResponse(
      (res) => res.url().includes('/bookings') && res.request().method() === 'POST',
    )
    const waitB = pageB.waitForResponse(
      (res) => res.url().includes('/bookings') && res.request().method() === 'POST',
    )

    await Promise.all([
      pageA.getByTestId('submit-booking').click(),
      pageB.getByTestId('submit-booking').click(),
    ])

    const [resA, resB] = await Promise.all([waitA, waitB])
    const statuses = [resA.status(), resB.status()].sort()
    expect(statuses).toEqual([201, 409])

    const successA = await pageA.getByTestId('booking-success').isVisible().catch(() => false)
    const successB = await pageB.getByTestId('booking-success').isVisible().catch(() => false)
    expect(successA !== successB).toBe(true)

    const loser = successA ? pageB : pageA
    await expect(loser.getByTestId('error-banner')).toBeVisible()

    await pageA.goto('/book/office-hours')
    await expect(pageA.getByTestId('slot-list')).toBeVisible()
    await expect(
      pageA.locator(`[data-testid="slot-button"][data-start="${startAt}"]`),
    ).toHaveCount(0)

    await contextA.close()
    await contextB.close()
  })
})
