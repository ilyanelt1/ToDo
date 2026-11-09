import { FilterTabs } from './components/FilterTabs';
import { Header } from './components/Header';
import { TodoInput } from './components/TodoInput';
import { TodoList } from './components/TodoList';
import { useTodos } from './hooks/useTodos';

export default function App() {
  const {
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
  } = useTodos();

  const hasCompleted = todos.some((t) => t.completed);

  return (
    <div className="flex min-h-full items-start justify-center px-4 py-8 sm:py-12">
      <main className="w-full max-w-xl rounded-2xl border border-gray-200 bg-white p-5 shadow-sm sm:p-6">
        <Header remaining={remaining} offline={offline} />

        {error && (
          <div
            role="alert"
            className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700"
          >
            {error}
          </div>
        )}

        <TodoInput onAdd={add} />

        <FilterTabs value={filter} onChange={setFilter} />

        {loading ? (
          <p className="py-8 text-center text-sm text-gray-500">Загрузка…</p>
        ) : (
          <TodoList
            todos={filteredTodos}
            filter={filter}
            onToggle={toggle}
            onRemove={remove}
            onRename={rename}
          />
        )}

        {hasCompleted && (
          <div className="mt-4 flex justify-end">
            <button
              type="button"
              onClick={() => void clearCompleted()}
              className="min-h-10 rounded-lg px-3 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
            >
              Удалить выполненные
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
