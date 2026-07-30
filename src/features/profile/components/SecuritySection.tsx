import { useEffect, useState, type FormEvent } from "react";
import { AlertCircle, CheckCircle2, Laptop, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { FormField } from "@/features/auth/components/FormField";
import { api, ApiError } from "@/lib/api/client";
import { PasswordStrengthMeter } from "@/features/auth/components/PasswordStrengthMeter";

interface SessionRow {
  id: string;
  userAgent: string | null;
  ipAddress: string | null;
  createdAt: string;
  expiresAt: string;
  current: boolean;
}

export function SecuritySection() {
  return (
    <div className="flex flex-col gap-8 max-w-lg">
      <ChangePasswordForm />
      <SessionsList />
    </div>
  );
}

function ChangePasswordForm() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isSubmitting) return; // guard against duplicate submissions (e.g. double-click, double Enter)

    setError(null);
    setSuccess(false);

    if (newPassword !== confirmPassword) {
      setConfirmError("Passwords don't match.");
      return;
    }
    setConfirmError(null);

    setIsSubmitting(true);
    try {
      await api.post("/auth/change-password", { currentPassword, newPassword });
      setSuccess(true);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Change password</h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
        Changing your password signs you out of every other device.
      </p>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormField
          label="Current password"
          type="password"
          autoComplete="current-password"
          required
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
        <FormField
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          hint="At least 8 characters."
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <PasswordStrengthMeter password={newPassword} />
        <FormField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          error={confirmError ?? undefined}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (confirmError) setConfirmError(null);
          }}
        />

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}
        {success && (
          <p className="flex items-start gap-2 rounded-lg bg-emerald-500/10 px-3 py-2 text-sm text-emerald-600 dark:text-emerald-400">
            <CheckCircle2 className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
            Password updated. Other sessions have been signed out.
          </p>
        )}

        <Button type="submit" variant="primary" loading={isSubmitting} className="self-start">
          Update password
        </Button>
      </form>
    </div>
  );
}

function SessionsList() {
  const [sessions, setSessions] = useState<SessionRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [signingOutAll, setSigningOutAll] = useState(false);

  async function load() {
    setError(null);
    try {
      const data = await api.get<SessionRow[]>("/auth/sessions");
      setSessions(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't load sessions.");
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function revoke(id: string) {
    setRevokingId(id);
    try {
      await api.delete(`/auth/sessions/${id}`);
      setSessions((prev) => prev?.filter((s) => s.id !== id) ?? null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't revoke that session.");
    } finally {
      setRevokingId(null);
    }
  }

  async function signOutAllOthers() {
    setSigningOutAll(true);
    try {
      await api.post("/auth/logout-all");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't sign out other devices.");
    } finally {
      setSigningOutAll(false);
    }
  }

  return (
    <div>
      <h3 className="text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">Active sessions</h3>
      <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">Devices currently signed in to your account.</p>

      {error && (
        <p role="alert" className="mb-3 flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
          <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      )}

      {sessions === null && !error ? (
        <div className="flex items-center gap-2 text-sm text-zinc-400">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading sessions…
        </div>
      ) : sessions && sessions.length === 0 ? (
        <p className="text-sm text-zinc-400">No active sessions found.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {sessions?.map((session) => (
            <li
              key={session.id}
              className="flex items-center gap-3 rounded-lg border border-[var(--color-border)] px-3 py-2.5"
            >
              <Laptop className="h-4 w-4 shrink-0 text-zinc-400" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                <p className="text-sm text-zinc-700 dark:text-zinc-300 truncate">
                  {session.userAgent ?? "Unknown device"}
                  {session.current && (
                    <span className="ml-2 rounded-full bg-accent-500/10 px-2 py-0.5 text-xs text-accent-600 dark:text-accent-400">
                      This device
                    </span>
                  )}
                </p>
                <p className="text-xs text-zinc-400 truncate">
                  {session.ipAddress ?? "Unknown IP"} · Signed in {new Date(session.createdAt).toLocaleDateString()}
                </p>
              </div>
              {!session.current && (
                <Button
                  variant="danger"
                  size="sm"
                  loading={revokingId === session.id}
                  onClick={() => revoke(session.id)}
                  className="shrink-0"
                >
                  Revoke
                </Button>
              )}
            </li>
          ))}
        </ul>
      )}

      {sessions && sessions.length > 1 && (
        <Button variant="secondary" size="sm" className="mt-3" loading={signingOutAll} onClick={() => void signOutAllOthers()}>
          Sign out of all other devices
        </Button>
      )}
    </div>
  );
}
