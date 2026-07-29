import { useMemo, useState } from "react";
import { Plus, CheckSquare } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useTasksStore } from "@/features/tasks/tasks-store";
import { TaskItem } from "@/features/tasks/components/TaskItem";
import { TaskForm, type TaskFormValues } from "@/features/tasks/components/TaskForm";
import { TaskFilters, type StatusFilter, type SortMode } from "@/features/tasks/components/TaskFilters";
import { ProgressSummary } from "@/features/tasks/components/ProgressSummary";
import { priorityOrder } from "@/features/tasks/priority-config";
import type { Task } from "@/types/models";

export function TasksPage() {
  const { tasks, addTask, toggleTask, updateTask, deleteTask } = useTasksStore();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const [status, setStatus] = useState<StatusFilter>("all");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<SortMode>("dueDate");

  const categories = useMemo(() => Array.from(new Set(tasks.map((t) => t.category))), [tasks]);

  const visibleTasks = useMemo(() => {
    let list = tasks;
    if (status === "active") list = list.filter((t) => !t.completed);
    if (status === "completed") list = list.filter((t) => t.completed);
    if (category !== "all") list = list.filter((t) => t.category === category);

    return [...list].sort((a, b) => {
      if (sort === "priority") return priorityOrder[a.priority] - priorityOrder[b.priority];
      if (sort === "created") return b.createdAt.localeCompare(a.createdAt);
      // dueDate: tasks without a due date sink to the bottom
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.localeCompare(b.dueDate);
    });
  }, [tasks, status, category, sort]);

  function openCreateModal() {
    setEditingTask(null);
    setModalOpen(true);
  }

  function openEditModal(task: Task) {
    setEditingTask(task);
    setModalOpen(true);
  }

  function handleSubmit(values: TaskFormValues) {
    if (editingTask) {
      updateTask(editingTask.id, values);
    } else {
      addTask(values);
    }
    setModalOpen(false);
  }

  return (
    <div className="flex flex-col gap-5 pb-24 md:pb-0">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Tasks</h2>
        <Button variant="primary" onClick={openCreateModal} className="hidden md:inline-flex">
          <Plus className="h-4 w-4" /> New task
        </Button>
      </div>

      {tasks.length > 0 && <ProgressSummary tasks={tasks} />}

      {tasks.length > 0 && (
        <TaskFilters
          status={status}
          onStatusChange={setStatus}
          category={category}
          onCategoryChange={setCategory}
          categories={categories}
          sort={sort}
          onSortChange={setSort}
        />
      )}

      {tasks.length === 0 ? (
        <div className="flex flex-col items-center justify-center text-center py-20 gap-3 empty-state-in">
          <div className="h-12 w-12 rounded-xl bg-accent-50 dark:bg-accent-500/15 flex items-center justify-center">
            <CheckSquare className="h-6 w-6 text-accent-500" />
          </div>
          <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">No tasks yet</h3>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-xs">
            Add your first task to start tracking what needs to get done.
          </p>
          <Button variant="primary" onClick={openCreateModal} className="mt-1">
            <Plus className="h-4 w-4" /> Add a task
          </Button>
        </div>
      ) : visibleTasks.length === 0 ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-12">
          No tasks match these filters.
        </p>
      ) : (
        <div className="flex flex-col gap-2.5">
          {visibleTasks.map((task, i) => (
            <div key={task.id} className="item-in" style={{ "--stagger-delay": `${Math.min(i * 30, 300)}ms` } as React.CSSProperties}>
              <TaskItem
                task={task}
                onToggle={() => toggleTask(task.id)}
                onEdit={() => openEditModal(task)}
                onDelete={() => deleteTask(task.id)}
              />
            </div>
          ))}
        </div>
      )}

      {/* Mobile floating action button - sits above the bottom nav, safe-area aware */}
      <button
        onClick={openCreateModal}
        aria-label="Add task"
        className="md:hidden fixed right-4 bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] h-14 w-14 rounded-full bg-accent-500 text-white shadow-lg shadow-accent-500/30 flex items-center justify-center active:bg-accent-600 transition-colors z-10"
      >
        <Plus className="h-6 w-6" />
      </button>

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingTask ? "Edit task" : "New task"}
      >
        <TaskForm
          initial={editingTask ?? undefined}
          existingCategories={categories}
          onSubmit={handleSubmit}
          onCancel={() => setModalOpen(false)}
        />
      </Modal>
    </div>
  );
}
