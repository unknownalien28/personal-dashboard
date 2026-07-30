import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, MailCheck } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { FormField } from "../components/FormField";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api/client";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [fieldError, setFieldError] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isLoading) return; // guard against duplicate submissions
    setError(null);

    if (!email.trim()) {
      setFieldError("Email is required.");
      return;
    }
    if (!EMAIL_RE.test(email)) {
      setFieldError("Enter a valid email address.");
      return;
    }
    setFieldError(undefined);

    setIsLoading(true);
    try {
      await api.post("/auth/forgot-password", { email }, { skipAuth: true });
      setSent(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }

  if (sent) {
    return (
      <AuthLayout title="Check your inbox">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
            <MailCheck className="h-7 w-7" />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            If an account exists for <span className="font-medium text-zinc-700 dark:text-zinc-200">{email}</span>, we've sent a
            link to reset your password. It expires in about an hour.
          </p>
          <Link to="/login" className="mt-6 text-sm font-medium text-accent-500 hover:underline">
            Back to login
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title="Forgot your password?"
      subtitle="Enter your email and we'll send you a reset link."
      footer={
        <Link to="/login" className="font-medium text-accent-500 hover:underline">
          Back to login
        </Link>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          error={fieldError}
          onChange={(e) => {
            setEmail(e.target.value);
            if (fieldError) setFieldError(undefined);
          }}
        />

        {error && (
          <p role="alert" className="flex items-start gap-2 rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" aria-hidden="true" />
            {error}
          </p>
        )}

        <Button type="submit" variant="primary" className="w-full justify-center" loading={isLoading}>
          Send reset link
        </Button>
      </form>
    </AuthLayout>
  );
}
