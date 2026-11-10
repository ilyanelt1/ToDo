# To-Do List

Веб-приложение для управления задачами. Поддерживает создание, редактирование, отметку выполнения, фильтрацию и удаление задач.

## Возможности

- Добавление и редактирование задач.
- Отметка задач как выполненных.
- Удаление отдельных задач и всех выполненных задач.
- Фильтры: все, активные и выполненные.
- PostgreSQL для постоянного хранения данных.
- Docker Compose для запуска всего приложения.
- SQL-миграции для создания таблицы задач и отката её создания.

## Технологии

- **Backend:** Python 3.12+, FastAPI, SQLAlchemy 2, Pydantic v2, asyncpg.
- **Frontend:** React 18, TypeScript, Vite, Tailwind CSS, Nginx.
- **Database:** PostgreSQL 16.
- **Infrastructure:** Docker, Docker Compose.
- **Tests:** pytest, pytest-asyncio, HTTPX.

## Запуск через Docker Compose

Необходимы Docker Desktop (или Docker Engine) и Docker Compose v2.

Из корня репозитория выполни:

```bash
docker compose up --build -d
```

После запуска приложение будет доступно:

- Frontend: http://localhost:8080
- Backend API: http://localhost:8080/api/todos
- API health check: http://localhost:8080/health
- Swagger UI: http://localhost:8080/docs

Compose поднимает PostgreSQL, применяет миграцию создания таблицы, запускает backend и затем frontend. Миграция выполняется отдельным одноразовым сервисом и не запускается повторно, если уже отмечена как применённая.

Посмотреть состояние сервисов и логи:

```bash
docker compose ps
docker compose logs -f
docker compose logs -f backend
docker compose logs -f migrate
```

Остановить приложение:

```bash
docker compose down
```

Остановить приложение и удалить данные PostgreSQL:

```bash
docker compose down -v
```

> Команда с `-v` удаляет том PostgreSQL вместе со всеми сохранёнными задачами.

## Переменные окружения

Можно создать в корне файл `.env`:

```dotenv
POSTGRES_DB=todo
POSTGRES_USER=todo
POSTGRES_PASSWORD=change_me
FRONTEND_PORT=8080
ALLOWED_ORIGINS=http://localhost:8080
```

Для реального развёртывания обязательно задай надёжный пароль PostgreSQL. Не добавляй файл `.env` в Git.

## Миграции базы данных

Файлы миграций находятся в `backend/migrations`:

| Файл                        | Назначение                      |
| --------------------------- | ------------------------------- |
| `001_create_todos.up.sql`   | Создаёт таблицу `todos`         |
| `001_create_todos.down.sql` | Удаляет таблицу `todos` (откат) |

Миграции запускаются из каталога `backend`:

```bash
python migrate.py upgrade
```

Для отката:

```bash
python migrate.py downgrade
```

Миграции отмечаются в таблице `schema_migrations`. Откат удаляет таблицу задач и все данные в ней. Не запускай downgrade на базе с нужными данными.

## API

Все маршруты задач имеют префикс `/api/todos`.

| Метод  | Endpoint               | Назначение                       |
| ------ | ---------------------- | -------------------------------- |
| GET    | `/api/todos`           | Получить список задач            |
| POST   | `/api/todos`           | Создать задачу                   |
| PATCH  | `/api/todos/{todo_id}` | Изменить название или статус     |
| DELETE | `/api/todos/{todo_id}` | Удалить задачу                   |
| DELETE | `/api/todos/completed` | Удалить выполненные задачи       |
| GET    | `/health`              | Проверить API и подключение к БД |

Пример тела запроса для создания задачи:

```json
{
  "title": "Изучить Docker Compose"
}
```

## Локальный запуск без Docker

### Backend

```bash
cd backend
python -m venv .venv
```

Windows PowerShell:

```powershell
.\.venv\Scripts\Activate.ps1
```

Linux/macOS:

```bash
source .venv/bin/activate
```

Установка и запуск:

```bash
pip install -r requirements-dev.txt
uvicorn app.main:app --reload
```

Для локального запуска можно использовать SQLite, указав:

```bash
DATABASE_URL=sqlite+aiosqlite:///./todo.db
```

Либо задать URL PostgreSQL через переменную `DATABASE_URL`. Миграции из этого проекта предназначены для PostgreSQL.

### Frontend

```bash
cd frontend
npm ci
npm run dev
```

При локальном запуске Vite frontend по умолчанию обращается к API по адресу `http://localhost:8000`. При необходимости задай `VITE_API_URL`.

## Проверка

Backend:

```bash
cd backend
pytest -v
```

Frontend:

```bash
cd frontend
npm run typecheck
npm run lint
npm run build
```

## Структура проекта

```text
.
├── backend/
│   ├── app/
│   ├── migrations/
│   │   ├── 001_create_todos.up.sql
│   │   └── 001_create_todos.down.sql
│   ├── tests/
│   ├── Dockerfile
│   ├── migrate.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   ├── Dockerfile
│   ├── nginx.conf
│   └── package.json
├── docker-compose.yml
└── README.md
```

## Репозиторий

https://github.com/ilyanelt1/ToDo
