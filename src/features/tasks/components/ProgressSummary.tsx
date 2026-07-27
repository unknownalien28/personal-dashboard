import { Card } from "@/components/ui/Card";
import type { Task } from "@/types/models";

interface ProgressSummaryProps {
  tasks: Task[];
}

export function ProgressSummary({ tasks }: ProgressSummaryProps) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.completed).length;
  const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

  const categories = Array.from(new Set(tasks.map((t) => t.category))).map((cat) => {
    const inCat = tasks.filter((t) => t.category === cat);
    const done = inCat.filter((t) => t.completed).length;
    return { name: cat, done, total: inCat.length };
  });

  return (
    <Card className="p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {completed} of {total} done
        </span>
        <span className="text-sm font-medium text-accent-600 dark:text-accent-400">{percent}%</span>
      </div>
      <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
        <div
          className="h-full rounded-full bg-accent-500 transition-[width] duration-300 ease-out"
          style={{ width: `${percent}%` }}
        />
      </div>

      {categories.length > 1 && (
        <div className="flex flex-wrap gap-x-4 gap-y-1.5 mt-3">
          {categories.map((cat) => (
            <div key={cat.name} className="flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
              <span className="h-1.5 w-1.5 rounded-full bg-accent-400" />
              {cat.name}: {cat.done}/{cat.total}
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
