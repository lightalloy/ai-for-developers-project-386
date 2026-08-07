import type {
  AvailableSlot,
  Booking,
  CalendarOwner,
  CreateBooking,
  CreateEventType,
  ErrorBody,
  EventType,
  UpcomingMeeting,
} from './types'

export class ApiError extends Error {
  status: number
  body: ErrorBody

  constructor(status: number, body: ErrorBody) {
    super(body.message)
    this.status = status
    this.body = body
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (response.status === 204) {
    return undefined as T
  }

  const text = await response.text()
  const data = text ? JSON.parse(text) : null

  if (!response.ok) {
    throw new ApiError(
      response.status,
      data ?? { code: 'error', message: response.statusText },
    )
  }

  return data as T
}

export const api = {
  getOwner: () => request<CalendarOwner>('/admin/owner'),

  listAdminEventTypes: () => request<EventType[]>('/admin/event-types'),

  createEventType: (body: CreateEventType) =>
    request<EventType>('/admin/event-types', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  deleteEventType: (id: string) =>
    request<void>(`/admin/event-types/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    }),

  listMeetings: () => request<UpcomingMeeting[]>('/admin/meetings'),

  adminCancelBooking: (id: string) =>
    request<Booking>(`/admin/bookings/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
    }),

  listEventTypes: () => request<EventType[]>('/event-types'),

  listSlots: (id: string) =>
    request<AvailableSlot[]>(`/event-types/${encodeURIComponent(id)}/slots`),

  createBooking: (body: CreateBooking) =>
    request<Booking>('/bookings', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  cancelBooking: (id: string) =>
    request<Booking>(`/bookings/${encodeURIComponent(id)}/cancel`, {
      method: 'POST',
    }),
}
