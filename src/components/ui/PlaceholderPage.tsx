import type { LucideIcon } from "lucide-react";

interface PlaceholderPageProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

/** Temporary stand-in shown for feature modules not yet built. Removed as each module is implemented. */
export function PlaceholderPage({ icon: Icon, title, description }: PlaceholderPageProps) {
  return (
    <div className="flex flex-col items-center justify-center text-center py-24 gap-3 empty-state-in">
      <div className="empty-icon-glow h-12 w-12 rounded-xl bg-accent-50 dark:bg-accent-500/15 flex items-center justify-center">
        <Icon className="h-6 w-6 text-accent-500" />
      </div>
      <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{title}</h2>
      <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-sm">{description}</p>
    </div>
  );
}
