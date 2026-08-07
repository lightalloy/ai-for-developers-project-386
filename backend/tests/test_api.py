from collections.abc import Generator

import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.db import get_session
from app.main import app


@pytest.fixture()
def client() -> Generator[TestClient, None, None]:
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)

    def get_test_session() -> Generator[Session, None, None]:
        with Session(engine) as session:
            yield session

    app.dependency_overrides[get_session] = get_test_session
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


def test_owner(client: TestClient) -> None:
    response = client.get("/admin/owner")
    assert response.status_code == 200
    body = response.json()
    assert body["id"] == "owner-1"
    assert "email" in body


def test_booking_flow_and_conflict(client: TestClient) -> None:
    created = client.post(
        "/admin/event-types",
        json={
            "id": "consult",
            "title": "Consultation",
            "description": "30 min call",
            "durationMinutes": 60,
        },
    )
    assert created.status_code == 201

    other = client.post(
        "/admin/event-types",
        json={
            "id": "demo",
            "title": "Demo",
            "description": "Product demo",
            "durationMinutes": 60,
        },
    )
    assert other.status_code == 201

    slots = client.get("/event-types/consult/slots")
    assert slots.status_code == 200
    available = slots.json()
    assert len(available) > 0
    start_at = available[0]["startAt"]

    booking = client.post(
        "/bookings",
        json={
            "eventTypeId": "consult",
            "startAt": start_at,
            "guest": {"name": "Anna", "email": "anna@example.com"},
        },
    )
    assert booking.status_code == 201, booking.text
    booking_id = booking.json()["id"]

    conflict = client.post(
        "/bookings",
        json={
            "eventTypeId": "demo",
            "startAt": start_at,
            "guest": {"name": "Bob", "email": "bob@example.com"},
        },
    )
    assert conflict.status_code == 409
    assert conflict.json()["code"] == "slot_conflict"

    meetings = client.get("/admin/meetings")
    assert meetings.status_code == 200
    assert any(m["bookingId"] == booking_id for m in meetings.json())

    cancelled = client.post(f"/bookings/{booking_id}/cancel")
    assert cancelled.status_code == 200
    assert cancelled.json()["status"] == "cancelled"

    again = client.post(f"/admin/bookings/{booking_id}/cancel")
    assert again.status_code == 409
