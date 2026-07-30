import { useState } from "react";
import { Star } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useShake } from "@/hooks/useShake";
import { cn } from "@/lib/utils/cn";
import { platformOptions } from "@/features/content/platforms";
import { statusOrder, statusConfig } from "@/features/content/status-config";
import { AIQuickActions } from "./AIQuickActions";
import type { ContentPostInput } from "@/features/content/content-store";
import type { ContentPost, ContentPlatform, ContentStatus, Priority } from "@/types/models";

interface ContentFormProps {
  initial?: ContentPost;
  categories: string[];
  campaigns: string[];
  onSubmit: (values: ContentPostInput) => void;
  onCancel: () => void;
  onToggleFavorite?: () => void;
}

function toCsv(list: string[]): string {
  return list.join(", ");
}
function fromCsv(value: string): string[] {
  return value
    .split(/[,\n]/)
    .map((v) => v.trim())
    .filter(Boolean);
}

export function ContentForm({ initial, categories, campaigns, onSubmit, onCancel, onToggleFavorite }: ContentFormProps) {
  const [title, setTitle] = useState(initial?.title ?? "");
  const titleShake = useShake();
  const [description, setDescription] = useState(initial?.description ?? "");
  const [body, setBody] = useState(initial?.body ?? "");
  const [platform, setPlatform] = useState<ContentPlatform>(initial?.platform ?? "x");
  const [customPlatformName, setCustomPlatformName] = useState(initial?.customPlatformName ?? "");
  const [hashtags, setHashtags] = useState(toCsv(initial?.hashtags ?? []));
  const [mentions, setMentions] = useState(toCsv(initial?.mentions ?? []));
  const [status, setStatus] = useState<ContentStatus>(initial?.status ?? "idea");
  const [priority, setPriority] = useState<Priority>(initial?.priority ?? "medium");
  const [category, setCategory] = useState(initial?.category ?? categories[0] ?? "Social");
  const [campaign, setCampaign] = useState(initial?.campaign ?? campaigns[0] ?? "General");
  const [tags, setTags] = useState(toCsv(initial?.tags ?? []));
  const [publishDate, setPublishDate] = useState(initial?.publishDate ?? "");
  const [publishTime, setPublishTime] = useState(initial?.publishTime ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      titleShake.trigger();
      return;
    }
    onSubmit({
      title: title.trim(),
      description: description.trim(),
      body,
      platform,
      customPlatformName: customPlatformName.trim(),
      hashtags: fromCsv(hashtags),
      mentions: fromCsv(mentions),
      status,
      priority,
      category,
      campaign,
      tags: fromCsv(tags),
      publishDate: publishDate || null,
      publishTime: publishTime || null,
      notes: notes.trim(),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {initial && <AIQuickActions post={{ ...initial, title, body, platform }} onApplyBody={(text) => setBody(text)} />}

      <div className="flex items-start gap-2">
        <div className="flex-1">
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Title</label>
          <input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onAnimationEnd={titleShake.onAnimationEnd}
            placeholder="What's this content about?"
            className={cn(
              "w-full h-11 rounded-lg border bg-transparent px-3 text-sm outline-none focus:ring-2 focus:ring-accent-400",
              titleShake.shaking ? "border-danger field-shake" : "border-[var(--color-border)]"
            )}
          />
        </div>
        {onToggleFavorite && (
          <button
            type="button"
            onClick={onToggleFavorite}
            className={cn(
              "h-11 w-11 mt-6 shrink-0 flex items-center justify-center rounded-lg border border-[var(--color-border)]",
              initial?.favorite ? "text-amber-400" : "text-zinc-300 dark:text-zinc-600"
            )}
          >
            <Star className="h-5 w-5" fill={initial?.favorite ? "currentColor" : "none"} />
          </button>
        )}
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Short idea-stage summary"
          rows={2}
          className="w-full rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-400 resize-none"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Body</label>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Write the full post/script here…"
          rows={6}
          className="w-full rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-400 resize-none font-mono"
        />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Platform</label>
          <select
            value={platform}
            onChange={(e) => setPlatform(e.target.value as ContentPlatform)}
            className="w-full h-9 rounded-lg border border-[var(--color-border)] bg-transparent px-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          >
            {platformOptions.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
        {platform === "custom" && (
          <div>
            <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Custom platform name</label>
            <input
              value={customPlatformName}
              onChange={(e) => setCustomPlatformName(e.target.value)}
              placeholder="e.g. Discord"
              className="w-full h-9 rounded-lg border border-[var(--color-border)] bg-transparent px-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-400"
            />
          </div>
        )}
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Status</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as ContentStatus)}
            className="w-full h-9 rounded-lg border border-[var(--color-border)] bg-transparent px-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          >
            {statusOrder.map((s) => (
              <option key={s} value={s}>
                {statusConfig[s].label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Priority</label>
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="w-full h-9 rounded-lg border border-[var(--color-border)] bg-transparent px-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full h-9 rounded-lg border border-[var(--color-border)] bg-transparent px-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          >
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Campaign</label>
          <select
            value={campaign}
            onChange={(e) => setCampaign(e.target.value)}
            className="w-full h-9 rounded-lg border border-[var(--color-border)] bg-transparent px-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          >
            {campaigns.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Publish date</label>
          <input
            type="date"
            value={publishDate}
            onChange={(e) => setPublishDate(e.target.value)}
            className="w-full h-9 rounded-lg border border-[var(--color-border)] bg-transparent px-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Publish time</label>
          <input
            type="time"
            value={publishTime}
            onChange={(e) => setPublishTime(e.target.value)}
            className="w-full h-9 rounded-lg border border-[var(--color-border)] bg-transparent px-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-400"
          />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Hashtags (comma separated)</label>
        <input
          value={hashtags}
          onChange={(e) => setHashtags(e.target.value)}
          placeholder="#launch, #buildinpublic"
          className="w-full h-9 rounded-lg border border-[var(--color-border)] bg-transparent px-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-400"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Mentions (comma separated)</label>
        <input
          value={mentions}
          onChange={(e) => setMentions(e.target.value)}
          placeholder="@someone"
          className="w-full h-9 rounded-lg border border-[var(--color-border)] bg-transparent px-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-400"
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Tags</label>
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Custom labels, comma separated"
          className="w-full h-9 rounded-lg border border-[var(--color-border)] bg-transparent px-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-400"
        />
      </div>

      <div className="rounded-lg border border-dashed border-[var(--color-border)] px-3 py-2.5 text-xs text-zinc-400 dark:text-zinc-500">
        Attachments - coming in a future update.
      </div>

      <div>
        <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Notes</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full rounded-lg border border-[var(--color-border)] bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-accent-400 resize-none"
        />
      </div>

      <div className="flex items-center justify-end gap-2 pt-1">
        <Button variant="ghost" type="button" onClick={onCancel}>
          Cancel
        </Button>
        <Button variant="primary" type="submit">
          {initial ? "Save changes" : "Create"}
        </Button>
      </div>
    </form>
  );
}
