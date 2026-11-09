import type { Filter } from '../types/todo';

interface EmptyStateProps {
  filter: Filter;
}

const MESSAGES: Record<Filter, string> = {
  all: 'Пока нет задач. Добавьте первую!',
  active: 'Активных задач нет. Всё сделано!',
  completed: 'Выполненных задач нет.',
};

export function EmptyState({ filter }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 bg-gray-50 px-4 py-12 text-center">
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="mb-3 h-10 w-10 text-gray-400"
      >
        <circle cx="12" cy="12" r="9" />
        <path d="M9 12l2 2 4-4" />
      </svg>
      <p className="text-sm text-gray-500">{MESSAGES[filter]}</p>
    </div>
  );
}
