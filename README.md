# To-Do List

Одностраничное приложение для управления задачами: FastAPI + React 18 + TypeScript + Tailwind CSS. Работает онлайн с синхронизацией на бэкенд и офлайн — с локальным хранилищем.

![screenshot](./docs/screenshot.png)

## Стек

**Backend:** Python 3.12, FastAPI 0.115+, SQLAlchemy 2.0 (async), Pydantic v2, aiosqlite (dev) / asyncpg (prod), uvicorn, pytest + httpx.

**Frontend:** Vite 5, React 18.3, TypeScript 5.6, Tailwind CSS 3.4, ESLint 9 (flat config), Prettier 3.

## Ссылки

- Demo (Vercel): `<placeholder>`
- API docs (Railway): `<placeholder>/docs`
- GitHub: https://github.com/ilyanelt1/ToDo

## Запуск локально

Нужны Python 3.12+ и Node.js 20+.

### Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt -r requirements-dev.txt
cp .env.example .env
uvicorn app.main:app --reload
