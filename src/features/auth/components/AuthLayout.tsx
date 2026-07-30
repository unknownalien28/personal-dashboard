import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AmbientBackground } from "@/components/background/AmbientBackground";

interface AuthLayoutProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({ title, subtitle, children, footer }: AuthLayoutProps) {
  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-[var(--color-canvas)] px-4 py-10">
      <AmbientBackground />

      <div className="relative z-[1] w-full max-w-md">
        <Link to="/welcome" className="mb-8 flex items-center justify-center gap-2 text-zinc-900 dark:text-zinc-100">
          <img src="/logo.svg" alt="" className="h-8 w-8" />
          <span className="text-lg font-semibold tracking-tight">AlienOS</span>
        </Link>

        <div className="glass-panel rounded-2xl border border-[var(--color-border)] p-6 sm:p-8 page-fade-in">
          <h1 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">{title}</h1>
          {subtitle && <p className="mt-1.5 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>}
          <div className="mt-6">{children}</div>
        </div>

        {footer && <div className="mt-6 text-center text-sm text-zinc-500 dark:text-zinc-400">{footer}</div>}
      </div>
    </div>
  );
}
