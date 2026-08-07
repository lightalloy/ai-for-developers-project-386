# Calendar booking API

## Run

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e ".[dev]"
uvicorn app.main:app --reload --port 8000
```

При старте создаётся SQLite-база и подставляются демо-типы событий
(`intro-call`, `office-hours`, `deep-dive`, `pair-session`), если их ещё нет.

## Test

```bash
cd backend && source .venv/bin/activate && pytest -q
```
