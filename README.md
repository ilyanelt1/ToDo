# To-Do List

[![CI](https://github.com/ilyanelt1/ToDo/actions/workflows/ci.yml/badge.svg)](https://github.com/ilyanelt1/ToDo/actions/workflows/ci.yml)

Одностраничное приложение для управления задачами: FastAPI + React 18 + TypeScript + Tailwind CSS. Поддерживает полноценный офлайн-режим с фоновой синхронизацией при восстановлении связи.

![screenshot](./docs/screenshot.png)

## Стек

**Backend:** Python 3.13, FastAPI, SQLAlchemy 2.0 (async), Pydantic v2, PostgreSQL 17 (через asyncpg), aiosqlite (локально), pytest + httpx.

**Frontend:** Vite 5, React 18.3, TypeScript 5.6, Tailwind CSS 3.4, Vitest + Testing Library, ESLint 9 (flat config), Prettier 3.

**Инфраструктура:** Docker Compose, GitHub Actions (CI), pre-commit.

## Ссылки

- Demo (Vercel): `<placeholder>`
- API docs (Railway): `<placeholder>/docs`
- GitHub: https://github.com/ilyanelt1/ToDo

## Запуск локально

Нужны Docker и Docker Compose (рекомендуемый способ) либо Python 3.13+ и Node.js 20+ для ручного запуска.

### Способ 1: Docker Compose (весь стек одной командой)

```bash
docker compose up --build
