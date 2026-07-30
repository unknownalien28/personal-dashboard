import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { CheckCircle2, MailWarning, RefreshCw } from "lucide-react";
import { AuthLayout } from "../components/AuthLayout";
import { Button } from "@/components/ui/Button";
import { useAuthStore } from "../auth-store";
import { api, ApiError } from "@/lib/api/client";

type Status = "pending" | "verifying" | "success" | "error";

export function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);

  const token = searchParams.get("token");
  const emailFromLink = searchParams.get("email");
  const emailFromState = (location.state as { email?: string } | null)?.email;
  const email = emailFromLink ?? emailFromState ?? user?.email ?? "";

  const [status, setStatus] = useState<Status>(token ? "verifying" : "pending");
  const [error, setError] = useState<string | null>(null);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  useEffect(() => {
    if (!token || !email) return;
    api
      .post("/auth/verify-email", { email, token }, { skipAuth: true })
      .then(() => setStatus("success"))
      .catch((err) => {
        setError(err instanceof ApiError ? err.message : "This verification link is invalid or has expired.");
        setStatus("error");
      });
  }, [token, email]);

  async function resend() {
    setResendState("sending");
    try {
      await api.post("/auth/send-verification-email");
      setResendState("sent");
    } catch {
      setResendState("idle");
    }
  }

  if (status === "success") {
    return (
      <AuthLayout title="Email verified">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-500">
            <CheckCircle2 className="h-7 w-7" />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Your email is confirmed. You're all set.</p>
          <Link to="/">
            <Button variant="primary" className="mt-6 w-full justify-center">
              Go to AlienOS
            </Button>
          </Link>
        </div>
      </AuthLayout>
    );
  }

  if (status === "error") {
    return (
      <AuthLayout title="Verification failed">
        <div className="flex flex-col items-center text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-danger/10 text-danger">
            <MailWarning className="h-7 w-7" />
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">{error}</p>
          <Button variant="secondary" className="mt-6 w-full justify-center" loading={resendState === "sending"} onClick={resend}>
            {resendState === "sent" ? "New link sent" : "Send a new link"}
          </Button>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout title="Verify your email">
      <div className="flex flex-col items-center text-center">
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-500/10 text-accent-500">
          {status === "verifying" ? (
            <RefreshCw className="h-7 w-7 animate-spin" />
          ) : (
            <MailWarning className="h-7 w-7" />
          )}
        </div>
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {status === "verifying" ? (
            "Confirming your email…"
          ) : (
            <>
              We sent a confirmation link to{" "}
              <span className="font-medium text-zinc-700 dark:text-zinc-200">{email || "your email"}</span>. Click it to verify
              your account.
            </>
          )}
        </p>
        {status === "pending" && (
          <Button variant="secondary" className="mt-6 w-full justify-center" loading={resendState === "sending"} onClick={resend}>
            {resendState === "sent" ? "Link re-sent" : "Resend email"}
          </Button>
        )}
        <Link to="/" className="mt-4 text-sm font-medium text-accent-500 hover:underline">
          Skip for now
        </Link>
      </div>
    </AuthLayout>
  );
}
