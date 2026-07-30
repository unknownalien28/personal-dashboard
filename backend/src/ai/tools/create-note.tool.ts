import { Injectable } from "@nestjs/common";
import { NotesService } from "../../notes/notes.service";
import { createNoteSchema } from "../../notes/dto/note.schemas";
import { AiTool, ToolExecutionResult } from "./tool.interface";

@Injectable()
export class CreateNoteTool implements AiTool {
  readonly name = "create_note";
  readonly description = "Create a new note for the user. Use for saving free-form text, ideas, or information the user wants to keep.";
  readonly parameters = {
    type: "object" as const,
    properties: {
      title: { type: "string", description: "Note title. Optional but recommended." },
      content: { type: "string", description: "The note body." },
      tags: { type: "array", items: { type: "string" }, description: "Optional tags." },
      pinned: { type: "boolean", description: "Whether to pin the note. Defaults to false." },
      color: { type: "string", enum: ["default", "yellow", "blue", "green", "pink", "purple"] },
    },
    required: ["content"],
  };

  constructor(private readonly notesService: NotesService) {}

  async execute(userId: string, args: Record<string, unknown>): Promise<ToolExecutionResult> {
    const parsed = createNoteSchema.safeParse(args);
    if (!parsed.success) {
      return { success: false, message: `Invalid note input: ${parsed.error.issues.map((i) => i.message).join("; ")}` };
    }

    const note = await this.notesService.create(userId, parsed.data);
    return { success: true, message: `Created note "${note.title || "(untitled)"}" (id: ${note.id}).`, data: note };
  }
}
