import type { Filter, Todo } from "../types/todo";
import { EmptyState } from "./EmptyState";
import { TodoItem } from "./TodoItem";

interface TodoListProps {
  todos: Todo[];
  filter: Filter;
  onToggle: (id: number) => Promise<void>;
  onRemove: (id: number) => Promise<void>;
  onRename: (id: number, title: string) => Promise<void>;
}

export function TodoList({
  todos,
  filter,
  onToggle,
  onRemove,
  onRename,
}: TodoListProps) {
  if (todos.length === 0) {
    return <EmptyState filter={filter} />;
  }
  return (
    <ul className="flex flex-col gap-2">
      {todos.map((todo) => (
        <TodoItem
          key={todo.id}
          todo={todo}
          onToggle={onToggle}
          onRemove={onRemove}
          onRename={onRename}
        />
      ))}
    </ul>
  );
}
