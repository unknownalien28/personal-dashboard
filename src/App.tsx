import { Suspense, lazy, useEffect } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { RouteLoadingFallback } from "@/components/ui/RouteLoadingFallback";
import { NotFoundPage } from "@/components/ui/NotFoundPage";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { useAuthStore } from "@/features/auth/auth-store";
import { ProtectedRoute, GuestRoute } from "@/features/auth/ProtectedRoute";

// Route-level code splitting keeps the initial bundle small for fast loads on
// mid-range devices — each module's code downloads only when the person opens it.
const HomePage = lazy(() => import("@/features/home/HomePage").then((m) => ({ default: m.HomePage })));
const TasksPage = lazy(() => import("@/features/tasks/TasksPage").then((m) => ({ default: m.TasksPage })));
const NotesPage = lazy(() => import("@/features/notes/NotesPage").then((m) => ({ default: m.NotesPage })));
const CalendarPage = lazy(() =>
  import("@/features/calendar/CalendarPage").then((m) => ({ default: m.CalendarPage }))
);
const GoalsPage = lazy(() => import("@/features/goals/GoalsPage").then((m) => ({ default: m.GoalsPage })));
const FinancePage = lazy(() =>
  import("@/features/finance/FinancePage").then((m) => ({ default: m.FinancePage }))
);
const ContentPage = lazy(() =>
  import("@/features/content/ContentPage").then((m) => ({ default: m.ContentPage }))
);
const AIPage = lazy(() => import("@/features/ai/AIPage").then((m) => ({ default: m.AIPage })));
const ProfilePage = lazy(() =>
  import("@/features/profile/ProfilePage").then((m) => ({ default: m.ProfilePage }))
);

const WelcomePage = lazy(() => import("@/features/auth/pages/WelcomePage").then((m) => ({ default: m.WelcomePage })));
const LoginPage = lazy(() => import("@/features/auth/pages/LoginPage").then((m) => ({ default: m.LoginPage })));
const RegisterPage = lazy(() => import("@/features/auth/pages/RegisterPage").then((m) => ({ default: m.RegisterPage })));
const ForgotPasswordPage = lazy(() =>
  import("@/features/auth/pages/ForgotPasswordPage").then((m) => ({ default: m.ForgotPasswordPage }))
);
const ResetPasswordPage = lazy(() =>
  import("@/features/auth/pages/ResetPasswordPage").then((m) => ({ default: m.ResetPasswordPage }))
);
const VerifyEmailPage = lazy(() =>
  import("@/features/auth/pages/VerifyEmailPage").then((m) => ({ default: m.VerifyEmailPage }))
);

function App() {
  const hydrate = useAuthStore((s) => s.hydrate);

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
            {/* Public, logged-out-only routes */}
            <Route element={<GuestRoute />}>
              <Route path="/welcome" element={<WelcomePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
            </Route>

            {/* Public routes reachable regardless of auth state */}
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/reset-password" element={<ResetPasswordPage />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />

            {/* Everything else requires an authenticated session */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppShell />}>
                <Route path="/" element={<HomePage />} />
                <Route path="/tasks" element={<TasksPage />} />
                <Route path="/notes" element={<NotesPage />} />
                <Route path="/calendar" element={<CalendarPage />} />
                <Route path="/goals" element={<GoalsPage />} />
                <Route path="/finance" element={<FinancePage />} />
                <Route path="/content" element={<ContentPage />} />
                <Route path="/ai" element={<AIPage />} />
                <Route path="/profile" element={<ProfilePage />} />
                <Route path="*" element={<NotFoundPage />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
