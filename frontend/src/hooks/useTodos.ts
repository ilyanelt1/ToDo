import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import * as api from "../api/todos";
import type { Filter, Todo } from "../types/todo";

const STORAGE_KEY = "todos";
const PENDING_KEY = "todo_pending";
const RETRY_INTERVAL_MS = 5000;

type PendingOperation =
  | { kind: "create"; tempId: number; title: string; clientId: string }
  | {
      kind: "update";
      id: number;
      changes: { title?: string; completed?: boolean };
    }
  | { kind: "delete"; id: number };

type StoredPendingOperation =
  | { kind: "create"; tempId: number; title: string; clientId?: string }
  | Exclude<PendingOperation, { kind: "create" }>;

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
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "number" &&
    typeof candidate.title === "string" &&
    typeof candidate.completed === "boolean" &&
    typeof candidate.created_at === "string"
  );
}

function isPendingOperation(value: unknown): value is StoredPendingOperation {
  if (typeof value !== "object" || value === null) return false;
  const op = value as Record<string, unknown>;
  if (op.kind === "create") {
    return (
      typeof op.tempId === "number" &&
      typeof op.title === "string" &&
      (op.clientId === undefined || typeof op.clientId === "string")
    );
  }
  if (op.kind === "update") {
    return (
      typeof op.id === "number" &&
      typeof op.changes === "object" &&
      op.changes !== null
    );
  }
  if (op.kind === "delete") {
    return typeof op.id === "number";
  }
  return false;
}

function readJsonArray<T>(key: string, guard: (v: unknown) => v is T): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(guard);
  } catch {
    return [];
  }
}

function writeJson(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // quota exceeded or storage disabled — silently ignore
  }
}

function readPendingOperations(): PendingOperation[] {
  const stored = readJsonArray(PENDING_KEY, isPendingOperation);
  const normalized: PendingOperation[] = stored.map((op) => {
    if (op.kind === "create") {
      return { ...op, clientId: op.clientId ?? crypto.randomUUID() };
    }
    return op;
  });

  if (
    stored.some(
      (op, index) =>
        op.kind === "create" && op.clientId !== normalized[index].clientId,
    )
  ) {
    writeJson(PENDING_KEY, normalized);
  }

  return normalized;
}

let tempCounter = 0;
function makeTempId(): number {
  tempCounter += 1;
  return -Date.now() - tempCounter;
}

function isNetworkError(err: unknown): boolean {
  return err instanceof TypeError;
}

function errorMessage(err: unknown): string {
  return err instanceof Error ? err.message : "Не удалось выполнить запрос";
}

function remapId(from: number, to: number) {
  return (op: PendingOperation): PendingOperation => {
    if (op.kind === "update" && op.id === from) return { ...op, id: to };
    if (op.kind === "delete" && op.id === from) return { ...op, id: to };
    return op;
  };
}

function mergeRemoteWithLocal(
  local: Todo[],
  remote: Todo[],
  queue: PendingOperation[],
): Todo[] {
  const pendingDeletes = new Set<number>();
  for (const op of queue) {
    if (op.kind === "delete") pendingDeletes.add(op.id);
  }
  const map = new Map<number, Todo>();
  for (const t of remote) {
    if (!pendingDeletes.has(t.id)) map.set(t.id, t);
  }
  for (const t of local) {
    map.set(t.id, t);
  }
  return Array.from(map.values()).sort((a, b) => a.id - b.id);
}

export function useTodos(): UseTodosResult {
  const [todosState, setTodosState] = useState<Todo[]>([]);
  const [filter, setFilterState] = useState<Filter>("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState(false);

  const todosRef = useRef(todosState);
  const queueRef = useRef<PendingOperation[]>(readPendingOperations());
  const drainingRef = useRef(false);
  const offlineRef = useRef(offline);
  offlineRef.current = offline;

  const setTodos = useCallback(
    (updater: Todo[] | ((prev: Todo[]) => Todo[])) => {
      const prev = todosRef.current;
      const next = typeof updater === "function" ? updater(prev) : updater;
      todosRef.current = next;
      setTodosState(next);
      writeJson(STORAGE_KEY, next);
    },
    [],
  );

  const setQueue = useCallback(
    (
      updater:
        PendingOperation[] | ((prev: PendingOperation[]) => PendingOperation[]),
    ) => {
      const prev = queueRef.current;
      const next = typeof updater === "function" ? updater(prev) : updater;
      queueRef.current = next;
      writeJson(PENDING_KEY, next);
    },
    [],
  );

  const drainQueue = useCallback(async () => {
    if (drainingRef.current) return;
    drainingRef.current = true;
    try {
      for (;;) {
        const queue = queueRef.current;
        if (queue.length === 0) break;
        const op = queue[0];
        try {
          if (op.kind === "create") {
            const created = await api.createTodo({
              title: op.title,
              client_id: op.clientId,
            });
            setTodos((current) =>
              current.map((t) => (t.id === op.tempId ? created : t)),
            );
            setQueue((current) =>
              current.slice(1).map(remapId(op.tempId, created.id)),
            );
          } else if (op.kind === "update") {
            await api.updateTodo(op.id, op.changes);
            setQueue((current) => current.slice(1));
          } else if (op.kind === "delete") {
            await api.deleteTodo(op.id);
            setQueue((current) => current.slice(1));
          }
        } catch (err) {
          if (isNetworkError(err)) {
            setOffline(true);
            break;
          }
          setError(errorMessage(err));
          if (op.kind === "create") {
            setTodos((current) => current.filter((t) => t.id !== op.tempId));
          }
          setQueue((current) => current.slice(1));
        }
      }
    } finally {
      drainingRef.current = false;
    }
  }, [setQueue, setTodos]);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      try {
        const remote = await api.getTodos();
        if (cancelled) return;
        const queue = queueRef.current;
        if (queue.length === 0) {
          setTodos(remote);
        } else {
          const local = readJsonArray(STORAGE_KEY, isTodo);
          setTodos(mergeRemoteWithLocal(local, remote, queue));
        }
        setOffline(false);
        await drainQueue();
      } catch (err) {
        if (cancelled) return;
        setOffline(true);
        setTodos(readJsonArray(STORAGE_KEY, isTodo));
        if (!isNetworkError(err)) {
          setError(errorMessage(err));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [drainQueue, setTodos]);

  useEffect(() => {
    if (!offline) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const attempt = async () => {
      if (cancelled) return;
      try {
        const remote = await api.getTodos();
        if (cancelled) return;
        const queue = queueRef.current;
        if (queue.length === 0) {
          setTodos(remote);
        } else {
          const local = readJsonArray(STORAGE_KEY, isTodo);
          setTodos(mergeRemoteWithLocal(local, remote, queue));
        }
        setOffline(false);
        await drainQueue();
      } catch {
        // still offline — retry below
      }
      if (cancelled) return;
      if (offlineRef.current) {
        timer = setTimeout(attempt, RETRY_INTERVAL_MS);
      }
    };

    timer = setTimeout(attempt, RETRY_INTERVAL_MS);
    return () => {
      cancelled = true;
      if (timer !== undefined) clearTimeout(timer);
    };
  }, [offline, drainQueue, setTodos]);

  const setFilter = useCallback((next: Filter) => {
    setFilterState(next);
  }, []);

  const add = useCallback(
    async (title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      setError(null);
      const tempId = makeTempId();
      const optimistic: Todo = {
        id: tempId,
        title: trimmed,
        completed: false,
        created_at: new Date().toISOString(),
      };
      setTodos((prev) => [...prev, optimistic]);
      setQueue((prev) => [
        ...prev,
        {
          kind: "create",
          tempId,
          title: trimmed,
          clientId: crypto.randomUUID(),
        },
      ]);
      if (!offline) await drainQueue();
    },
    [drainQueue, offline, setQueue, setTodos],
  );

  const toggle = useCallback(
    async (id: number) => {
      const target = todosRef.current.find((t) => t.id === id);
      if (!target) return;
      setError(null);
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: !t.completed } : t)),
      );
      setQueue((prev) => [
        ...prev,
        { kind: "update", id, changes: { completed: !target.completed } },
      ]);
      if (!offline) await drainQueue();
    },
    [drainQueue, offline, setQueue, setTodos],
  );

  const remove = useCallback(
    async (id: number) => {
      setError(null);
      setTodos((prev) => prev.filter((t) => t.id !== id));
      setQueue((prev) => [...prev, { kind: "delete", id }]);
      if (!offline) await drainQueue();
    },
    [drainQueue, offline, setQueue, setTodos],
  );

  const rename = useCallback(
    async (id: number, title: string) => {
      const trimmed = title.trim();
      if (!trimmed) return;
      const target = todosRef.current.find((t) => t.id === id);
      if (!target || target.title === trimmed) return;
      setError(null);
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, title: trimmed } : t)),
      );
      setQueue((prev) => [
        ...prev,
        { kind: "update", id, changes: { title: trimmed } },
      ]);
      if (!offline) await drainQueue();
    },
    [drainQueue, offline, setQueue, setTodos],
  );

  const clearCompleted = useCallback(async () => {
    const completed = todosRef.current.filter((t) => t.completed);
    if (completed.length === 0) return;
    setError(null);
    setTodos((prev) => prev.filter((t) => !t.completed));

    const allSynced = completed.every((t) => t.id > 0);
    const queueEmpty = queueRef.current.length === 0;

    if (allSynced && queueEmpty && !offline) {
      try {
        await api.clearCompleted();
        return;
      } catch (err) {
        if (!isNetworkError(err)) {
          setError(errorMessage(err));
          return;
        }
        setOffline(true);
      }
    }

    const deleteOps: PendingOperation[] = completed.map((t) => ({
      kind: "delete",
      id: t.id,
    }));
    setQueue((prev) => [...prev, ...deleteOps]);
    if (!offline) await drainQueue();
  }, [drainQueue, offline, setQueue, setTodos]);

  const filteredTodos = useMemo(() => {
    switch (filter) {
      case "active":
        return todosState.filter((t) => !t.completed);
      case "completed":
        return todosState.filter((t) => t.completed);
      default:
        return todosState;
    }
  }, [todosState, filter]);

  const remaining = useMemo(
    () => todosState.filter((t) => !t.completed).length,
    [todosState],
  );

  return {
    todos: todosState,
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
