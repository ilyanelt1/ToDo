import { useEffect, useRef, useState, type KeyboardEvent } from "react";

import type { Todo } from "../types/todo";

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: number) => Promise<void>;
  onRemove: (id: number) => Promise<void>;
  onRename: (id: number, title: string) => Promise<void>;
}

export function TodoItem({
  todo,
  onToggle,
  onRemove,
  onRename,
}: TodoItemProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [editing]);

  useEffect(() => {
    if (!editing) setDraft(todo.title);
  }, [todo.title, editing]);

  const startEditing = () => {
    setDraft(todo.title);
    setEditing(true);
  };

  const commit = async () => {
    const trimmed = draft.trim();
    if (!trimmed) {
      setDraft(todo.title);
      setEditing(false);
      return;
    }
    if (trimmed !== todo.title) {
      await onRename(todo.id, trimmed);
    }
    setEditing(false);
  };

  const cancel = () => {
    setDraft(todo.title);
    setEditing(false);
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      void commit();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancel();
    }
  };

  const handleBlur = () => {
    void commit();
  };

  return (
    <li className="flex items-center gap-3 rounded-lg border border-gray-200 bg-white px-3 py-2 transition hover:border-gray-300">
      <input
        type="checkbox"
        checked={todo.completed}
        onChange={() => void onToggle(todo.id)}
        aria-label={
          todo.completed
            ? "Снять отметку о выполнении"
            : "Отметить как выполненную"
        }
        className="h-5 w-5 shrink-0 cursor-pointer rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
      />
      {editing ? (
        <input
          ref={inputRef}
          type="text"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={handleBlur}
          maxLength={200}
          aria-label="Редактировать задачу"
          className="min-h-9 flex-1 rounded border border-indigo-300 px-2 py-1 text-base outline-none focus:ring-2 focus:ring-indigo-100"
        />
      ) : (
        <span
          onDoubleClick={startEditing}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              startEditing();
            }
          }}
          tabIndex={0}
          role="button"
          className={`flex min-h-9 flex-1 cursor-text select-none items-center rounded outline-none focus:ring-2 focus:ring-indigo-100 ${
            todo.completed ? "text-gray-400 line-through" : "text-gray-800"
          }`}
        >
          {todo.title}
        </span>
      )}
      <button
        type="button"
        onClick={() => void onRemove(todo.id)}
        aria-label="Удалить задачу"
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded text-gray-400 transition hover:bg-red-50 hover:text-red-600"
      >
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="h-4 w-4"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </li>
  );
}
