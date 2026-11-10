# To-Do List

[![CI](https://github.com/ilyanelt1/ToDo/actions/workflows/ci.yml/badge.svg)](https://github.com/ilyanelt1/ToDo/actions/workflows/ci.yml)

Одностраничное приложение для управления задачами: **FastAPI + React 18 + TypeScript + Tailwind CSS**. Поддерживает полноценный офлайн-режим с фоновой синхронизацией при восстановлении связи.

![Screenshot](./docs/screenshot.png)

## Стек

**Backend:** Python 3.13, FastAPI, SQLAlchemy 2.0 (async), Pydantic v2, PostgreSQL 17 (через asyncpg), aiosqlite (локально), pytest + httpx.

**Frontend:** Vite 5, React 18.3, TypeScript 5.6, Tailwind CSS 3.4, Vitest + Testing Library, ESLint 9 (flat config), Prettier 3.

**Инфраструктура:** Docker Compose, GitHub Actions (CI), pre-commit.

## Ссылки

- **Demo (Vercel):** `<placeholder>`
- **API docs (Railway):** `<placeholder>/docs`
- **GitHub:** [https://github.com/ilyanelt1/ToDo](https://github.com/ilyanelt1/ToDo)

## Запуск локально

Нужны Docker и Docker Compose (рекомендуемый способ) либо Python 3.13+ и Node.js 20+ для ручного запуска.

### Способ 1: Docker Compose (весь стек одной командой)

```bash
docker compose up --build
```

После запуска:

- **Frontend (Nginx):** http://localhost:5173
- **Backend (FastAPI):** http://localhost:8000
- **Swagger UI:** http://localhost:8000/docs
- **PostgreSQL 17:** порт 5432 (внутри сети Docker)

### Способ 2: Ручной запуск

**Backend:**

```bash
cd backend

python -m venv .venv

# Linux / macOS
source .venv/bin/activate

# Windows PowerShell
.\.venv\Scripts\Activate.ps1

pip install -r requirements.txt -r requirements-dev.txt

cp .env.example .env

uvicorn app.main:app --reload
```

API: http://localhost:8000

**Frontend:**

```bash
cd frontend

npm install

cp .env.example .env

npm run dev
```

UI: http://localhost:5173

## Code quality и CI

В проекте настроен строгий CI-пайплайн (GitHub Actions), который запускается на каждый push и pull request в ветку `main`.

Он проверяет:

- **Backend:** Ruff, Mypy, Pytest.
- **Frontend:** ESLint, Prettier, TSC, Vitest, Build.

### Локальный запуск проверок

**Backend:**

```bash
cd backend

ruff check .
ruff format --check .
mypy app/
pytest -q
```

**Frontend:**

```bash
cd frontend

npm run lint
npm run format:check
npm run typecheck
npm run test
npm run build
```

**Pre-commit (корень проекта):**

```bash
pip install pre-commit
pre-commit install
```

## Деплой

### Backend → Railway

1. New Project → Deploy from GitHub.
2. Root Directory: `backend`.
3. Добавь PostgreSQL 17 plugin — Railway автоматически подставит `DATABASE_URL` (замени `postgres://` на `postgresql+asyncpg://`).
4. Variables:

   ```env
   ALLOWED_ORIGINS=https://<vercel-app>.vercel.app
   ```

5. Start Command:

   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port $PORT
   ```

### Frontend → Vercel

1. Import Git Repository.
2. Root Directory: `frontend`.
3. Framework Preset: Vite.
4. Environment:

   ```env
   VITE_API_URL=https://<railway-app>.up.railway.app
   ```

5. Deploy.

## AI-инструменты

| Этап | Инструмент | Что делал |
| :--- | :--- | :--- |
| Спецификация и структура | `<заполнить>` | `<заполнить>` |
| Backend: модели, схемы, роутеры | `<заполнить>` | `<заполнить>` |
| Backend: тесты | `<заполнить>` | `<заполнить>` |
| Frontend: хуки и API | `<заполнить>` | `<заполнить>` |
| Frontend: компоненты | `<заполнить>` | `<заполнить>` |
| CI/CD и рефакторинг | `<заполнить>` | `<заполнить>` |

## Осознанные ограничения

- **Без аутентификации.** В продакшене использовались бы JWT + refresh-token и scope по пользователю. Для тестового задания не требуется.
- **Без пагинации.** `GET /api/todos` возвращает все задачи. Для небольших списков (<1000) этого достаточно; при росте проекта можно добавить курсорную пагинацию по `id`.
- **Офлайн-синхронизация (Optimistic UI).** Если бэкенд недоступен, фронтенд переключается в офлайн-режим (бейдж `offline`) и записывает изменения в `localStorage`. Все мутации складываются в очередь. Когда связь восстанавливается, очередь отправляется на сервер, а временные `id` заменяются на реальные. Ограничение: нет разрешения конфликтов (CRDT/OT), если в одну и ту же задачу вносятся изменения с двух разных устройств одновременно.
- **SQLite в dev, PostgreSQL в prod.** `create_all` в lifespan для тестового задания достаточно; в продакшене использовался бы Alembic.
