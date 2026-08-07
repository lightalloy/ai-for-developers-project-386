from datetime import UTC, datetime


def ensure_utc(dt: datetime) -> datetime:
    """Normalize datetimes from API/DB to timezone-aware UTC."""
    if dt.tzinfo is None:
        return dt.replace(tzinfo=UTC)
    return dt.astimezone(UTC)


def utc_now() -> datetime:
    return datetime.now(tz=UTC)
