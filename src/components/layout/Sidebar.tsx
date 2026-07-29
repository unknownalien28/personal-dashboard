import { NavLink } from "react-router-dom";
import { ChevronsLeft, ChevronsRight } from "lucide-react";
import { navItems } from "@/lib/nav-items";
import { cn } from "@/lib/utils/cn";

interface SidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  return (
    <aside
      className={cn(
        "relative z-[1] hidden md:flex flex-col shrink-0 border-r border-[var(--color-border)]",
        "glass-panel glass-glow-border",
        "transition-[width] duration-200 ease-out",
        collapsed ? "w-[68px]" : "w-60"
      )}
    >
      <div className="flex items-center h-14 px-4 gap-2 border-b border-[var(--color-border)]">
        <img src="/logo.svg" alt="AlienOS" className="h-7 w-7 shrink-0 rounded-lg" />
        {!collapsed && (
          <span className="font-semibold text-sm text-zinc-900 dark:text-zinc-100 whitespace-nowrap">
            AlienOS
          </span>
        )}
      </div>

      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === "/"}
            className={({ isActive }) =>
              cn(
                "relative flex items-center gap-3 rounded-lg px-2.5 h-9 text-sm font-medium nav-glow",
                "transition-[background-color,color,transform] duration-150 active:scale-[0.98]",
                isActive
                  ? "bg-accent-50 text-accent-700 dark:bg-accent-500/15 dark:text-accent-400 nav-glow-active"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )
            }
            title={collapsed ? item.label : undefined}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="nav-indicator-in absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-full bg-accent-500"
                    aria-hidden="true"
                  />
                )}
                <item.icon className="h-[18px] w-[18px] shrink-0 transition-transform duration-150" />
                {!collapsed && <span className="truncate">{item.label}</span>}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <button
        onClick={onToggle}
        className="flex items-center gap-2 h-11 px-4 text-xs font-medium text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 border-t border-[var(--color-border)]"
      >
        {collapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        {!collapsed && <span>Collapse</span>}
      </button>
    </aside>
  );
}
