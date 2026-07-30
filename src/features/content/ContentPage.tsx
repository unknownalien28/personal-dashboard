import { useMemo, useRef, useState } from "react";
import { Plus, Megaphone } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { EmptyState } from "@/components/ui/EmptyState";
import { useContentStore, type ContentPostInput } from "@/features/content/content-store";
import { defaultContentCategories, defaultContentCampaigns } from "@/features/content/status-config";
import { ContentSidebar, type ContentView } from "@/features/content/components/ContentSidebar";
import { ContentDashboardView } from "@/features/content/components/ContentDashboardView";
import { ContentCalendarView } from "@/features/content/components/ContentCalendarView";
import { ContentIdeasView } from "@/features/content/components/ContentIdeasView";
import { ContentAnalyticsView } from "@/features/content/components/ContentAnalyticsView";
import { ContentCard } from "@/features/content/components/ContentCard";
import { ContentForm } from "@/features/content/components/ContentForm";
import type { ContentPost, ContentStatus } from "@/types/models";

export function ContentPage() {
  const {
    posts,
    customCategories,
    customCampaigns,
    createPost,
    updatePost,
    deletePost,
    toggleFavorite,
    reschedule,
    setActiveEditingId,
    addCustomCategory,
    addCustomCampaign,
  } = useContentStore();

  const [view, setView] = useState<ContentView>("dashboard");
  const [modal, setModal] = useState<{ id: string | null } | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ContentStatus | "all">("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [campaignFilter, setCampaignFilter] = useState("all");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(() => Array.from(new Set([...defaultContentCategories, ...customCategories])), [customCategories]);
  const campaigns = useMemo(() => Array.from(new Set([...defaultContentCampaigns, ...customCampaigns])), [customCampaigns]);

  const ideas = useMemo(() => posts.filter((p) => p.status === "idea"), [posts]);

  const filteredPosts = useMemo(() => {
    const q = search.trim().toLowerCase();
    return posts.filter((p) => {
      if (statusFilter !== "all" && p.status !== statusFilter) return false;
      if (platformFilter !== "all" && p.platform !== platformFilter) return false;
      if (categoryFilter !== "all" && p.category !== categoryFilter) return false;
      if (campaignFilter !== "all" && p.campaign !== campaignFilter) return false;
      if (favoritesOnly && !p.favorite) return false;
      if (!q) return true;
      return (
        p.title.toLowerCase().includes(q) ||
        p.platform.toLowerCase().includes(q) ||
        p.status.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q)) ||
        p.category.toLowerCase().includes(q) ||
        p.campaign.toLowerCase().includes(q) ||
        (p.publishDate ?? "").includes(q)
      );
    });
  }, [posts, search, statusFilter, platformFilter, categoryFilter, campaignFilter, favoritesOnly]);

  const editingPost: ContentPost | undefined = modal?.id ? posts.find((p) => p.id === modal.id) : undefined;

  function openCreate() {
    setModal({ id: null });
  }
  function openEdit(id: string) {
    setModal({ id });
    setActiveEditingId(id);
  }
  function closeModal() {
    setModal(null);
    setActiveEditingId(null);
  }

  function handleSubmit(values: ContentPostInput) {
    if (modal?.id) {
      updatePost(modal.id, values);
    } else {
      createPost(values);
    }
    closeModal();
  }

  function handleQuickCreateIdea(title: string) {
    createPost({ title, status: "idea", platform: "x" });
  }

  return (
    <div className="flex flex-col gap-5 pb-24 md:pb-0 md:h-[calc(100vh-8.5rem)]">
      <div className="hidden md:flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Content Planner</h2>
        <Button variant="primary" onClick={openCreate}>
          <Plus className="h-4 w-4" /> Create Content
        </Button>
      </div>

      <div className="flex flex-col md:flex-row md:flex-1 gap-5 md:min-h-0">
        <div className="md:w-56 shrink-0 md:overflow-y-auto">
          <ContentSidebar
            ref={searchInputRef}
            view={view}
            onViewChange={setView}
            search={search}
            onSearchChange={setSearch}
            statusFilter={statusFilter}
            onStatusFilterChange={setStatusFilter}
            platformFilter={platformFilter}
            onPlatformFilterChange={setPlatformFilter}
            categories={categories}
            categoryFilter={categoryFilter}
            onCategoryFilterChange={setCategoryFilter}
            onAddCategory={addCustomCategory}
            campaigns={campaigns}
            campaignFilter={campaignFilter}
            onCampaignFilterChange={setCampaignFilter}
            onAddCampaign={addCustomCampaign}
            favoritesOnly={favoritesOnly}
            onFavoritesOnlyChange={setFavoritesOnly}
          />
        </div>

        <div className="flex-1 min-w-0 flex flex-col gap-4 md:overflow-y-auto">
          <div className="flex items-center justify-between gap-2 md:hidden">
            <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 capitalize">{view}</h2>
            <Button variant="primary" size="sm" onClick={openCreate}>
              <Plus className="h-4 w-4" /> New
            </Button>
          </div>

          {view === "dashboard" && (
            <ContentDashboardView posts={posts} onOpenPost={openEdit} onNavigate={(v) => setView(v)} />
          )}

          {view === "calendar" && (
            <ContentCalendarView posts={posts} onOpenPost={openEdit} onReschedule={(id, dateKey) => reschedule(id, dateKey)} />
          )}

          {view === "ideas" && (
            <ContentIdeasView
              ideas={ideas}
              onQuickCreate={handleQuickCreateIdea}
              onOpenPost={openEdit}
              onToggleFavorite={toggleFavorite}
              onDelete={deletePost}
            />
          )}

          {view === "analytics" && <ContentAnalyticsView posts={posts} />}

          {view === "all" &&
            (filteredPosts.length === 0 ? (
              <EmptyState
                icon={Megaphone}
                description={posts.length === 0 ? "No content yet. Create your first post or idea." : "No content matches these filters."}
                action={posts.length === 0 ? { label: "Create Content", onClick: openCreate, icon: Plus } : undefined}
                compact
              />
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredPosts.map((p) => (
                  <ContentCard
                    key={p.id}
                    post={p}
                    onSelect={() => openEdit(p.id)}
                    onToggleFavorite={() => toggleFavorite(p.id)}
                    onDelete={() => deletePost(p.id)}
                  />
                ))}
              </div>
            ))}
        </div>
      </div>

      <Modal open={modal !== null} onClose={closeModal} title={modal?.id ? "Edit Content" : "Create Content"}>
        <ContentForm
          initial={editingPost}
          categories={categories}
          campaigns={campaigns}
          onSubmit={handleSubmit}
          onCancel={closeModal}
          onToggleFavorite={editingPost ? () => toggleFavorite(editingPost.id) : undefined}
        />
      </Modal>

      {/* Mobile floating action button */}
      <button
        onClick={openCreate}
        aria-label="Create content"
        className="md:hidden fixed right-4 bottom-[calc(4rem+env(safe-area-inset-bottom)+1rem)] h-14 w-14 rounded-full bg-accent-500 text-white shadow-lg shadow-accent-500/30 flex items-center justify-center active:bg-accent-600 transition-colors z-10"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}
