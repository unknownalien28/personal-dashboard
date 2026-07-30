import { Injectable } from "@nestjs/common";
import { ConversationsService } from "../conversations/conversations.service";
import { AiMessage } from "./providers/ai-provider.interface";
import { AiProviderRegistry } from "./providers/registry";
import { PromptManagerService } from "./prompt-manager.service";
import { SendMessageDto } from "./dto/ai.schemas";

@Injectable()
export class AiService {
  constructor(
    private readonly providers: AiProviderRegistry,
    private readonly promptManager: PromptManagerService,
    private readonly conversationsService: ConversationsService,
  ) {}

  listProviders(): string[] {
    return this.providers.listAvailable();
  }

  /**
   * Persists the user's message, asks the provider for a reply, persists
   * that too, and returns both. Streaming providers are supported by
   * AiService.stream (below) for future use by an SSE/WebSocket endpoint.
   */
  async sendMessage(userId: string, userName: string | undefined, dto: SendMessageDto) {
    const conversationId = dto.conversationId ?? (await this.conversationsService.create(userId, { title: dto.content.slice(0, 60) })).id;

    await this.conversationsService.addMessage(userId, conversationId, {
      role: "user",
      content: dto.content,
      status: "complete",
    });

    const conversation = await this.conversationsService.findOne(userId, conversationId);
    const history: AiMessage[] = conversation.messages.map((m) => ({ role: m.role, content: m.content }));
    const messages = this.promptManager.buildMessages({ userName, moduleHints: dto.moduleHints }, history);

    const provider = this.providers.resolve(dto.provider);
    const reply = await provider.complete({ messages });

    const assistantMessage = await this.conversationsService.addMessage(userId, conversationId, {
      role: "assistant",
      content: reply,
      status: "complete",
    });

    return { conversationId, message: assistantMessage };
  }

  async *stream(userId: string, userName: string | undefined, dto: SendMessageDto) {
    const conversationId = dto.conversationId ?? (await this.conversationsService.create(userId, { title: dto.content.slice(0, 60) })).id;

    await this.conversationsService.addMessage(userId, conversationId, {
      role: "user",
      content: dto.content,
      status: "complete",
    });

    const conversation = await this.conversationsService.findOne(userId, conversationId);
    const history: AiMessage[] = conversation.messages.map((m) => ({ role: m.role, content: m.content }));
    const messages = this.promptManager.buildMessages({ userName, moduleHints: dto.moduleHints }, history);

    const provider = this.providers.resolve(dto.provider);
    let full = "";
    for await (const chunk of provider.stream({ messages })) {
      full += chunk.delta;
      yield chunk;
    }

    await this.conversationsService.addMessage(userId, conversationId, {
      role: "assistant",
      content: full,
      status: "complete",
    });
  }
}
