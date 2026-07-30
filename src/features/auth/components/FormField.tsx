import { forwardRef, useState, type InputHTMLAttributes } from "react";
import { Eye, EyeOff } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface FormFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  hint?: string;
}

export const FormField = forwardRef<HTMLInputElement, FormFieldProps>(function FormField(
  { label, error, hint, className, id, type, ...props },
  ref,
) {
  const fieldId = id ?? props.name ?? label.toLowerCase().replace(/\s+/g, "-");
  const isPassword = type === "password";
  const [visible, setVisible] = useState(false);

  return (
    <label htmlFor={fieldId} className="block">
      <span className="mb-1.5 block text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</span>
      <div className="relative">
        <input
          ref={ref}
          id={fieldId}
          type={isPassword ? (visible ? "text" : "password") : type}
          className={cn(
            "w-full h-11 rounded-lg border bg-[var(--color-surface)] px-3 text-sm outline-none transition-colors",
            "focus:ring-2 focus:ring-accent-400",
            isPassword && "pr-11",
            error ? "border-danger" : "border-[var(--color-border)]",
            className,
          )}
          aria-invalid={!!error || undefined}
          aria-describedby={error ? `${fieldId}-error` : hint ? `${fieldId}-hint` : undefined}
          {...props}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setVisible((v) => !v)}
            aria-label={visible ? "Hide password" : "Show password"}
            aria-pressed={visible}
            tabIndex={-1}
            className="absolute inset-y-0 right-0 flex w-11 items-center justify-center text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 transition-colors"
          >
            {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {hint && !error && (
        <span id={`${fieldId}-hint`} className="mt-1 block text-xs text-zinc-400 dark:text-zinc-500">
          {hint}
        </span>
      )}
      {error && (
        <span id={`${fieldId}-error`} role="alert" className="mt-1 block text-xs text-danger">
          {error}
        </span>
      )}
    </label>
  );
});
