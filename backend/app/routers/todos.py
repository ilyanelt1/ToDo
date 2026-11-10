from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app import crud
from app.database import get_db
from app.schemas import TodoCreate, TodoRead, TodoUpdate

router = APIRouter(prefix="/api/todos", tags=["todos"])

DbDep = Annotated[AsyncSession, Depends(get_db)]


def _normalize_title(title: str) -> str:
    normalized = title.strip()
    if not normalized:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Title must not be empty",
        )
    return normalized


@router.get("", response_model=list[TodoRead])
async def list_todos(db: DbDep) -> list[TodoRead]:
    todos = await crud.get_all(db)
    return [TodoRead.model_validate(todo) for todo in todos]


@router.post("", response_model=TodoRead, status_code=status.HTTP_201_CREATED)
async def create_todo(payload: TodoCreate, db: DbDep) -> TodoRead:
    title = _normalize_title(payload.title)
    todo = await crud.create(db, TodoCreate(title=title))
    return TodoRead.model_validate(todo)


@router.delete("/completed", status_code=status.HTTP_204_NO_CONTENT)
async def delete_completed(db: DbDep) -> None:
    await crud.delete_completed(db)


@router.patch("/{todo_id}", response_model=TodoRead)
async def update_todo(todo_id: int, payload: TodoUpdate, db: DbDep) -> TodoRead:
    todo = await crud.get_by_id(db, todo_id)
    if todo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found",
        )

    normalized_title = _normalize_title(payload.title) if payload.title is not None else None

    # Создаем новый объект вместо мутации входящего
    safe_payload = TodoUpdate(title=normalized_title, completed=payload.completed)

    updated = await crud.update(db, todo, safe_payload)
    return TodoRead.model_validate(updated)


@router.delete("/{todo_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_todo(todo_id: int, db: DbDep) -> None:
    todo = await crud.get_by_id(db, todo_id)
    if todo is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Todo not found",
        )
    await crud.delete(db, todo)
