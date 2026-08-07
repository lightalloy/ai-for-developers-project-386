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

Тесты API:

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

## E2E (Playwright)

Поднимает Vite + FastAPI на изолированной SQLite (`backend/calendar.e2e.db`).

```bash
cd frontend
npm install
npx playwright install chromium
CI=1 npm run test:e2e
```

Если видишь `Executable doesn't exist ... chrome-headless-shell` — браузеры не установлены в `~/.cache/ms-playwright`. Снова:

```bash
npx playwright install chromium
```

`CI=1` заставляет поднять свежие серверы с e2e-базой (не переиспользовать локальный `:8000`/`:5173`).
Перед прогоном `e2e/clean-db.mjs` удаляет `backend/calendar.e2e.db`.

Интерактивно: `npm run test:e2e:ui`

Кейсы:

- гость: каталог → слот → бронь
- конфликт: два browser context на один слот
- админ: create / meetings / cancel / delete

## Слоты

Каждый день 09:00–18:00 Europe/Moscow, шаг = `durationMinutes`, окно 14 дней.
Занятость общая для всех типов событий.
