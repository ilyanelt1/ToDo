interface HeaderProps {
  remaining: number;
  offline: boolean;
}

function pluralizeTasks(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "задача";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20))
    return "задачи";
  return "задач";
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
      <span className="text-sm text-gray-500">
        осталось {remaining} {pluralizeTasks(remaining)}
      </span>
    </header>
  );
}
