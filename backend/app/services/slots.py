from datetime import UTC, datetime, timedelta

from sqlmodel import Session, col, select

from app.config import (
    DAY_END_HOUR,
    DAY_START_HOUR,
    TZ,
    WINDOW_DAYS,
)
from app.models import Booking, BookingStatus, EventType
from app.services.timeutil import ensure_utc


def overlaps(a_start: datetime, a_end: datetime, b_start: datetime, b_end: datetime) -> bool:
    return a_start < b_end and a_end > b_start


def list_confirmed_in_range(
    session: Session,
    range_start: datetime,
    range_end: datetime,
) -> list[Booking]:
    statement = select(Booking).where(
        Booking.status == BookingStatus.confirmed,
        col(Booking.start_at) < range_end,
        col(Booking.end_at) > range_start,
    )
    rows = list(session.exec(statement).all())
    for row in rows:
        row.start_at = ensure_utc(row.start_at)
        row.end_at = ensure_utc(row.end_at)
    return rows


def iter_candidate_slots(
    event_type: EventType,
    *,
    now: datetime | None = None,
) -> list[tuple[datetime, datetime]]:
    """All grid slots in the window (including busy), still in the future."""
    now_msk = (now or datetime.now(tz=TZ)).astimezone(TZ)
    today = now_msk.date()
    duration = timedelta(minutes=event_type.duration_minutes)

    slots: list[tuple[datetime, datetime]] = []
    for day_offset in range(WINDOW_DAYS):
        day = today + timedelta(days=day_offset)
        cursor = datetime(day.year, day.month, day.day, DAY_START_HOUR, 0, tzinfo=TZ)
        day_end = datetime(day.year, day.month, day.day, DAY_END_HOUR, 0, tzinfo=TZ)

        while cursor + duration <= day_end:
            start = cursor
            end = cursor + duration
            cursor = cursor + duration
            if start < now_msk:
                continue
            slots.append((start.astimezone(UTC), end.astimezone(UTC)))
    return slots


def generate_available_slots(
    session: Session,
    event_type: EventType,
    *,
    now: datetime | None = None,
) -> list[tuple[datetime, datetime]]:
    """Return free (start_utc, end_utc) slots for the event type."""
    candidates = iter_candidate_slots(event_type, now=now)
    if not candidates:
        return []

    window_start = candidates[0][0]
    window_end = candidates[-1][1]
    busy = list_confirmed_in_range(session, window_start, window_end)

    return [
        (start_utc, end_utc)
        for start_utc, end_utc in candidates
        if not any(overlaps(start_utc, end_utc, b.start_at, b.end_at) for b in busy)
    ]