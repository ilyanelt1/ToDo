from httpx import AsyncClient


async def _create(client: AsyncClient, title: str) -> int:
    response = await client.post("/api/todos", json={"title": title})
    assert response.status_code == 201
    return int(response.json()["id"])


async def test_create_todo(client: AsyncClient) -> None:
    response = await client.post("/api/todos", json={"title": "  Buy milk  "})
    assert response.status_code == 201
    body = response.json()
    assert body["title"] == "Buy milk"
    assert body["completed"] is False
    assert isinstance(body["id"], int)
    assert body["id"] > 0
    assert "created_at" in body


async def test_create_todo_rejects_empty_title(client: AsyncClient) -> None:
    response = await client.post("/api/todos", json={"title": "   "})
    assert response.status_code == 400


async def test_get_all_todos(client: AsyncClient) -> None:
    await _create(client, "First")
    await _create(client, "Second")
    response = await client.get("/api/todos")
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert [item["title"] for item in body] == ["First", "Second"]


async def test_update_todo_toggle_completed(client: AsyncClient) -> None:
    todo_id = await _create(client, "Task")
    response = await client.patch(f"/api/todos/{todo_id}", json={"completed": True})
    assert response.status_code == 200
    assert response.json()["completed"] is True
    response = await client.patch(f"/api/todos/{todo_id}", json={"completed": False})
    assert response.status_code == 200
    assert response.json()["completed"] is False


async def test_update_todo_title(client: AsyncClient) -> None:
    todo_id = await _create(client, "Old")
    response = await client.patch(f"/api/todos/{todo_id}", json={"title": "  New  "})
    assert response.status_code == 200
    assert response.json()["title"] == "New"


async def test_update_missing_todo_returns_404(client: AsyncClient) -> None:
    response = await client.patch("/api/todos/9999", json={"completed": True})
    assert response.status_code == 404


async def test_delete_todo(client: AsyncClient) -> None:
    todo_id = await _create(client, "To delete")
    response = await client.delete(f"/api/todos/{todo_id}")
    assert response.status_code == 204
    response = await client.get("/api/todos")
    assert response.json() == []


async def test_delete_missing_todo_returns_404(client: AsyncClient) -> None:
    response = await client.delete("/api/todos/9999")
    assert response.status_code == 404


async def test_delete_completed(client: AsyncClient) -> None:
    done_a = await _create(client, "Done A")
    done_b = await _create(client, "Done B")
    pending = await _create(client, "Pending")
    await client.patch(f"/api/todos/{done_a}", json={"completed": True})
    await client.patch(f"/api/todos/{done_b}", json={"completed": True})
    response = await client.delete("/api/todos/completed")
    assert response.status_code == 204
    response = await client.get("/api/todos")
    body = response.json()
    assert isinstance(body, list)
    assert len(body) == 1
    assert body[0]["id"] == pending
    