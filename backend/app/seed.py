"""Demo event types for local/dev startup."""

from sqlmodel import Session, select

from app.db import engine
from app.models import EventType

SEED_EVENT_TYPES: list[EventType] = [
    EventType(
        id="intro-call",
        title="Знакомство",
        description=(
            "Короткий созвон, чтобы понять задачу и договориться о следующем шаге. "
            "Без слайдов — только разговор."
        ),
        duration_minutes=30,
    ),
    EventType(
        id="office-hours",
        title="Разбор вопроса",
        description=(
            "Принеси один конкретный вопрос по коду, архитектуре или процессе. "
            "Разберём вместе и наметим, что делать дальше."
        ),
        duration_minutes=45,
    ),
    EventType(
        id="deep-dive",
        title="Глубокое ревью",
        description=(
            "Совместный разбор черновика, PR или схемы сервиса. "
            "Удобно, если уже есть что показать на экране."
        ),
        duration_minutes=60,
    ),
    EventType(
        id="pair-session",
        title="Парная сессия",
        description=(
            "Пишем или отлаживаем вместе в реальном времени. "
            "Заранее пришли ссылку на репозиторий или черновик."
        ),
        duration_minutes=90,
    ),
]


def seed_event_types() -> int:
    """Insert missing seed event types. Returns how many rows were added."""
    added = 0
    with Session(engine) as session:
        for item in SEED_EVENT_TYPES:
            exists = session.exec(
                select(EventType).where(EventType.id == item.id)
            ).first()
            if exists is not None:
                continue
            session.add(
                EventType(
                    id=item.id,
                    title=item.title,
                    description=item.description,
                    duration_minutes=item.duration_minutes,
                )
            )
            added += 1
        if added:
            session.commit()
    return added
