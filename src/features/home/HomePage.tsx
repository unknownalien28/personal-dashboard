import { WelcomeHeader } from "./components/WelcomeHeader";
import { QuickStats } from "./components/QuickStats";
import { CalendarSummary } from "./components/CalendarSummary";
import { NotesSummary } from "./components/NotesSummary";
import { DailyQuote } from "./components/DailyQuote";
import { WeatherWidget } from "./components/WeatherWidget";
import { QuickActions } from "./components/QuickActions";

export function HomePage() {
  return (
    <div className="flex flex-col gap-6">
      <WelcomeHeader />
      <QuickStats />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <CalendarSummary />
        <NotesSummary />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <DailyQuote />
        <WeatherWidget />
      </div>
      <QuickActions />
    </div>
  );
}
