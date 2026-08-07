import { expect, type Page } from '@playwright/test'

export async function openEventType(page: Page, eventTypeId: string) {
  await page.goto('/')
  await expect(page.getByTestId('event-type-list')).toBeVisible()
  const card = page.locator(`[data-testid="event-type-card"][data-event-type-id="${eventTypeId}"]`)
  await expect(card).toBeVisible()
  await card.getByTestId('select-event-type').click()
  await expect(page).toHaveURL(new RegExp(`/book/${eventTypeId}`))
  await expect(page.getByTestId('slot-list')).toBeVisible()
}

export async function fillGuestForm(
  page: Page,
  guest: { name: string; email: string; phone?: string },
) {
  await page.getByTestId('guest-name').fill(guest.name)
  await page.getByTestId('guest-email').fill(guest.email)
  if (guest.phone) {
    await page.getByTestId('guest-phone').fill(guest.phone)
  }
}
