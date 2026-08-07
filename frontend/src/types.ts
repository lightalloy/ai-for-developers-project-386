export type BookingStatus = 'confirmed' | 'cancelled'

export interface CalendarOwner {
  id: string
  displayName: string
  email: string
}

export interface EventType {
  id: string
  title: string
  description: string
  durationMinutes: number
}

export interface CreateEventType {
  id: string
  title: string
  description: string
  durationMinutes: number
}

export interface GuestInfo {
  name: string
  email: string
  phone?: string
}

export interface AvailableSlot {
  eventTypeId: string
  startAt: string
  endAt: string
}

export interface Booking {
  id: string
  eventTypeId: string
  startAt: string
  endAt: string
  guest: GuestInfo
  status: BookingStatus
  createdAt: string
}

export interface CreateBooking {
  eventTypeId: string
  startAt: string
  guest: GuestInfo
}

export interface UpcomingMeeting {
  bookingId: string
  eventTypeId: string
  eventTypeTitle: string
  startAt: string
  endAt: string
  guest: GuestInfo
  status: BookingStatus
}

export interface ErrorBody {
  code: string
  message: string
}
