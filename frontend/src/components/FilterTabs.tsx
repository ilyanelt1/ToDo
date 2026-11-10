import type { Filter } from '../types/todo';

interface FilterTabsProps {
  value: Filter;
  onChange: (filter: Filter) => void;
}

const TABS: ReadonlyArray<{ value: Filter; label: string }> = [
  { value: 'all', label: 'Все' },
  { value: 'active', label: 'Активные' },
  { value: 'completed', label: 'Выполненные' },
];

export function FilterTabs({ value, onChange }: FilterTabsProps) {
  return (
    <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1">
      {TABS.map((tab) => {
        const active = tab.value === value;
        return (
          <button
            key={tab.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(tab.value)}
            className={`min-h-10 flex-1 rounded-md px-3 text-sm font-medium transition ${
              active
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}