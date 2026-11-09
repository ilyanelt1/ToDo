interface HeaderProps {
  remaining: number;
  offline: boolean;
}

export function Header({ remaining, offline }: HeaderProps) {
  return (
    <header className="mb-6 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold text-gray-900">Мои задачи</h1>
        {offline && (
          <span
            className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700"
            title="Бэкенд недоступен — изменения сохраняются локально"
          >
            offline
          </span>
        )}
      </div>
      <span className="text-sm text-gray-500">осталось {remaining}</span>
    </header>
  );
}
