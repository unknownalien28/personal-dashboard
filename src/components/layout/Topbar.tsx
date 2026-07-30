import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Sun, Moon, Settings, X, Search } from "lucide-react";
import { navItems } from "@/lib/nav-items";
import { useThemeStore } from "@/lib/theme-store";
import { useResolvedDarkMode } from "@/hooks/useApplyTheme";
import { GlobalSearch } from "@/features/ai/components/GlobalSearch";
import { UserMenu } from "./UserMenu";

export function Topbar() {
  const location = useLocation();
  const isDark = useResolvedDarkMode();
  const toggle = useThemeStore((s) => s.toggle);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const current = navItems.find((item) =>
    item.to === "/" ? location.pathname === "/" : location.pathname.startsWith(item.to)
  );

  return (
    <header
      className={[
        "sticky top-0 z-10 flex items-center justify-between h-14",
        "pt-[env(safe-area-inset-top)]",
        "pl-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] md:px-6",
        "border-b border-[var(--color-border)] glass-panel glass-glow-border-bottom",
      ].join(" ")}
    >
      {mobileSearchOpen ? (
        <div className="flex items-center gap-2 w-full sm:hidden">
          <GlobalSearch autoFocus className="flex-1" onNavigate={() => setMobileSearchOpen(false)} />
          <button
            onClick={() => setMobileSearchOpen(false)}
            aria-label="Close search"
            className="h-11 w-11 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors duration-150 shrink-0"
          >
            <X className="h-[18px] w-[18px]" />
          </button>
        </div>
      ) : (
        <>
          <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            {current?.label ?? "AlienOS"}
          </h1>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <GlobalSearch className="hidden sm:block w-56 lg:w-72" />

            <button
              onClick={() => setMobileSearchOpen(true)}
              aria-label="Open search"
              className="sm:hidden h-11 w-11 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 transition-colors duration-150"
            >
              <Search className="h-[18px] w-[18px]" />
            </button>

            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="h-11 w-11 md:h-9 md:w-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 transition-colors duration-150"
            >
              {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
            </button>

            <Link
              to="/profile"
              aria-label="Settings"
              className="h-11 w-11 md:h-9 md:w-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 transition-colors duration-150"
            >
              <Settings className="h-[18px] w-[18px]" />
            </Link>

            <UserMenu />
          </div>
        </>
      )}
    </header>
  );
}
