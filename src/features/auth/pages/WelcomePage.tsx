import { Link } from "react-router-dom";
import type { CSSProperties } from "react";
import { CalendarCheck2, Rocket, Sparkles, Wallet } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AmbientBackground } from "@/components/background/AmbientBackground";

const highlights = [
  { icon: CalendarCheck2, label: "Tasks, calendar & goals in sync" },
  { icon: Wallet, label: "Finance tracking built in" },
  { icon: Sparkles, label: "Alien, your built-in AI copilot" },
];

export function WelcomePage() {
  return (
    <div className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-[var(--color-canvas)] px-6 py-10 text-center">
      <AmbientBackground />

      <div className="absolute top-4 right-4 z-[2] pt-[env(safe-area-inset-top)] pr-[env(safe-area-inset-right)]">
        <ThemeToggle />
      </div>

      <main className="relative z-[1] flex w-full max-w-md flex-col items-center page-fade-in">
        <div
          className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-500/10 text-accent-500"
          aria-hidden="true"
        >
          <Rocket className="h-8 w-8" />
        </div>

        <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
          Welcome to AlienOS
        </h1>
        <p className="mt-3 text-sm sm:text-base text-zinc-500 dark:text-zinc-400 text-balance">
          Your personal productivity operating system — tasks, notes, calendar, goals, finance, and content, all in one
          place.
        </p>

        <ul className="mt-6 flex w-full flex-col gap-2" aria-label="What you can do in AlienOS">
          {highlights.map(({ icon: Icon, label }, i) => (
            <li
              key={label}
              className="item-in flex items-center gap-3 rounded-xl border border-[var(--color-border)] glass-panel px-4 py-2.5 text-left"
              style={{ "--stagger-delay": `${i * 60}ms` } as CSSProperties}
            >
              <Icon className="h-4 w-4 shrink-0 text-accent-500" aria-hidden="true" />
              <span className="text-sm text-zinc-600 dark:text-zinc-300">{label}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 flex w-full flex-col gap-3">
          <Link to="/register" className="w-full">
            <Button variant="primary" size="md" className="w-full justify-center">
              Get started
            </Button>
          </Link>
          <Link to="/login" className="w-full">
            <Button variant="secondary" size="md" className="w-full justify-center">
              I already have an account
            </Button>
          </Link>
        </div>
      </main>
    </div>
  );
}
