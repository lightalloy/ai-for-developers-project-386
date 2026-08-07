from datetime import timedelta
from threading import Lock
from uuid import uuid4

from sqlmodel import Session, col, select

from app.errors import BadRequestError, ConflictError, NotFoundError
from app.models import Booking, BookingStatus, EventType
from app.schemas import BookingOut, CreateBooking, GuestInfo
from app.services.slots import iter_candidate_slots, overlaps
from app.services.timeutil import ensure_utc, utc_now

# Single-process lock so overlap check + insert cannot race (uvicorn --workers 1).
_booking_lock = Lock()


def booking_to_out(booking: Booking) -> BookingOut:
    return BookingOut(
        id=booking.id,
        eventTypeId=booking.event_type_id,
        startAt=ensure_utc(booking.start_at),
        endAt=ensure_utc(booking.end_at),
        guest=GuestInfo(
            name=booking.guest_name,
            email=booking.guest_email,
            phone=booking.guest_phone,
        ),
        status=booking.status,
        createdAt=ensure_utc(booking.created_at),
    )


def get_event_type(session: Session, event_type_id: str) -> EventType:
    event_type = session.get(EventType, event_type_id)
    if event_type is None:
        raise NotFoundError("not_found", f"Event type '{event_type_id}' not found")
    return event_type


def create_booking(session: Session, body: CreateBooking) -> Booking:
    with _booking_lock:
        event_type = get_event_type(session, body.eventTypeId)
        start_utc = ensure_utc(body.startAt)
        end_utc = start_utc + timedelta(minutes=event_type.duration_minutes)

        candidates = iter_candidate_slots(event_type)
        if not any(s == start_utc for s, _e in candidates):
            raise BadRequestError(
                "invalid_slot",
                "startAt is not a valid slot in the 14-day booking window",
            )

        busy = session.exec(
            select(Booking).where(
                Booking.status == BookingStatus.confirmed,
                col(Booking.start_at) < end_utc,
                col(Booking.end_at) > start_utc,
            )
        ).all()
        if any(
            overlaps(start_utc, end_utc, ensure_utc(b.start_at), ensure_utc(b.end_at))
            for b in busy
        ):
            raise ConflictError("slot_conflict", "Time slot is already booked")

        booking = Booking(
            id=str(uuid4()),
            event_type_id=event_type.id,
            start_at=start_utc,
            end_at=end_utc,
            guest_name=body.guest.name,
            guest_email=str(body.guest.email),
            guest_phone=body.guest.phone,
            status=BookingStatus.confirmed,
            created_at=utc_now(),
        )
        session.add(booking)
        session.commit()
        session.refresh(booking)
        return booking

def cancel_booking(session: Session, booking_id: str) -> Booking:
    booking = session.get(Booking, booking_id)
    if booking is None:
        raise NotFoundError("not_found", f"Booking '{booking_id}' not found")
    if booking.status == BookingStatus.cancelled:
        raise ConflictError("already_cancelled", "Booking is already cancelled")
    booking.status = BookingStatus.cancelled
    session.add(booking)
    session.commit()
    session.refresh(booking)
    return booking
