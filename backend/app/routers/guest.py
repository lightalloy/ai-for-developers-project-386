from fastapi import APIRouter, Depends, status
from sqlmodel import Session, select

from app.db import get_session
from app.errors import NotFoundError
from app.models import EventType
from app.schemas import AvailableSlot, BookingOut, CreateBooking, EventTypeOut
from app.services.bookings import booking_to_out, cancel_booking, create_booking
from app.services.slots import generate_available_slots

router = APIRouter(tags=["Guest"])


def event_type_to_out(row: EventType) -> EventTypeOut:
    return EventTypeOut(
        id=row.id,
        title=row.title,
        description=row.description,
        durationMinutes=row.duration_minutes,
    )


@router.get("/event-types", response_model=list[EventTypeOut])
def index_event_types(session: Session = Depends(get_session)) -> list[EventTypeOut]:
    rows = session.exec(select(EventType).order_by(EventType.id)).all()
    return [event_type_to_out(row) for row in rows]


@router.get("/event-types/{id}/slots", response_model=list[AvailableSlot])
def list_slots(id: str, session: Session = Depends(get_session)) -> list[AvailableSlot]:
    event_type = session.get(EventType, id)
    if event_type is None:
        raise NotFoundError("not_found", f"Event type '{id}' not found")
    slots = generate_available_slots(session, event_type)
    return [
        AvailableSlot(eventTypeId=id, startAt=start, endAt=end)
        for start, end in slots
    ]


@router.post("/bookings", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
def create_booking_endpoint(
    body: CreateBooking,
    session: Session = Depends(get_session),
) -> BookingOut:
    return booking_to_out(create_booking(session, body))


@router.post("/bookings/{id}/cancel", response_model=BookingOut)
def guest_cancel_booking(id: str, session: Session = Depends(get_session)) -> BookingOut:
    return booking_to_out(cancel_booking(session, id))
