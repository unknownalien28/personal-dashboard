import { useTasksStore } from "@/features/tasks/tasks-store";
import { priorityOrder } from "@/features/tasks/priority-config";
import { ok, fail, type ToolResult } from "./types";
import type { Priority, Task } from "@/types/models";

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function findByTitle(title: string): Task | undefined {
  const q = title.trim().toLowerCase();
  const tasks = useTasksStore.getState().tasks;
  return (
    tasks.find((t) => t.title.toLowerCase() === q) ??
    tasks.find((t) => t.title.toLowerCase().includes(q))
  );
}

/** All non-completed tasks, sorted the way "what should I work on first" should read them: overdue first, then by priority, then by due date. */
export function getTasks(): ToolResult<Task[]> {
  const tasks = [...useTasksStore.getState().tasks].sort((a, b) => {
    const aOverdue = a.dueDate !== null && a.dueDate < today() && !a.completed;
    const bOverdue = b.dueDate !== null && b.dueDate < today() && !b.completed;
    if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
    if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
      return priorityOrder[a.priority] - priorityOrder[b.priority];
    }
    return (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
  });
  return ok(`Found ${tasks.length} task(s).`, tasks);
}

export function searchTasks(query: string): ToolResult<Task[]> {
  const q = query.trim().toLowerCase();
  const results = useTasksStore
    .getState()
    .tasks.filter((t) => t.title.toLowerCase().includes(q) || t.category.toLowerCase().includes(q));
  return ok(`Found ${results.length} task(s) matching "${query}".`, results);
}

export interface CreateTaskArgs {
  title: string;
  category?: string;
  priority?: Priority;
  dueDate?: string | null;
}

export function createTask(args: CreateTaskArgs): ToolResult<Task> {
  if (!args.title?.trim()) return fail("A task needs a title.");
  useTasksStore.getState().addTask({
    title: args.title.trim(),
    category: args.category?.trim() || "General",
    priority: args.priority ?? "medium",
    dueDate: args.dueDate ?? null,
  });
  const created = [...useTasksStore.getState().tasks].pop();
  return ok(`Created task "${args.title.trim()}".`, created);
}

export function updateTask(idOrTitle: string, updates: Partial<Pick<Task, "title" | "category" | "priority" | "dueDate">>): ToolResult<Task> {
  const task = useTasksStore.getState().tasks.find((t) => t.id === idOrTitle) ?? findByTitle(idOrTitle);
  if (!task) return fail(`Couldn't find a task matching "${idOrTitle}".`);
  useTasksStore.getState().updateTask(task.id, updates);
  return ok(`Updated "${task.title}".`, { ...task, ...updates });
}

export function completeTask(idOrTitle: string): ToolResult<Task> {
  const task = useTasksStore.getState().tasks.find((t) => t.id === idOrTitle) ?? findByTitle(idOrTitle);
  if (!task) return fail(`Couldn't find a task matching "${idOrTitle}".`);
  if (task.completed) return ok(`"${task.title}" is already complete.`, task);
  useTasksStore.getState().toggleTask(task.id);
  return ok(`Marked "${task.title}" as complete.`, { ...task, completed: true });
}

export function deleteTask(idOrTitle: string): ToolResult<{ id: string }> {
  const task = useTasksStore.getState().tasks.find((t) => t.id === idOrTitle) ?? findByTitle(idOrTitle);
  if (!task) return fail(`Couldn't find a task matching "${idOrTitle}".`);
  useTasksStore.getState().deleteTask(task.id);
  return ok(`Deleted "${task.title}".`, { id: task.id });
}

/** Overdue, incomplete tasks - used both as a tool and by the proactive-insights engine. */
export function detectOverdueTasks(): ToolResult<Task[]> {
  const overdue = useTasksStore
    .getState()
    .tasks.filter((t) => !t.completed && t.dueDate !== null && t.dueDate < today());
  return ok(`${overdue.length} overdue task(s).`, overdue);
}

/** Heuristic subtask suggestions - no model round-trip required, just splits on common separators/keywords. */
export function suggestSubtasks(idOrTitle: string): ToolResult<string[]> {
  const task = useTasksStore.getState().tasks.find((t) => t.id === idOrTitle) ?? findByTitle(idOrTitle);
  const title = task?.title ?? idOrTitle;
  const parts = title
    .split(/,| and | then |;/i)
    .map((p) => p.trim())
    .filter(Boolean);

  const suggestions =
    parts.length > 1
      ? parts.map((p) => p.charAt(0).toUpperCase() + p.slice(1))
      : [`Research what "${title}" involves`, `Draft/start "${title}"`, `Review and finish "${title}"`];

  return ok(`${suggestions.length} suggested subtask(s) for "${title}".`, suggestions);
}
