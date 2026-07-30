import { Injectable } from "@nestjs/common";
import { SearchService } from "../../search/search.service";
import { AiTool, ToolExecutionResult } from "./tool.interface";

@Injectable()
export class SearchWorkspaceTool implements AiTool {
  readonly name = "search_workspace";
  readonly description =
    "Search across the user's entire AlienOS workspace — tasks, notes, calendar events, goals, content posts, workspace documents, transactions, bills, and budgets — in one query. Use this for broad 'find X' questions; use search_notes instead if you specifically only care about notes.";
  readonly parameters = {
    type: "object" as const,
    properties: {
      query: { type: "string" },
      limit: { type: "integer", description: "Max results, default 20, max 50." },
    },
    required: ["query"],
  };

  constructor(private readonly searchService: SearchService) {}

  async execute(userId: string, args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const query = typeof args.query === "string" ? args.query : "";
    if (!query.trim()) return { success: false, message: "Invalid input: query is required." };

    const limit = Math.min(typeof args.limit === "number" ? args.limit : 20, 50);
    const results = await this.searchService.search(userId, query, limit);

    return {
      success: true,
      message: `Found ${results.length} result(s) across the workspace matching "${query}".`,
      data: results,
    };
  }
}
