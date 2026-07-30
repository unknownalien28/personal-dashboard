import { useState, type FormEvent } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AuthLayout } from "../components/AuthLayout";
import { FormField } from "../components/FormField";
import { SocialLoginButtons } from "../components/SocialLoginButtons";
import { useAuthStore } from "../auth-store";
import { Button } from "@/components/ui/Button";

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const login = useAuthStore((s) => s.login);
  const isLoading = useAuthStore((s) => s.isLoading);
  const error = useAuthStore((s) => s.error);
  const clearError = useAuthStore((s) => s.clearError);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(true);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    clearError();
    try {
      await login(email, password, rememberMe);
      const from = (location.state as { from?: string } | null)?.from ?? "/";
      navigate(from, { replace: true });
    } catch {
      // Error is surfaced from the store below.
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to pick up right where you left off."
      footer={
        <>
          Don't have an account?{" "}
          <Link to="/register" className="font-medium text-accent-500 hover:underline">
            Sign up
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
          autoComplete="current-password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex items-center justify-between text-sm">
          <label className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
            <input
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-[var(--color-border)] text-accent-500 focus:ring-accent-400"
            />
            Keep me logged in
          </label>
          <Link to="/forgot-password" className="font-medium text-accent-500 hover:underline">
            Forgot password?
          </Link>
        </div>

        {error && (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" className="w-full justify-center" loading={isLoading}>
          Log in
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
