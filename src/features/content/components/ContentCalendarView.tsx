import { useMemo, useState } from "react";
import { format, isSameMonth, isToday, addMonths, addWeeks, addDays } from "date-fns";
import { ChevronLeft, ChevronRight, CalendarCheck2 } from "lucide-react";
import { SegmentedControl } from "@/components/ui/SegmentedControl";
import { Button } from "@/components/ui/Button";
import { getMonthGrid, getWeekDays, toDateKey } from "@/features/calendar/date-utils";
import { useDragReschedule } from "@/features/calendar/useDragReschedule";
import { platformConfig } from "@/features/content/platforms";
import { statusConfig } from "@/features/content/status-config";
import type { ContentPost } from "@/types/models";
import { cn } from "@/lib/utils/cn";

type ContentCalendarSubview = "month" | "week" | "day";
const MAX_VISIBLE_PER_DAY = 3;

interface ContentCalendarViewProps {
  posts: ContentPost[];
  onOpenPost: (id: string) => void;
  onReschedule: (id: string, dateKey: string) => void;
}

function PostDot({
  post,
  dense,
  onClick,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  isDragging,
}: {
  post: ContentPost;
  dense?: boolean;
  onClick: () => void;
  onPointerDown: (e: React.PointerEvent) => void;
  onPointerMove: (e: React.PointerEvent) => void;
  onPointerUp: (e: React.PointerEvent) => void;
  isDragging: boolean;
}) {
  const platform = platformConfig[post.platform];
  const status = statusConfig[post.status];
  return (
    <button
      type="button"
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onClick={onClick}
      className={cn(
        "flex items-center gap-1 rounded px-1 py-0.5 text-left w-full overflow-hidden hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-opacity",
        isDragging && "opacity-40",
        dense ? "text-[10px]" : "text-xs"
      )}
      style={{ touchAction: "none" }}
    >
      <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ backgroundColor: platform.colorVar }} />
      <span className="truncate flex-1 text-zinc-700 dark:text-zinc-200">{post.title || "Untitled"}</span>
      {(post.status === "published" || post.status === "scheduled") && (
        <span
          className={cn("shrink-0 h-1.5 w-1.5 rounded-full", post.status === "published" ? "bg-emerald-500" : "bg-accent-500")}
          title={status.label}
        />
      )}
    </button>
  );
}

export function ContentCalendarView({ posts, onOpenPost, onReschedule }: ContentCalendarViewProps) {
  const [subview, setSubview] = useState<ContentCalendarSubview>("month");
  const [reference, setReference] = useState(new Date());

  const { activeDragId, dragOverDate, handlePointerDown, handlePointerMove, handlePointerUp, consumeWasDragged } = useDragReschedule(
    (id, dateKey) => onReschedule(id, dateKey)
  );

  const postsByDate = useMemo(() => {
    const map = new Map<string, ContentPost[]>();
    for (const p of posts) {
      if (!p.publishDate) continue;
      const list = map.get(p.publishDate) ?? [];
      list.push(p);
      map.set(p.publishDate, list);
    }
    return map;
  }, [posts]);

  function handlePrev() {
    setReference((d) => (subview === "month" ? addMonths(d, -1) : subview === "week" ? addWeeks(d, -1) : addDays(d, -1)));
  }
  function handleNext() {
    setReference((d) => (subview === "month" ? addMonths(d, 1) : subview === "week" ? addWeeks(d, 1) : addDays(d, 1)));
  }

  function openIfNotDragged(id: string) {
    if (!consumeWasDragged()) onOpenPost(id);
  }

  const periodLabel =
    subview === "month"
      ? format(reference, "MMMM yyyy")
      : subview === "week"
        ? `Week of ${format(getWeekDays(reference)[0], "MMM d")}`
        : format(reference, "EEEE, MMM d");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-1">
          <Button variant="secondary" size="icon" onClick={handlePrev} aria-label="Previous">
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="secondary" size="sm" onClick={() => setReference(new Date())}>
            Today
          </Button>
          <Button variant="secondary" size="icon" onClick={handleNext} aria-label="Next">
            <ChevronRight className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium text-zinc-700 dark:text-zinc-200 ml-2">{periodLabel}</span>
        </div>
        <SegmentedControl
          value={subview}
          onChange={setSubview}
          options={[
            { value: "month", label: "Month" },
            { value: "week", label: "Week" },
            { value: "day", label: "Day" },
          ]}
        />
      </div>

      {subview === "month" && (
        <div className="flex flex-col border border-[var(--color-border)] rounded-xl overflow-hidden">
          <div className="grid grid-cols-7 border-b border-[var(--color-border)] bg-[var(--color-surface)]">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="py-2 text-center text-xs font-medium text-zinc-500 dark:text-zinc-400">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {getMonthGrid(reference)
              .flat()
              .map((day) => {
                const dateKey = toDateKey(day);
                const dayPosts = postsByDate.get(dateKey) ?? [];
                const visible = dayPosts.slice(0, MAX_VISIBLE_PER_DAY);
                const overflow = dayPosts.length - visible.length;
                const inMonth = isSameMonth(day, reference);
                const isDropTarget = dragOverDate === dateKey;

                return (
                  <div
                    key={dateKey}
                    data-date={dateKey}
                    className={cn(
                      "min-h-[84px] md:min-h-[100px] border-b border-r border-[var(--color-border)] p-1.5 flex flex-col gap-1",
                      !inMonth && "bg-zinc-50/60 dark:bg-zinc-900/40",
                      isDropTarget && "bg-accent-50 dark:bg-accent-500/10"
                    )}
                  >
                    <span
                      className={cn(
                        "h-6 w-6 flex items-center justify-center rounded-full text-xs shrink-0",
                        !inMonth && "text-zinc-300 dark:text-zinc-700",
                        inMonth && !isToday(day) && "text-zinc-700 dark:text-zinc-300",
                        isToday(day) && "bg-accent-500 text-white font-semibold"
                      )}
                    >
                      {format(day, "d")}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      {visible.map((p) => (
                        <PostDot
                          key={p.id}
                          post={p}
                          dense
                          isDragging={activeDragId === p.id}
                          onPointerDown={(e) => handlePointerDown(p.id, e)}
                          onPointerMove={handlePointerMove}
                          onPointerUp={handlePointerUp}
                          onClick={() => openIfNotDragged(p.id)}
                        />
                      ))}
                      {overflow > 0 && <span className="text-[10px] text-zinc-400 px-1">+{overflow} more</span>}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}

      {subview === "week" && (
        <div className="grid grid-cols-1 sm:grid-cols-7 gap-2">
          {getWeekDays(reference).map((day) => {
            const dateKey = toDateKey(day);
            const dayPosts = postsByDate.get(dateKey) ?? [];
            return (
              <div key={dateKey} className="rounded-xl border border-[var(--color-border)] p-2 flex flex-col gap-1 min-h-[110px]">
                <span className={cn("text-xs font-medium", isToday(day) ? "text-accent-500" : "text-zinc-500 dark:text-zinc-400")}>
                  {format(day, "EEE d")}
                </span>
                {dayPosts.length === 0 ? (
                  <span className="text-[11px] text-zinc-300 dark:text-zinc-600">No posts</span>
                ) : (
                  dayPosts.map((p) => (
                    <PostDot
                      key={p.id}
                      post={p}
                      isDragging={activeDragId === p.id}
                      onPointerDown={(e) => handlePointerDown(p.id, e)}
                      onPointerMove={handlePointerMove}
                      onPointerUp={handlePointerUp}
                      onClick={() => openIfNotDragged(p.id)}
                    />
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}

      {subview === "day" && (
        <div className="rounded-xl border border-[var(--color-border)] p-3 flex flex-col gap-1.5 min-h-[160px]">
          {(postsByDate.get(toDateKey(reference)) ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-2 py-10 text-zinc-400 dark:text-zinc-500">
              <CalendarCheck2 className="h-5 w-5" />
              <span className="text-sm">Nothing scheduled for this day.</span>
            </div>
          ) : (
            (postsByDate.get(toDateKey(reference)) ?? []).map((p) => (
              <PostDot
                key={p.id}
                post={p}
                isDragging={activeDragId === p.id}
                onPointerDown={(e) => handlePointerDown(p.id, e)}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onClick={() => openIfNotDragged(p.id)}
              />
            ))
          )}
        </div>
      )}
    </div>
  );
}
