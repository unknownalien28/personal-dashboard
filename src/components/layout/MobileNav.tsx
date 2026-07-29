import { NavLink } from "react-router-dom";
import { navItems } from "@/lib/nav-items";
import { cn } from "@/lib/utils/cn";

// Mobile keeps the most-used tabs visible; the rest still route correctly via the URL,
// reachable from the Home quick actions or a future "more" sheet.
const primaryMobileItems = navItems.slice(0, 5);

export function MobileNav() {
  return (
    <nav
      className={cn(
        "md:hidden fixed bottom-0 inset-x-0 z-20 flex items-stretch justify-around",
        "h-16 glass-panel border-t border-[var(--color-border)]",
        "pb-[env(safe-area-inset-bottom)] pl-[env(safe-area-inset-left)] pr-[env(safe-area-inset-right)]"
      )}
    >
      {primaryMobileItems.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === "/"}
          className={({ isActive }) =>
            cn(
              "relative flex flex-1 flex-col items-center justify-center gap-1 text-[11px] font-medium",
              "transition-colors duration-150 active:bg-zinc-100 dark:active:bg-zinc-800",
              isActive
                ? "text-accent-600 dark:text-accent-400"
                : "text-zinc-500 dark:text-zinc-400"
            )
          }
        >
          {({ isActive }) => (
            <>
              {isActive && (
                <span
                  className="nav-indicator-in absolute top-1 h-1 w-1 rounded-full bg-accent-500"
                  aria-hidden="true"
                />
              )}
              <item.icon className={cn("h-5 w-5 transition-transform duration-150", isActive && "scale-110")} />
              <span className="truncate max-w-[64px]">{item.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}
