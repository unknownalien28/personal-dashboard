import { forwardRef, type InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(function FormField(
  { label, error, className, id, ...props },
  ref,
) {
  const fieldId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");
  return (
    <label htmlFor={fieldId} className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      <input
        ref={ref}
        id={fieldId}
        className={cn(
          "w-full h-11 rounded-lg border bg-[var(--color-surface)] px-3 text-sm outline-none transition-colors",
          "focus:ring-2 focus:ring-accent-400",
          error ? "border-danger" : "border-[var(--color-border)]",
          className,
        )}
        aria-invalid={!!error || undefined}
        aria-describedby={error ? `${fieldId}-error` : undefined}
        {...props}
      />
      {error && (
        <span id={`${fieldId}-error`} className="mt-1 block text-xs text-danger">
          {error}
        </span>
      )}
    </label>
  );
});
