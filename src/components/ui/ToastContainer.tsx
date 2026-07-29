import { useEffect, useState } from "react";
import { CheckCircle2, XCircle, Info, X } from "lucide-react";
import { useToastStore, type Toast, type ToastVariant } from "@/lib/toast-store";
import { cn } from "@/lib/utils/cn";

const AUTO_DISMISS_MS = 3500;

const variantConfig: Record<ToastVariant, { icon: typeof CheckCircle2; className: string }> = {
  success: { icon: CheckCircle2, className: "text-success" },
  error: { icon: XCircle, className: "text-danger" },
  info: { icon: Info, className: "text-accent-500" },
};

function ToastItem({ toast }: { toast: Toast }) {
  const dismissToast = useToastStore((s) => s.dismissToast);
  const [leaving, setLeaving] = useState(false);
  const { icon: Icon, className } = variantConfig[toast.variant];

  useEffect(() => {
    const timer = setTimeout(() => setLeaving(true), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      role="status"
      onAnimationEnd={() => {
        if (leaving) dismissToast(toast.id);
      }}
      className={cn(
        "flex items-center gap-2.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] shadow-lg px-4 py-3 min-w-[240px] max-w-sm",
        leaving ? "toast-out" : "toast-in"
      )}
    >
      <Icon className={cn("h-[18px] w-[18px] shrink-0", className)} aria-hidden="true" />
      <p className="text-sm text-zinc-700 dark:text-zinc-200 flex-1">{toast.message}</p>
      <button
        onClick={() => setLeaving(true)}
        aria-label="Dismiss notification"
        className="h-6 w-6 shrink-0 flex items-center justify-center rounded-md text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed z-[60] bottom-[calc(4.5rem+env(safe-area-inset-bottom))] md:bottom-4 left-1/2 -translate-x-1/2 md:left-auto md:right-4 md:translate-x-0 flex flex-col gap-2 items-center md:items-end"
    >
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  );
}
