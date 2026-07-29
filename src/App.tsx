import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { RouteLoadingFallback } from "@/components/ui/RouteLoadingFallback";
import { NotFoundPage } from "@/components/ui/NotFoundPage";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";

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

function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
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
          </Routes>
        </Suspense>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
