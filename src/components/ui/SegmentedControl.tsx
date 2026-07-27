import { cn } from "@/lib/utils/cn";

interface SegmentedControlProps<T extends string> {
  options: { value: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  className,
}: SegmentedControlProps<T>) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-lg bg-zinc-100 dark:bg-zinc-800 p-1 gap-0.5",
        className
      )}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          className={cn(
            "flex-1 h-9 md:h-8 px-3 rounded-md text-sm font-medium transition-colors duration-150 whitespace-nowrap",
            value === opt.value
              ? "bg-[var(--color-surface)] text-zinc-900 dark:text-zinc-100 shadow-sm"
              : "text-zinc-500 dark:text-zinc-400 active:bg-zinc-200/60 dark:active:bg-zinc-700/60"
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
