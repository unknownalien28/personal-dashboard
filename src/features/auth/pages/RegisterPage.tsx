import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { FormField } from "../components/FormField";
import { SocialLoginButtons } from "../components/SocialLoginButtons";
import { useAuthStore } from "../auth-store";
import { Button } from "@/components/ui/Button";

export function RegisterPage() {
  const navigate = useNavigate();
  const register = useAuthStore((s) => s.register);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    clearError();
    setLocalError(null);

    if (password.length < 8) {
      setLocalError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setLocalError("Passwords don't match.");
      return;
    }

    try {
      await register(email, password, name || undefined);
      navigate("/verify-email", { replace: true, state: { email } });
    } catch {
      // Error surfaced from the store below.
    }
  }

  const displayedError = localError ?? error;

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Set up AlienOS in under a minute."
      footer={
        <>
          Already have an account?{" "}
          <Link to="/login" className="font-medium text-accent-500 hover:underline">
            Log in
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField label="Name" type="text" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} />
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <FormField
          label="Password"
          type="password"
          autoComplete="new-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <FormField
          label="Confirm password"
          type="password"
          autoComplete="new-password"
          required
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
        />

        {displayedError && (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {displayedError}
          </p>
        )}

        <Button type="submit" variant="primary" className="w-full justify-center" loading={isLoading}>
          Create account
        </Button>
      </form>

      <div className="my-6 flex items-center gap-3 text-xs text-zinc-400">
        <div className="h-px flex-1 bg-[var(--color-border)]" />
        or continue with
        <div className="h-px flex-1 bg-[var(--color-border)]" />
      </div>

      <SocialLoginButtons />
    </AuthLayout>
  );
}
