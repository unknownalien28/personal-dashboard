import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md" | "icon";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  children?: ReactNode;
  loading?: boolean;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-accent-500 text-white hover:bg-accent-600 active:bg-accent-700 shadow-sm shadow-accent-500/20",
  secondary:
    "bg-white dark:bg-zinc-800 text-zinc-800 dark:text-zinc-100 border border-[var(--color-border)] hover:bg-zinc-50 dark:hover:bg-zinc-700 active:bg-zinc-100 dark:active:bg-zinc-600",
  ghost:
    "bg-transparent text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 active:bg-zinc-200 dark:active:bg-zinc-700",
  danger: "bg-transparent text-danger hover:bg-danger/10 active:bg-danger/20",
};

const sizeClasses: Record<Size, string> = {
  sm: "h-10 md:h-8 px-3 text-sm gap-1.5",
  md: "h-11 md:h-9 px-4 text-sm gap-2",
  icon: "h-11 w-11 md:h-9 md:w-9 justify-center",
};

export function Button({
  variant = "secondary",
  size = "md",
  className,
  children,
  loading = false,
  disabled,
  ...props
}: ButtonProps) {
  return (
    <button
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={cn(
        "inline-flex items-center rounded-lg font-medium transition-[background-color,color,transform,box-shadow] duration-150",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent-400 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900",
        "disabled:opacity-50 disabled:pointer-events-none",
        "active:scale-[0.97]",
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
      {...props}
    >
      {loading && (
        <span
          className="h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent animate-spin shrink-0"
          aria-hidden="true"
        />
      )}
      {children}
    </button>
  );
}
