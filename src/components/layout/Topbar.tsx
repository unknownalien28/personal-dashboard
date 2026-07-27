import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Search, Sun, Moon, Settings, X } from "lucide-react";
import { navItems } from "@/lib/nav-items";
import { useThemeStore } from "@/lib/theme-store";

export function Topbar() {
  const location = useLocation();
  const mode = useThemeStore((s) => s.mode);
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
        "border-b border-[var(--color-border)] bg-[var(--color-canvas)]/80 backdrop-blur",
      ].join(" ")}
    >
      {mobileSearchOpen ? (
        <div className="flex items-center gap-2 w-full sm:hidden">
          <label className="flex flex-1 items-center gap-2 h-11 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-zinc-400 focus-within:ring-2 focus-within:ring-accent-400 transition-shadow duration-150">
            <Search className="h-4 w-4 shrink-0" />
            <input
              autoFocus
              type="text"
              placeholder="Search..."
              className="w-full bg-transparent text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
            />
          </label>
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
            {current?.label ?? "Dashboard"}
          </h1>

          <div className="flex items-center gap-1.5 sm:gap-2">
            <label className="hidden sm:flex items-center gap-2 h-9 w-56 lg:w-72 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-zinc-400 focus-within:ring-2 focus-within:ring-accent-400 transition-shadow duration-150">
              <Search className="h-4 w-4 shrink-0" />
              <input
                type="text"
                placeholder="Search..."
                className="w-full bg-transparent text-sm text-zinc-800 dark:text-zinc-100 placeholder:text-zinc-400 outline-none"
              />
            </label>

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
              {mode === "light" ? <Moon className="h-[18px] w-[18px]" /> : <Sun className="h-[18px] w-[18px]" />}
            </button>

            <Link
              to="/profile"
              aria-label="Settings"
              className="h-11 w-11 md:h-9 md:w-9 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700 transition-colors duration-150"
            >
              <Settings className="h-[18px] w-[18px]" />
            </Link>
          </div>
        </>
      )}
    </header>
  );
}
