import { Injectable } from "@nestjs/common";
import { NotesService } from "../../notes/notes.service";
import { AiTool, ToolExecutionResult } from "./tool.interface";

@Injectable()
export class SearchNotesTool implements AiTool {
  readonly name = "search_notes";
  readonly description = "Search the user's notes by title/content text. Use this to find a note's id before updating it, or to answer questions about what the user has noted down.";
  readonly parameters = {
    type: "object" as const,
    properties: {
      query: { type: "string", description: "Text to search for in note titles/content." },
      filter: { type: "string", enum: ["all", "pinned", "archived", "trash"], description: "Defaults to 'all'." },
      limit: { type: "integer", description: "Max results to return, default 10, max 50." },
    },
    required: ["query"],
  };

  constructor(private readonly notesService: NotesService) {}

  async execute(userId: string, args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const query = typeof args.query === "string" ? args.query : "";
    if (!query.trim()) return { success: false, message: "Invalid input: query is required." };

    const filter = (["all", "pinned", "archived", "trash"] as const).includes(args.filter as never)
      ? (args.filter as "all" | "pinned" | "archived" | "trash")
      : "all";
    const limit = Math.min(typeof args.limit === "number" ? args.limit : 10, 50);

    const result = await this.notesService.findAll(userId, { page: 1, limit, filter, search: query });
    return {
      success: true,
      message: `Found ${result.items.length} note(s) matching "${query}".`,
      data: result.items.map((n: { id: string; title: string; content: string; pinned: boolean; archived: boolean }) => ({
        id: n.id,
        title: n.title,
        snippet: n.content.slice(0, 160),
        pinned: n.pinned,
        archived: n.archived,
      })),
    };
  }
}
