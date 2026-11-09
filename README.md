# To-Do List

Небольшое веб-приложение для управления личными задачами. Можно добавлять задачи, отмечать их выполненными, редактировать и удалять. Список сохраняется в базе данных, поэтому задачи остаются после перезагрузки страницы.

## Возможности

- Добавление новых задач.
- Отметка задач как выполненных и снятие отметки.
- Удаление отдельных задач.
- Редактирование названия задачи двойным щелчком по ней.
- Фильтрация: все, активные и выполненные задачи.
- Удаление всех выполненных задач.
- Локальное сохранение последнего загруженного списка в браузере.

> Основное постоянное хранилище — база данных backend. Локальное хранилище браузера используется как резерв для отображения списка при недоступности API. Автоматическая синхронизация офлайн-изменений с сервером пока не реализована.

## Технологии

**Backend:** Python 3.12+, FastAPI, SQLAlchemy 2 (async), Pydantic v2, SQLite, aiosqlite, Uvicorn.

**Frontend:** React 18, TypeScript, Vite, Tailwind CSS.

**Тестирование:** pytest, pytest-asyncio, HTTPX.

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
│   ├── tests/
│   ├── requirements.txt
│   └── requirements-dev.txt
└── frontend/
    ├── src/
    │   ├── api/
    │   ├── components/
    │   ├── hooks/
    │   └── types/
    ├── package.json
    └── package-lock.json
```

## Требования

- Python 3.12 или новее.
- Node.js 20 или новее.
- npm.

## Запуск локально

Для запуска открой два терминала: один для backend, второй для frontend.

### 1. Backend

Перейди в каталог backend:

```bash
cd backend
```

Создай и активируй виртуальное окружение.

**Windows (PowerShell):**

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

**Linux / macOS:**

```bash
python3 -m venv .venv
source .venv/bin/activate
```

Установи зависимости:

```bash
python -m pip install -r requirements-dev.txt
```

Запусти API:

```bash
uvicorn app.main:app --reload
```

По умолчанию приложение использует SQLite и создаёт таблицы при запуске. База данных `todo.db` будет находиться в каталоге `backend`.

Backend будет доступен по адресу http://localhost:8000.

Интерактивная документация API: http://localhost:8000/docs.

### 2. Frontend

В новом терминале перейди в каталог frontend из корня репозитория:

```bash
cd frontend
npm ci
npm run dev
```

Открой адрес, который Vite выведет в терминале. По умолчанию это http://localhost:5173.

По умолчанию frontend отправляет запросы к API по адресу `http://localhost:8000`. Если backend работает по другому адресу, задай переменную окружения `VITE_API_URL` перед запуском Vite.

**PowerShell:**

```powershell
$env:VITE_API_URL = "http://localhost:8000"
npm run dev
```

**Linux / macOS:**

```bash
VITE_API_URL=http://localhost:8000 npm run dev
```

## API

Все маршруты задач имеют префикс `/api/todos`.

| Метод | Endpoint | Назначение |
|---|---|---|
| GET | `/api/todos` | Получить список задач |
| POST | `/api/todos` | Создать задачу |
| PATCH | `/api/todos/{todo_id}` | Изменить название или статус задачи |
| DELETE | `/api/todos/{todo_id}` | Удалить задачу |
| DELETE | `/api/todos/completed` | Удалить все выполненные задачи |
| GET | `/health` | Проверить доступность API |

Для создания задачи передаётся JSON:

```json
{
  "title": "Изучить FastAPI"
}
```

## Проверка

### Backend-тесты

Из каталога `backend`, с активированным виртуальным окружением:

```bash
pytest -v
```

### Frontend

Из каталога `frontend`:

```bash
npm run typecheck
npm run lint
npm run build
```

## Конфигурация

Backend поддерживает следующие переменные окружения:

| Переменная | Значение по умолчанию | Назначение |
|---|---|---|
| `DATABASE_URL` | `sqlite+aiosqlite:///./todo.db` | Строка подключения к базе данных |
| `ALLOWED_ORIGINS` | `http://localhost:5173` | Разрешённые CORS-origin через запятую |

Frontend:

| Переменная | Значение по умолчанию | Назначение |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8000` | Базовый URL backend API |

## Репозиторий

https://github.com/ilyanelt1/ToDo
