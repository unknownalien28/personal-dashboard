import { useState, type FormEvent } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { AlertCircle, CheckCircle2 } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { FormField } from "../components/FormField";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api/client";

export function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);

  const linkLooksValid = Boolean(token && email);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isLoading) return; // guard against duplicate submissions
    setError(null);

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setIsLoading(true);
    try {
      await api.post("/auth/reset-password", { email, token, newPassword }, { skipAuth: true });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "This reset link is invalid or has expired.");
    } finally {
      setIsLoading(false);
    }
  }

  if (done) {
    return (
      <AuthLayout title="Password updated">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Your password has been reset. Every other session has been signed out for safety.
          </p>
          <Button variant="primary" className="mt-6 w-full justify-center" onClick={() => navigate("/login", { replace: true })}>
            Log in
          </Button>
        </div>
      </AuthLayout>
    );
  }

  if (!linkLooksValid) {
    return (
      <AuthLayout title="Invalid link">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          This password reset link is missing information. Request a new one from the login page.
        </p>
        <Link to="/forgot-password" className="mt-6 inline-block text-sm font-medium text-accent-500 hover:underline">
          Request a new link
        </Link>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Set a new password" subtitle={`Resetting the password for ${email}.`}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          value={newPassword}
          hint={!error ? "At least 8 characters." : undefined}
          onChange={(e) => setNewPassword(e.target.value)}
        />
        <FormField
          label="Confirm new password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" className="w-full justify-center" loading={isLoading}>
          Reset password
        </Button>
      </form>
    </AuthLayout>
  );
}
