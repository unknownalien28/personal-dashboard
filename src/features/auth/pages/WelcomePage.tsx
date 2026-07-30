import { Link } from "react-router-dom";
import { Rocket } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AmbientBackground } from "@/components/background/AmbientBackground";

export function WelcomePage() {
  return (
    <div className="relative flex min-h-dvh w-full flex-col items-center justify-center overflow-hidden bg-[var(--color-canvas)] px-6 text-center">
      <AmbientBackground />

      <div className="relative z-[1] flex max-w-md flex-col items-center page-fade-in">
        <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent-500/10 text-accent-500">
          <Rocket className="h-8 w-8" />
        </div>
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-100">Welcome to AlienOS</h1>
        <p className="mt-3 text-sm text-zinc-500 dark:text-zinc-400">
          Your personal productivity operating system — tasks, notes, calendar, goals, finance, and content, all in one place.
        </p>

        <div className="mt-8 flex w-full flex-col gap-3">
          <Link to="/register" className="w-full">
            <Button variant="primary" className="w-full justify-center">
              Get started
            </Button>
          </Link>
          <Link to="/login" className="w-full">
            <Button variant="secondary" className="w-full justify-center">
              I already have an account
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
