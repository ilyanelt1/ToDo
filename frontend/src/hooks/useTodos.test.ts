import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import * as api from "../api/todos";
import { useTodos } from "./useTodos";

vi.mock("../api/todos");

describe("useTodos offline mode", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("retries a create with the same idempotency key after a lost response", async () => {
    vi.mocked(api.getTodos).mockResolvedValue([]);
    vi.mocked(api.createTodo)
      .mockRejectedValueOnce(new TypeError("Failed to fetch"))
      .mockResolvedValueOnce({
        id: 42,
        title: "Offline task",
        completed: false,
        created_at: new Date().toISOString(),
      });

    const { result } = renderHook(() => useTodos());

    await act(async () => {
      await Promise.resolve();
    });

    await act(async () => {
      await result.current.add("Offline task");
    });

    expect(result.current.offline).toBe(true);
    expect(result.current.todos).toHaveLength(1);

    const queued = JSON.parse(
      localStorage.getItem("todo_pending") ?? "[]",
    ) as Array<{ clientId: string }>;
    const clientId = queued[0].clientId;
    expect(clientId).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
    );

    await act(async () => {
      vi.advanceTimersByTime(5000);
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(api.createTodo).toHaveBeenCalledTimes(2);
    expect(api.createTodo).toHaveBeenNthCalledWith(1, {
      title: "Offline task",
      client_id: clientId,
    });
    expect(api.createTodo).toHaveBeenNthCalledWith(2, {
      title: "Offline task",
      client_id: clientId,
    });
    expect(result.current.offline).toBe(false);
    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].id).toBe(42);
    expect(localStorage.getItem("todo_pending")).toBe("[]");
  });

  it("adds an idempotency key to legacy queued creates", async () => {
    localStorage.setItem(
      "todo_pending",
      JSON.stringify([{ kind: "create", tempId: -1, title: "Legacy task" }]),
    );
    vi.mocked(api.getTodos).mockRejectedValueOnce(
      new TypeError("Failed to fetch"),
    );

    renderHook(() => useTodos());

    await act(async () => {
      await Promise.resolve();
    });

    const queued = JSON.parse(
      localStorage.getItem("todo_pending") ?? "[]",
    ) as Array<{ clientId?: string }>;
    expect(queued[0].clientId).toBeTruthy();
  });
});
