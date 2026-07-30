import { useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { MailCheck } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { FormField } from "../components/FormField";
import { Button } from "@/components/ui/Button";
import { api, ApiError } from "@/lib/api/client";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
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
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-500/10 text-accent-500">
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
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <FormField
          label="Email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {error && (
          <p role="alert" className="rounded-lg bg-danger/10 px-3 py-2 text-sm text-danger">
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
