from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, ConfigDict, Field


class TodoCreate(BaseModel):
    title: str = Field(max_length=200)
    client_id: UUID | None = None


class TodoUpdate(BaseModel):
    title: str | None = Field(default=None, max_length=200)
    completed: bool | None = None


class TodoRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    completed: bool
    created_at: datetime
