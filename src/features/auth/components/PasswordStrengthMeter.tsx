/** Simple, dependency-free strength heuristic — length + character-class variety. Purely a UX nudge, not a security gate. */
export function PasswordStrengthMeter({ password }: { password: string }) {
  if (!password) return null;

  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[^a-zA-Z0-9]/.test(password)) score++;

  const level = Math.min(score, 4);
  const labels = ["Very weak", "Weak", "Fair", "Good", "Strong"];
  const colors = ["bg-danger", "bg-orange-500", "bg-amber-500", "bg-emerald-500", "bg-emerald-600"];

  return (
    <div className="-mt-2" aria-live="polite">
      <div className="flex gap-1">
        {[0, 1, 2, 3].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${i < level ? colors[level] : "bg-zinc-200 dark:bg-zinc-700"}`}
          />
        ))}
      </div>
      <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{labels[level]}</p>
    </div>
  );
}
