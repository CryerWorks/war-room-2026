export default function CalendarPage() {
  // We'll build the full calendar in Phase 5
  // For now, this is a working route that proves our routing is set up

  const today = new Date();
  const monthName = today.toLocaleString("default", { month: "long" });
  const year = today.getFullYear();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Calendar
        </h2>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          {monthName} {year} — schedule and track your daily modules.
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 bg-white dark:bg-zinc-900 text-center">
        <p className="text-zinc-400 dark:text-zinc-500">
          Calendar view coming soon. This will show a month grid with your
          scheduled modules for each day.
        </p>
      </div>
    </div>
  );
}
