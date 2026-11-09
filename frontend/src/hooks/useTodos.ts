import { useCallback, useEffect, useMemo, useState } from 'react';

import * as api from '../api/todos';
import type { Filter, Todo } from '../types/todo';

const STORAGE_KEY = 'todos';

interface UseTodosResult {
  todos: Todo[];
  filteredTodos: Todo[];
  filter: Filter;
  setFilter: (filter: Filter) => void;
  loading: boolean;
  error: string | null;
  offline: boolean;
  remaining: number;
  add: (title: string) => Promise<void>;
  toggle: (id: number) => Promise<void>;
  remove: (id: number) => Promise<void>;
  rename: (id: number, title: string) => Promise<void>;
  clearCompleted: () => Promise<void>;
}

function isTodo(value: unknown): value is Todo {
  if (typeof value !== 'object' || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === 'number' &&
    typeof candidate.title === 'string' &&
    typeof candidate.completed === 'boolean' &&
    typeof candidate.created_at === 'string'
  );
}

function loadFromStorage(): Todo[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isTodo);
  } catch {
    return [];
  }
}

function saveToStorage(todos: Todo[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
  } catch {
    // storage quota or disabled — silently ignore, UI keeps working
  }
}

function makeTempId(): number {
  return -Date.now();
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : 'Не удалось выполнить запрос';
}

export function useTodos(): UseTodosResult {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilterState] = useState<Filter>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const remote = await api.getTodos();
        if (cancelled) return;
        setTodos(remote);
        saveToStorage(remote);
        setOffline(false);
      } catch {
        if (cancelled) return;
        setOffline(true);
        setTodos(loadFromStorage());
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const setFilter = useCallback((next: Filter) => {
    setFilterState(next);
  }, []);

  const add = useCallback(
    async (title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      setError(null);
      const previous = todos;
      const optimistic: Todo = {
        id: makeTempId(),
        title: trimmed,
        completed: false,
        created_at: new Date().toISOString(),
      };
      const next = [...todos, optimistic];
      setTodos(next);
      saveToStorage(next);
      if (offline) return;
      try {
        const created = await api.createTodo({ title: trimmed });
        setTodos((current) => {
          const replaced = current.map((t) => (t.id === optimistic.id ? created : t));
          saveToStorage(replaced);
          return replaced;
        });
      } catch (err) {
        setError(errorMessage(err));
        setTodos(previous);
        saveToStorage(previous);
      }
    },
    [todos, offline],
  );

  const toggle = useCallback(
    async (id: number) => {
      const target = todos.find((t) => t.id === id);
      if (!target) return;
      setError(null);
      const previous = todos;
      const next = todos.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t));
      setTodos(next);
      saveToStorage(next);
      if (offline) return;
      try {
        const updated = await api.updateTodo(id, { completed: !target.completed });
        setTodos((current) => {
          const replaced = current.map((t) => (t.id === id ? updated : t));
          saveToStorage(replaced);
          return replaced;
        });
      } catch (err) {
        setError(errorMessage(err));
        setTodos(previous);
        saveToStorage(previous);
      }
    },
    [todos, offline],
  );

  const remove = useCallback(
    async (id: number) => {
      setError(null);
      const previous = todos;
      const next = todos.filter((t) => t.id !== id);
      setTodos(next);
      saveToStorage(next);
      if (offline) return;
      try {
        await api.deleteTodo(id);
      } catch (err) {
        setError(errorMessage(err));
        setTodos(previous);
        saveToStorage(previous);
      }
    },
    [todos, offline],
  );

  const rename = useCallback(
    async (id: number, title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      const target = todos.find((t) => t.id === id);
      if (!target || target.title === trimmed) return;
      setError(null);
      const previous = todos;
      const next = todos.map((t) => (t.id === id ? { ...t, title: trimmed } : t));
      setTodos(next);
      saveToStorage(next);
      if (offline) return;
      try {
        const updated = await api.updateTodo(id, { title: trimmed });
        setTodos((current) => {
          const replaced = current.map((t) => (t.id === id ? updated : t));
          saveToStorage(replaced);
          return replaced;
        });
      } catch (err) {
        setError(errorMessage(err));
        setTodos(previous);
        saveToStorage(previous);
      }
    },
    [todos, offline],
  );

  const clearCompleted = useCallback(async () => {
    setError(null);
    const previous = todos;
    const next = todos.filter((t) => !t.completed);
    setTodos(next);
    saveToStorage(next);
    if (offline) return;
    try {
      await api.clearCompleted();
    } catch (err) {
      setError(errorMessage(err));
      setTodos(previous);
      saveToStorage(previous);
    }
  }, [todos, offline]);

  const filteredTodos = useMemo(() => {
    switch (filter) {
      case 'active':
        return todos.filter((t) => !t.completed);
      case 'completed':
        return todos.filter((t) => t.completed);
      default:
        return todos;
    }
  }, [todos, filter]);

  const remaining = useMemo(() => todos.filter((t) => !t.completed).length, [todos]);

  return {
    todos,
    filteredTodos,
    filter,
    setFilter,
    loading,
    error,
    offline,
    remaining,
    add,
    toggle,
    remove,
    rename,
    clearCompleted,
  };
}
