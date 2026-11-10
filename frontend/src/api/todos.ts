import type { Todo, TodoCreate, TodoUpdate } from '../types/todo';

const API_URL: string =
  (import.meta.env.VITE_API_URL as string | undefined)?.trim() || 'http://localhost:8000'
async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init.headers ?? {}),
    },
  });

  if (!response.ok) {
    let message = response.statusText || `Request failed with status ${response.status}`;
    try {
      const body = (await response.json()) as { detail?: unknown };
      if (typeof body.detail === 'string') {
        message = body.detail;
      }
    } catch {
      // non-JSON body — keep the status-based message
    }
    throw new Error(message);
  }

  if (response.status === 204) {
    return undefined as T;
  }
  return (await response.json()) as T;
}

export function getTodos(): Promise<Todo[]> {
  return request<Todo[]>('/api/todos');
}

export function createTodo(payload: TodoCreate): Promise<Todo> {
  return request<Todo>('/api/todos', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateTodo(id: number, payload: TodoUpdate): Promise<Todo> {
  return request<Todo>(`/api/todos/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function deleteTodo(id: number): Promise<void> {
  return request<void>(`/api/todos/${id}`, { method: 'DELETE' });
}

export function clearCompleted(): Promise<void> {
  return request<void>('/api/todos/completed', { method: 'DELETE' });
}
