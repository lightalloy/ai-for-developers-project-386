# Calendar

Учебный календарь записи без регистрации.

- Контракт: [`openapi.yaml`](openapi.yaml)
- Backend: FastAPI + SQLite (`backend/`)
- Frontend: Vite + React + TypeScript (`frontend/`)

## Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

Тесты:

```bash
cd backend && source .venv/bin/activate && pytest -q
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

UI: http://localhost:5173 (прокси на API `:8000`)

- `/` — каталог типов и запись
- `/admin` — типы событий и предстоящие встречи

## Слоты

Каждый день 09:00–18:00 Europe/Moscow, шаг = `durationMinutes`, окно 14 дней.
Занятость общая для всех типов событий.
