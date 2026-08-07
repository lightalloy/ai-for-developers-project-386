from fastapi import Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel


class ErrorBody(BaseModel):
    code: str
    message: str


class AppError(Exception):
    def __init__(self, status_code: int, code: str, message: str) -> None:
        self.status_code = status_code
        self.code = code
        self.message = message
        super().__init__(message)


class BadRequestError(AppError):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(400, code, message)


class NotFoundError(AppError):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(404, code, message)


class ConflictError(AppError):
    def __init__(self, code: str, message: str) -> None:
        super().__init__(409, code, message)


async def app_error_handler(_request: Request, exc: AppError) -> JSONResponse:
    return JSONResponse(
        status_code=exc.status_code,
        content=ErrorBody(code=exc.code, message=exc.message).model_dump(),
    )
