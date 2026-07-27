import { Link } from "react-router-dom";
import { Plus, FileText, CalendarPlus, Wallet } from "lucide-react";
import { Card } from "@/components/ui/Card";

const actions = [
  { to: "/tasks", label: "New task", icon: Plus },
  { to: "/notes", label: "New note", icon: FileText },
  { to: "/calendar", label: "New event", icon: CalendarPlus },
  { to: "/finance", label: "Log expense", icon: Wallet },
];

export function QuickActions() {
  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Quick actions</h3>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {actions.map((action) => (
          <Link
            key={action.to}
            to={action.to}
            className="flex flex-col items-center justify-center gap-1.5 rounded-lg border border-[var(--color-border)] py-3 text-xs font-medium text-zinc-600 dark:text-zinc-300 hover:border-accent-400 hover:text-accent-600 dark:hover:text-accent-400 transition-colors duration-150"
          >
            <action.icon className="h-4 w-4" />
            {action.label}
          </Link>
        ))}
      </div>
    </Card>
  );
}
