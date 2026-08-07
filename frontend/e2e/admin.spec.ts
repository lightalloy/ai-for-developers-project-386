import { expect, test } from '@playwright/test'
import { fillGuestForm, openEventType } from './helpers'

test.describe('Admin', () => {
  test('owner, create type, meetings, cancel, delete rules', async ({ page }) => {
    const eventId = `e2e-${Date.now()}`
    const title = `E2E Meetup ${eventId}`

    await page.goto('/admin')
    await expect(page.getByTestId('admin-owner')).toContainText('Calendar Owner')

    await page.getByTestId('admin-event-id').fill(eventId)
    await page.getByTestId('admin-event-title').fill(title)
    await page.getByTestId('admin-event-description').fill('Создано интеграционным тестом')
    await page.getByTestId('admin-event-duration').fill('30')
    await page.getByTestId('admin-create-submit').click()

    await expect(
      page.locator(`[data-testid="admin-event-type-row"][data-event-type-id="${eventId}"]`),
    ).toBeVisible()

    await page.goto('/')
    await expect(
      page.locator(`[data-testid="event-type-card"][data-event-type-id="${eventId}"]`),
    ).toBeVisible()

    await openEventType(page, eventId)
    await page.getByTestId('slot-button').first().click()
    await fillGuestForm(page, {
      name: 'Guest Admin Flow',
      email: 'guest.admin@example.com',
    })
    await page.getByTestId('submit-booking').click()
    await expect(page.getByTestId('booking-success')).toBeVisible()

    await page.goto('/admin')
    const meeting = page.getByTestId('meeting-row').filter({ hasText: title })
    await expect(meeting).toBeVisible()

    const typeRow = page.locator(
      `[data-testid="admin-event-type-row"][data-event-type-id="${eventId}"]`,
    )
    await typeRow.getByTestId('admin-delete-event-type').click()
    await expect(page.getByTestId('error-banner')).toContainText('future')

    await meeting.getByTestId('admin-cancel-meeting').click()
    await expect(meeting).toHaveCount(0)

    await typeRow.getByTestId('admin-delete-event-type').click()
    await expect(typeRow).toHaveCount(0)
  })
})
