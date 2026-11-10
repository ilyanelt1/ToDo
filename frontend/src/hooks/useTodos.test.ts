import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import * as api from '../api/todos';
import { useTodos } from './useTodos';

vi.mock('../api/todos');

describe('useTodos offline mode (Kira bug #1)', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useFakeTimers(); // Ускоряем 5-секундный таймер ретрая
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('keeps offline tasks in queue and syncs them on reconnect', async () => {
    // 1. Бэкенд лежит при загрузке
    vi.mocked(api.getTodos).mockRejectedValueOnce(new TypeError('Failed to fetch'));

    const { result } = renderHook(() => useTodos());

    // Ждем, пока отработает первый useEffect
    await act(async () => {
      await Promise.resolve();
    });

    expect(result.current.loading).toBe(false);
    expect(result.current.offline).toBe(true);

    // 2. Добавляем задачу в офлайне
    await act(async () => {
      await result.current.add('Offline task');
    });

    // Проверяем: задача в UI, id отрицательный (temp), очередь сохранена
    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].id).toBeLessThan(0);
    expect(localStorage.getItem('todo_pending')).toContain('Offline task');

    // 3. Бэкенд поднялся
    vi.mocked(api.getTodos).mockResolvedValueOnce([]);
    vi.mocked(api.createTodo).mockResolvedValueOnce({
      id: 42,
      title: 'Offline task',
      completed: false,
      created_at: new Date().toISOString(),
    });

    // 4. Прокручиваем таймер ретрая (5 секунд) и ждем выполнения промисов
    await act(async () => {
      vi.advanceTimersByTime(5000);
      // Даем время отработать цепочке getTodos -> setTodos -> drainQueue -> createTodo
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
      await Promise.resolve();
    });

    // 5. Проверяем результат синхронизации
    expect(result.current.offline).toBe(false);
    expect(result.current.todos).toHaveLength(1);
    expect(result.current.todos[0].id).toBe(42); // Серверный id заменил temp
    expect(localStorage.getItem('todo_pending')).toBe('[]'); // Очередь очищена
  });
});