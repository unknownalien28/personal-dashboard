import { Injectable } from "@nestjs/common";
import { PrismaService } from "../database/prisma.service";

export interface SearchResultItem {
  type: "task" | "note" | "event" | "goal" | "content" | "workspace" | "transaction" | "bill" | "budget";
  id: string;
  title: string;
  snippet?: string;
  updatedAt: Date;
}

@Injectable()
export class SearchService {
  constructor(private readonly prisma: PrismaService) {}

  /** Fans out a single query across every searchable module and merges results by recency. */
  async search(userId: string, query: string, limit = 20): Promise<SearchResultItem[]> {
    if (!query.trim()) return [];
    const mode = "insensitive" as const;

    const [tasks, notes, events, goals, content, workspace, transactions, bills, budgets] = await Promise.all([
      this.prisma.task.findMany({
        where: { userId, title: { contains: query, mode } },
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.note.findMany({
        where: { userId, deletedAt: null, OR: [{ title: { contains: query, mode } }, { content: { contains: query, mode } }] },
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.calendarEvent.findMany({
        where: { userId, title: { contains: query, mode } },
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.goal.findMany({
        where: { userId, deletedAt: null, title: { contains: query, mode } },
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.contentPost.findMany({
        where: { userId, OR: [{ title: { contains: query, mode } }, { body: { contains: query, mode } }] },
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.workspaceDocument.findMany({
        where: { userId, OR: [{ title: { contains: query, mode } }, { content: { contains: query, mode } }] },
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.transaction.findMany({
        where: { userId, OR: [{ category: { contains: query, mode } }, { notes: { contains: query, mode } }] },
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.bill.findMany({
        where: { userId, OR: [{ name: { contains: query, mode } }, { category: { contains: query, mode } }] },
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
      this.prisma.budget.findMany({
        where: { userId, category: { contains: query, mode } },
        take: limit,
        orderBy: { updatedAt: "desc" },
      }),
    ]);

    const results: SearchResultItem[] = [
      ...tasks.map((t) => ({ type: "task" as const, id: t.id, title: t.title, updatedAt: t.updatedAt })),
      ...notes.map((n) => ({ type: "note" as const, id: n.id, title: n.title, snippet: snippet(n.content), updatedAt: n.updatedAt })),
      ...events.map((e) => ({ type: "event" as const, id: e.id, title: e.title, updatedAt: e.updatedAt })),
      ...goals.map((g) => ({ type: "goal" as const, id: g.id, title: g.title, updatedAt: g.updatedAt })),
      ...content.map((c) => ({ type: "content" as const, id: c.id, title: c.title, snippet: snippet(c.body), updatedAt: c.updatedAt })),
      ...workspace.map((w) => ({
        type: "workspace" as const,
        id: w.id,
        title: w.title,
        snippet: snippet(w.content),
        updatedAt: w.updatedAt,
      })),
      ...transactions.map((t) => ({
        type: "transaction" as const,
        id: t.id,
        title: `${t.type === "expense" ? "-" : "+"}${t.amount} · ${t.category || "Uncategorized"}`,
        snippet: t.notes || undefined,
        updatedAt: t.updatedAt,
      })),
      ...bills.map((b) => ({ type: "bill" as const, id: b.id, title: b.name, updatedAt: b.updatedAt })),
      ...budgets.map((b) => ({ type: "budget" as const, id: b.id, title: `${b.category} budget`, updatedAt: b.updatedAt })),
    ];

    return results.sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime()).slice(0, limit);
  }
}

function snippet(text: string, length = 160): string {
  const trimmed = text.trim().replace(/\s+/g, " ");
  return trimmed.length > length ? `${trimmed.slice(0, length)}…` : trimmed;
}
