import { useSettingsStore } from "@/features/profile/settings-store";
import type { CalendarDefaultView, GoalDefaultView, NotesDefaultFilter, StartupPage } from "@/types/models";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">{label}</label>
      {children}
    </div>
  );
}

const selectClass =
  "w-full h-11 rounded-lg border border-[var(--color-border)] bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400";

export function PreferencesSection() {
  const { preferences, updatePreferences } = useSettingsStore();

  return (
    <div className="flex flex-col gap-5 max-w-lg">
      <Field label="Startup page">
        <select
          value={preferences.startupPage}
          onChange={(e) => updatePreferences({ startupPage: e.target.value as StartupPage })}
          className={selectClass}
        >
          <option value="/">Home</option>
          <option value="/tasks">Tasks</option>
          <option value="/notes">Notes</option>
          <option value="/calendar">Calendar</option>
          <option value="/goals">Goals</option>
        </select>
      </Field>

      <Field label="Default calendar view">
        <select
          value={preferences.defaultCalendarView}
          onChange={(e) => updatePreferences({ defaultCalendarView: e.target.value as CalendarDefaultView })}
          className={selectClass}
        >
          <option value="month">Month</option>
          <option value="week">Week</option>
          <option value="day">Day</option>
          <option value="agenda">Agenda</option>
        </select>
      </Field>

      <Field label="Default notes filter">
        <select
          value={preferences.defaultNotesFilter}
          onChange={(e) => updatePreferences({ defaultNotesFilter: e.target.value as NotesDefaultFilter })}
          className={selectClass}
        >
          <option value="all">All Notes</option>
          <option value="pinned">Pinned</option>
          <option value="archived">Archived</option>
          <option value="trash">Trash</option>
        </select>
      </Field>

      <Field label="Default goal view">
        <select
          value={preferences.defaultGoalView}
          onChange={(e) => updatePreferences({ defaultGoalView: e.target.value as GoalDefaultView })}
          className={selectClass}
        >
          <option value="grid">Grid</option>
          <option value="list">List</option>
          <option value="kanban">Kanban</option>
        </select>
      </Field>

      <p className="text-xs text-zinc-400 dark:text-zinc-500">
        These defaults apply the next time you open each section — they won't change what you're currently viewing.
      </p>
    </div>
  );
}
