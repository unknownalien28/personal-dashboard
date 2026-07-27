import { CheckCircle2, FileText, Flame, ListTodo } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useTasksStore } from "@/features/tasks/tasks-store";
import { useNotesStore } from "@/features/notes/notes-store";
import { useGoalsStore } from "@/features/goals/goals-store";

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof ListTodo;
  label: string;
  value: string | number;
}) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className="h-9 w-9 rounded-lg bg-accent-50 dark:bg-accent-500/15 flex items-center justify-center shrink-0">
        <Icon className="h-[18px] w-[18px] text-accent-500" />
      </div>
      <div className="min-w-0">
        <div className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 leading-tight">
          {value}
        </div>
        <div className="text-xs text-zinc-500 dark:text-zinc-400 truncate">{label}</div>
      </div>
    </Card>
  );
}

export function QuickStats() {
  const tasks = useTasksStore((s) => s.tasks);
  const notes = useNotesStore((s) => s.notes);
  const habits = useGoalsStore((s) => s.habits);

  const today = new Date().toISOString().slice(0, 10);
  const dueToday = tasks.filter((t) => !t.completed && t.dueDate === today).length;
  const openTasks = tasks.filter((t) => !t.completed).length;
  const bestStreak = habits.reduce((max, h) => Math.max(max, h.streak), 0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      <StatCard icon={ListTodo} label="Open tasks" value={openTasks} />
      <StatCard icon={CheckCircle2} label="Due today" value={dueToday} />
      <StatCard icon={Flame} label="Best streak" value={`${bestStreak}d`} />
      <StatCard icon={FileText} label="Notes saved" value={notes.length} />
    </div>
  );
}
