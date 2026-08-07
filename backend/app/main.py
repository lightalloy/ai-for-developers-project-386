from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.db import init_db
from app.errors import AppError, app_error_handler
from app.routers import admin, guest
from app.seed import seed_event_types


@asynccontextmanager
async def lifespan(_app: FastAPI):
    init_db()
    seed_event_types()
    yield


app = FastAPI(
    title="Calendar Booking API",
    version="0.1.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_exception_handler(AppError, app_error_handler)
app.include_router(admin.router)
app.include_router(guest.router)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}
