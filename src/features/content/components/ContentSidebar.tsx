import { forwardRef, useState } from "react";
import { LayoutDashboard, CalendarDays, Lightbulb, ListChecks, BarChart3, Search, Star, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import type { ContentStatus } from "@/types/models";
import { statusConfig, statusOrder } from "@/features/content/status-config";
import { platformOptions } from "@/features/content/platforms";

export type ContentView = "dashboard" | "calendar" | "ideas" | "all" | "analytics";

const views: { value: ContentView; label: string; icon: typeof LayoutDashboard }[] = [
  { value: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { value: "calendar", label: "Calendar", icon: CalendarDays },
  { value: "ideas", label: "Ideas", icon: Lightbulb },
  { value: "all", label: "All Content", icon: ListChecks },
  { value: "analytics", label: "Analytics", icon: BarChart3 },
];

interface ContentSidebarProps {
  view: ContentView;
  onViewChange: (view: ContentView) => void;
  search: string;
  onSearchChange: (value: string) => void;
  statusFilter: ContentStatus | "all";
  onStatusFilterChange: (value: ContentStatus | "all") => void;
  platformFilter: string | "all";
  onPlatformFilterChange: (value: string) => void;
  categories: string[];
  categoryFilter: string | "all";
  onCategoryFilterChange: (value: string) => void;
  onAddCategory: (name: string) => void;
  campaigns: string[];
  campaignFilter: string | "all";
  onCampaignFilterChange: (value: string) => void;
  onAddCampaign: (name: string) => void;
  favoritesOnly: boolean;
  onFavoritesOnlyChange: (value: boolean) => void;
}

export const ContentSidebar = forwardRef<HTMLInputElement, ContentSidebarProps>(
  (
    {
      view,
      onViewChange,
      search,
      onSearchChange,
      statusFilter,
      onStatusFilterChange,
      platformFilter,
      onPlatformFilterChange,
      categories,
      categoryFilter,
      onCategoryFilterChange,
      onAddCategory,
      campaigns,
      campaignFilter,
      onCampaignFilterChange,
      onAddCampaign,
      favoritesOnly,
      onFavoritesOnlyChange,
    },
    searchRef
  ) => {
    const [newCategory, setNewCategory] = useState("");
    const [newCampaign, setNewCampaign] = useState("");

    function handleAddCategory(e: React.FormEvent) {
      e.preventDefault();
      if (newCategory.trim()) {
        onAddCategory(newCategory.trim());
        setNewCategory("");
      }
    }

    function handleAddCampaign(e: React.FormEvent) {
      e.preventDefault();
      if (newCampaign.trim()) {
        onAddCampaign(newCampaign.trim());
        setNewCampaign("");
      }
    }

    return (
      <div className="flex flex-col gap-5">
        <nav aria-label="Content views" className="flex flex-col gap-0.5">
          {views.map((v) => (
            <button
              key={v.value}
              onClick={() => onViewChange(v.value)}
              aria-current={view === v.value}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2.5 h-10 md:h-9 text-sm font-medium text-left transition-colors duration-150 nav-glow",
                view === v.value
                  ? "bg-accent-50 text-accent-700 dark:bg-accent-500/15 dark:text-accent-400 nav-glow-active"
                  : "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
              )}
            >
              <v.icon className="h-4 w-4 shrink-0" />
              {v.label}
            </button>
          ))}
        </nav>

        {(view === "all" || view === "ideas") && (
          <div className="flex flex-col gap-4 border-t border-[var(--color-border)] pt-4">
            <label className="relative block">
              <span className="sr-only">Search content</span>
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
              <input
                ref={searchRef}
                type="text"
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search title, tags, platform…"
                className="w-full h-11 md:h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-accent-400"
              />
            </label>

            {view === "all" && (
              <div>
                <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Status</label>
                <select
                  value={statusFilter}
                  onChange={(e) => onStatusFilterChange(e.target.value as ContentStatus | "all")}
                  className="w-full h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-400"
                >
                  <option value="all">All statuses</option>
                  {statusOrder.map((s) => (
                    <option key={s} value={s}>
                      {statusConfig[s].label}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Platform</label>
              <select
                value={platformFilter}
                onChange={(e) => onPlatformFilterChange(e.target.value)}
                className="w-full h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-400"
              >
                <option value="all">All platforms</option>
                {platformOptions.map((p) => (
                  <option key={p.value} value={p.value}>
                    {p.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Category</label>
              <select
                value={categoryFilter}
                onChange={(e) => onCategoryFilterChange(e.target.value)}
                className="w-full h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-400"
              >
                <option value="all">All categories</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <form onSubmit={handleAddCategory} className="flex gap-1.5 mt-1.5">
                <input
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="Add category"
                  aria-label="New category name"
                  className="flex-1 h-8 rounded-lg border border-[var(--color-border)] bg-transparent px-2 text-xs outline-none focus:ring-2 focus:ring-accent-400"
                />
                <button
                  type="submit"
                  aria-label="Add category"
                  className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-500 dark:text-zinc-400 mb-1.5">Campaign</label>
              <select
                value={campaignFilter}
                onChange={(e) => onCampaignFilterChange(e.target.value)}
                className="w-full h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-sm outline-none focus:ring-2 focus:ring-accent-400"
              >
                <option value="all">All campaigns</option>
                {campaigns.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
              <form onSubmit={handleAddCampaign} className="flex gap-1.5 mt-1.5">
                <input
                  value={newCampaign}
                  onChange={(e) => setNewCampaign(e.target.value)}
                  placeholder="Add campaign"
                  aria-label="New campaign name"
                  className="flex-1 h-8 rounded-lg border border-[var(--color-border)] bg-transparent px-2 text-xs outline-none focus:ring-2 focus:ring-accent-400"
                />
                <button
                  type="submit"
                  aria-label="Add campaign"
                  className="h-8 w-8 shrink-0 flex items-center justify-center rounded-lg text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  <Plus className="h-4 w-4" />
                </button>
              </form>
            </div>

            <label className="flex items-center justify-between h-9">
              <span className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-300">
                <Star className="h-4 w-4" /> Favorites only
              </span>
              <input
                type="checkbox"
                checked={favoritesOnly}
                onChange={(e) => onFavoritesOnlyChange(e.target.checked)}
                className="h-4 w-4 rounded accent-accent-500"
              />
            </label>
          </div>
        )}
      </div>
    );
  }
);

ContentSidebar.displayName = "ContentSidebar";
