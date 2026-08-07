from datetime import datetime
from enum import Enum

from pydantic import BaseModel, ConfigDict, EmailStr, Field


class BookingStatus(str, Enum):
    confirmed = "confirmed"
    cancelled = "cancelled"


class CalendarOwner(BaseModel):
    id: str
    displayName: str
    email: EmailStr


class EventTypeOut(BaseModel):
    id: str
    title: str
    description: str
    durationMinutes: int = Field(ge=1)


class CreateEventType(BaseModel):
    id: str
    title: str
    description: str
    durationMinutes: int = Field(ge=1)


class GuestInfo(BaseModel):
    name: str
    email: EmailStr
    phone: str | None = None


class BookingOut(BaseModel):
    id: str
    eventTypeId: str
    startAt: datetime
    endAt: datetime
    guest: GuestInfo
    status: BookingStatus
    createdAt: datetime


class CreateBooking(BaseModel):
    eventTypeId: str
    startAt: datetime
    guest: GuestInfo


class AvailableSlot(BaseModel):
    eventTypeId: str
    startAt: datetime
    endAt: datetime


class UpcomingMeeting(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    bookingId: str
    eventTypeId: str
    eventTypeTitle: str
    startAt: datetime
    endAt: datetime
    guest: GuestInfo
    status: BookingStatus
