import type { NavigateFunction } from "react-router-dom";
import { askAlien } from "@/features/ai/ask-alien";

/**
 * Registry for the Ctrl/Cmd+K command palette (see CommandPalette.tsx for the
 * UI and AppShell for the global keydown listener). `label` starting with
 * ">" mirrors the spec's example syntax (">Create task").
 */
export interface CommandDefinition {
  id: string;
  label: string;
  hint?: string;
  run: (navigate: NavigateFunction) => void;
}

export const commandRegistry: CommandDefinition[] = [
  { id: "create-task", label: ">Create task", hint: "Tasks", run: (navigate) => navigate("/tasks") },
  { id: "create-note", label: ">Create note", hint: "Notes", run: (navigate) => navigate("/notes") },
  { id: "search-notes", label: ">Search notes", hint: "Notes", run: (navigate) => navigate("/notes") },
  { id: "open-finance", label: ">Open Finance", hint: "Finance", run: (navigate) => navigate("/finance") },
  { id: "open-goals", label: ">Open Goals", hint: "Goals", run: (navigate) => navigate("/goals") },
  { id: "ask-alien", label: ">Ask Alien", hint: "Alien Assistant", run: (navigate) => navigate("/ai") },
  { id: "calendar-today", label: ">Calendar today", hint: "Calendar", run: (navigate) => navigate("/calendar") },
  { id: "create-content", label: ">Create Content", hint: "Content Planner", run: (navigate) => navigate("/content") },
  { id: "schedule-post", label: ">Schedule Post", hint: "Content Planner", run: (navigate) => navigate("/content") },
  {
    id: "generate-caption",
    label: ">Generate Caption",
    hint: "Alien Assistant",
    run: (navigate) => {
      navigate("/content");
      askAlien("Generate a caption for my next piece of content.", ["content"]);
    },
  },
  {
    id: "generate-ideas",
    label: ">Generate Ideas",
    hint: "Alien Assistant",
    run: (navigate) => {
      navigate("/content");
      askAlien("Brainstorm 5 content ideas for me.", ["content"]);
    },
  },
  { id: "open-content-planner", label: ">Open Content Planner", hint: "Content Planner", run: (navigate) => navigate("/content") },
];
