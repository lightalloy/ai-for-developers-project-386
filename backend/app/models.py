from datetime import datetime
from enum import Enum

from sqlalchemy import Column, DateTime, Index, String
from sqlmodel import Field, SQLModel


class BookingStatus(str, Enum):
    confirmed = "confirmed"
    cancelled = "cancelled"


class EventType(SQLModel, table=True):
    __tablename__ = "event_types"

    id: str = Field(primary_key=True, max_length=100)
    title: str
    description: str
    duration_minutes: int = Field(ge=1)


class Booking(SQLModel, table=True):
    __tablename__ = "bookings"
    __table_args__ = (
        Index("ix_bookings_status_start", "status", "start_at"),
    )

    id: str = Field(primary_key=True)
    event_type_id: str = Field(foreign_key="event_types.id", index=True)
    start_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))
    end_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))
    guest_name: str
    guest_email: str
    guest_phone: str | None = None
    status: BookingStatus = Field(
        default=BookingStatus.confirmed,
        sa_column=Column(String, nullable=False, index=True),
    )
    created_at: datetime = Field(sa_column=Column(DateTime(timezone=True), nullable=False))
