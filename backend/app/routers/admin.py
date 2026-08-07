from fastapi import APIRouter, Depends, Response, status
from sqlmodel import Session, col, select

from app.config import OWNER
from app.db import get_session
from app.errors import ConflictError, NotFoundError
from app.models import Booking, BookingStatus, EventType
from app.schemas import (
    BookingOut,
    CalendarOwner,
    CreateEventType,
    EventTypeOut,
    GuestInfo,
    UpcomingMeeting,
)
from app.services.bookings import booking_to_out, cancel_booking
from app.services.timeutil import ensure_utc, utc_now

router = APIRouter(prefix="/admin", tags=["Admin"])


def event_type_to_out(row: EventType) -> EventTypeOut:
    return EventTypeOut(
        id=row.id,
        title=row.title,
        description=row.description,
        durationMinutes=row.duration_minutes,
    )


@router.get("/owner", response_model=CalendarOwner)
def get_owner() -> CalendarOwner:
    return CalendarOwner(
        id=OWNER.id,
        displayName=OWNER.display_name,
        email=OWNER.email,
    )


@router.get("/event-types", response_model=list[EventTypeOut], tags=["Admin"])
def index_event_types(session: Session = Depends(get_session)) -> list[EventTypeOut]:
    rows = session.exec(select(EventType).order_by(EventType.id)).all()
    return [event_type_to_out(row) for row in rows]


@router.post(
    "/event-types",
    response_model=EventTypeOut,
    status_code=status.HTTP_201_CREATED,
    tags=["Admin"],
)
def create_event_type(
    body: CreateEventType,
    session: Session = Depends(get_session),
) -> EventTypeOut:
    if session.get(EventType, body.id) is not None:
        raise ConflictError("duplicate_id", f"Event type id '{body.id}' already exists")
    row = EventType(
        id=body.id,
        title=body.title,
        description=body.description,
        duration_minutes=body.durationMinutes,
    )
    session.add(row)
    session.commit()
    session.refresh(row)
    return event_type_to_out(row)


@router.delete(
    "/event-types/{id}",
    status_code=status.HTTP_204_NO_CONTENT,
    response_class=Response,
    tags=["Admin"],
)
def delete_event_type(id: str, session: Session = Depends(get_session)) -> Response:
    row = session.get(EventType, id)
    if row is None:
        raise NotFoundError("not_found", f"Event type '{id}' not found")

    now = utc_now()
    future = session.exec(
        select(Booking).where(
            Booking.event_type_id == id,
            Booking.status == BookingStatus.confirmed,
            col(Booking.start_at) >= now,
        )
    ).first()
    if future is not None:
        raise ConflictError(
            "has_future_bookings",
            "Cannot delete event type with confirmed future bookings",
        )

    session.delete(row)
    session.commit()
    return Response(status_code=status.HTTP_204_NO_CONTENT)


@router.get("/meetings", response_model=list[UpcomingMeeting], tags=["Admin"])
def list_meetings(session: Session = Depends(get_session)) -> list[UpcomingMeeting]:
    now = utc_now()
    statement = (
        select(Booking, EventType)
        .join(EventType, col(Booking.event_type_id) == EventType.id)
        .where(
            Booking.status == BookingStatus.confirmed,
            col(Booking.start_at) >= now,
        )
        .order_by(col(Booking.start_at))
    )
    results = session.exec(statement).all()
    meetings: list[UpcomingMeeting] = []
    for booking, event_type in results:
        meetings.append(
            UpcomingMeeting(
                bookingId=booking.id,
                eventTypeId=booking.event_type_id,
                eventTypeTitle=event_type.title,
                startAt=ensure_utc(booking.start_at),
                endAt=ensure_utc(booking.end_at),
                guest=GuestInfo(
                    name=booking.guest_name,
                    email=booking.guest_email,
                    phone=booking.guest_phone,
                ),
                status=booking.status,
            )
        )
    return meetings


@router.post("/bookings/{id}/cancel", response_model=BookingOut, tags=["Admin"])
def admin_cancel_booking(id: str, session: Session = Depends(get_session)) -> BookingOut:
    return booking_to_out(cancel_booking(session, id))
