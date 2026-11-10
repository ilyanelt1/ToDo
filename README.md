# To-Do List

[![CI](https://github.com/ilyanelt1/ToDo/actions/workflows/ci.yml/badge.svg)](https://github.com/ilyanelt1/ToDo/actions/workflows/ci.yml)

Одностраничное приложение для управления задачами с офлайн-режимом и фоновой синхронизацией после восстановления соединения.

## Возможности

- Создание, редактирование и удаление задач.
- Отметка задач как выполненных и удаление всех выполненных задач.
- Фильтрация списка задач.
- Оптимистичное обновление интерфейса.
- Локальное сохранение задач и очереди операций в `localStorage`.
- Повторная отправка отложенных операций после восстановления соединения.
- REST API с проверкой входных данных и обработкой ошибок.

## Технологический стек

**Backend:** Python 3.13, FastAPI, SQLAlchemy 2 (async), Pydantic v2, PostgreSQL 17, SQLite для локального запуска, pytest, httpx.

**Frontend:** React 18, TypeScript, Vite 5, Tailwind CSS 3, Vitest, Testing Library, ESLint, Prettier.

**Инфраструктура:** Docker Compose, Nginx, GitHub Actions.

## Архитектура

- Backend предоставляет REST API по адресу `/api/todos`.
- Frontend обращается к API по относительному пути `/api`.
- В Docker Compose Nginx принимает запросы браузера и проксирует API-запросы в backend внутри Docker-сети.
- При локальном запуске Vite использует proxy на `http://127.0.0.1:8000`.
- PostgreSQL используется в Docker-сценарии. Для локального запуска backend по умолчанию использует SQLite.
- Перед запуском backend в Docker отдельный сервис `migrate` применяет SQL-миграции.

## Быстрый запуск через Docker Compose

**Требования:** Docker Desktop (или Docker Engine) и Docker Compose v2.

1. Склонируйте репозиторий и перейдите в его корень:

   ```bash
   git clone https://github.com/ilyanelt1/ToDo.git
   cd ToDo
   ```

2. Создайте локальный файл окружения:

   **Linux / macOS / Git Bash:**
   ```bash
   cp .env.example .env
   ```

   **Windows PowerShell:**
   ```powershell
   Copy-Item .env.example .env
   ```

3. Откройте `.env` и замените `POSTGRES_PASSWORD` на длинный случайный пароль. Для значения пароля используйте hex-строку, чтобы специальные символы не ломали URL подключения к PostgreSQL.

4. Соберите и запустите сервисы:

   ```bash
   docker compose up --build -d
   ```

5. Проверьте состояние контейнеров:

   ```bash
   docker compose ps
   docker compose logs -f backend migrate
   ```

После запуска откройте адреса:

| Сервис | Адрес |
| --- | --- |
| Frontend | http://localhost:8081 |
| API через Nginx | http://localhost:8081/api/todos |
| Swagger UI | http://localhost:8081/docs |
| Health check backend | http://localhost:8081/health |

Порт frontend задаётся переменной `FRONTEND_PORT` в корневом `.env`. В примере используется `8081`. Backend и PostgreSQL не публикуют порты на хост: они доступны другим контейнерам во внутренней Docker-сети. Поэтому API и Swagger UI открываются через Nginx.

Остановить сервисы:

```bash
docker compose down
```

Данные PostgreSQL сохраняются в Docker volume `postgres_data`. Не используйте `docker compose down -v`, если хотите сохранить базу данных.

## Локальный запуск без Docker

**Требования:** Python 3.13+, Node.js 22+ и npm.

### 1. Backend

Откройте первый терминал:

```bash
cd backend
python -m venv .venv
```

Активируйте виртуальное окружение.

**Linux / macOS:**
```bash
source .venv/bin/activate
```

**Windows PowerShell:**
```powershell
.\.venv\Scripts\Activate.ps1
```

Установите зависимости и запустите API:

```bash
python -m pip install -r requirements.txt -r requirements-dev.txt
uvicorn app.main:app --reload
```

При локальном запуске без `DATABASE_URL` backend использует SQLite и создаёт таблицы автоматически. API будет доступно на http://127.0.0.1:8000, документация — http://127.0.0.1:8000/docs.

### 2. Frontend

Откройте второй терминал:

```bash
cd frontend
npm ci
npm run dev
```

Откройте адрес Vite, обычно http://localhost:5173. Запросы к `/api`, `/docs`, `/openapi.json` и `/health` проксируются на локальный backend через настройки Vite.

Если backend запущен не на `127.0.0.1:8000`, измените target в `frontend/vite.config.ts`.

## API

| Метод | Endpoint | Назначение |
| --- | --- | --- |
| GET | `/api/todos` | Получить список задач |
| POST | `/api/todos` | Создать задачу |
| PATCH | `/api/todos/{id}` | Изменить название или статус задачи |
| DELETE | `/api/todos/{id}` | Удалить задачу |
| DELETE | `/api/todos/completed` | Удалить все выполненные задачи |
| GET | `/health` | Проверить доступность backend и базы данных |

Интерактивная документация OpenAPI доступна по адресу `/docs` на backend или через Nginx в Docker-сценарии.

## Тестирование и проверки качества

GitHub Actions запускает проверки backend и frontend при push и pull request в `main`.

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
npm ci
npm run lint
npm run format:check
npm run typecheck
npm run test
npm run build
```

## Офлайн-режим и ограничения

Когда API недоступно, приложение продолжает показывать локальный список задач и сохраняет новые операции в `localStorage`. После восстановления соединения приложение повторяет запросы и синхронизирует очередь с сервером.

Текущая реализация предназначена для персонального списка задач и учебного/портфолио-проекта. В ней пока нет:

- аутентификации и разделения задач по пользователям;
- разрешения конфликтов при одновременном изменении одной задачи с нескольких устройств;
- пагинации списка задач;
- автоматического развёртывания в публичном облаке.

В Docker используется PostgreSQL и отдельный SQL-скрипт миграций. При локальном запуске SQLite схема создаётся через SQLAlchemy. Для более сложной истории изменений схемы в дальнейшем можно перейти на Alembic.

## Структура проекта

```text
.
├── backend/
│   ├── app/
│   │   ├── routers/
│   │   ├── config.py
│   │   ├── crud.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── schemas.py
│   ├── migrations/
│   ├── tests/
│   ├── Dockerfile
│   └── migrate.py
├── frontend/
│   ├── src/
│   │   ├── api/
│   │   ├── components/
│   │   └── hooks/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── vite.config.ts
├── .env.example
├── docker-compose.yml
└── README.md
```

## Лицензия

Лицензия в репозитории пока не указана.
