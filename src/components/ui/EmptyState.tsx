import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils/cn";

interface EmptyStateAction {
  label: string;
  onClick: () => void;
  icon?: LucideIcon;
}

interface EmptyStateProps {
  icon: LucideIcon;
  title?: string;
  description: ReactNode;
  action?: EmptyStateAction;
  className?: string;
  /** Tighter vertical padding for empty states nested inside an already-scrolled panel. */
  compact?: boolean;
}

export function EmptyState({ icon: Icon, title, description, action, className, compact }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center gap-3 empty-state-in",
        compact ? "py-12" : "py-16 md:py-20",
        className
      )}
    >
      <div className="empty-icon-glow h-12 w-12 rounded-xl bg-accent-50 dark:bg-accent-500/15 flex items-center justify-center">
        <Icon className="h-6 w-6 text-accent-500" />
      </div>
      {title && <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</h3>}
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">{description}</p>
      {action && (
        <Button variant="primary" onClick={action.onClick} className="mt-1">
          {action.icon && <action.icon className="h-4 w-4" />} {action.label}
        </Button>
      )}
    </div>
  );
}
