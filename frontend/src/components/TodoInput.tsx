import { useState, type FormEvent } from 'react';

interface TodoInputProps {
  onAdd: (title: string) => Promise<void>;
}

export function TodoInput({ onAdd }: TodoInputProps) {
  const [value, setValue] = useState('');
  const canSubmit = value.trim().length > 0;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    setValue('');
    void onAdd(trimmed);
  };

  return (
    <form onSubmit={handleSubmit} className="mb-4 flex gap-2">
      <input
        type="text"
        value={value}
        onChange={(event) => setValue(event.target.value)}
        placeholder="Что нужно сделать?"
        maxLength={200}
        aria-label="Новая задача"
        className="min-h-11 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-base outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
      />
      <button
        type="submit"
        disabled={!canSubmit}
        className="min-h-11 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        Добавить
      </button>
    </form>
  );
}
