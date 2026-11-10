from sqlalchemy import delete as sqlalchemy_delete
from sqlalchemy import select
from typing import cast
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.models import Todo
from app.schemas import TodoCreate, TodoUpdate


async def get_all(db: AsyncSession) -> list[Todo]:
    result = await db.execute(select(Todo).order_by(Todo.id.asc()))
    return list(result.scalars().all())


async def get_by_id(db: AsyncSession, todo_id: int) -> Todo | None:
    return await db.get(Todo, todo_id)


async def create(db: AsyncSession, payload: TodoCreate) -> Todo:
    if payload.client_id is not None:
        existing = await db.scalar(select(Todo).where(Todo.client_id == payload.client_id))
        if existing is not None:
            return existing

    todo = Todo(title=payload.title, client_id=payload.client_id)
    db.add(todo)
    try:
        await db.commit()
    except IntegrityError:
        await db.rollback()
        if payload.client_id is None:
            raise
        existing = cast(
            Todo | None,
            await db.scalar(select(Todo).where(Todo.client_id == payload.client_id)),
        )
        if existing is None:
            raise
        return existing

    await db.refresh(todo)
    return todo


async def update(db: AsyncSession, todo: Todo, payload: TodoUpdate) -> Todo:
    if payload.title is not None:
        todo.title = payload.title
    if payload.completed is not None:
        todo.completed = payload.completed
    await db.commit()
    await db.refresh(todo)
    return todo


async def delete(db: AsyncSession, todo: Todo) -> None:
    await db.delete(todo)
    await db.commit()


async def delete_completed(db: AsyncSession) -> None:
    await db.execute(sqlalchemy_delete(Todo).where(Todo.completed.is_(True)))
    await db.commit()
