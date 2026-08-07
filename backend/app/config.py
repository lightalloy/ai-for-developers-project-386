from dataclasses import dataclass
from zoneinfo import ZoneInfo

TZ = ZoneInfo("Europe/Moscow")
WINDOW_DAYS = 14
DAY_START_HOUR = 9
DAY_END_HOUR = 18


@dataclass(frozen=True)
class OwnerProfile:
    id: str
    display_name: str
    email: str


OWNER = OwnerProfile(
    id="owner-1",
    display_name="Calendar Owner",
    email="owner@example.com",
)

DATABASE_URL = "sqlite:///./calendar.db"
