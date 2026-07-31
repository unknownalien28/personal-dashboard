import { Injectable } from "@nestjs/common";
import { AiOrchestratorService, AiStreamEvent } from "./orchestrator.service";
import { SendMessageDto } from "./dto/ai.schemas";

/**
 * Thin facade over AiOrchestratorService. Kept as its own injectable so
 * the controller's dependency surface doesn't change regardless of how
 * the orchestration internals evolve — all the actual provider-selection/
 * context-injection/tool-calling/streaming logic lives in the
 * orchestrator (see orchestrator.service.ts).
 */
@Injectable()
export class AiService {
  constructor(private readonly orchestrator: AiOrchestratorService) {}

  listProviders() {
    return this.orchestrator.listProviders();
  }

  listTools() {
    return this.orchestrator.listTools();
  }

  sendMessage(userId: string, userName: string | undefined, dto: SendMessageDto, signal?: AbortSignal) {
    return this.orchestrator.sendMessage(userId, userName, dto, signal);
  }

  stream(userId: string, userName: string | undefined, dto: SendMessageDto, signal?: AbortSignal): AsyncGenerator<AiStreamEvent> {
    return this.orchestrator.stream(userId, userName, dto, signal);
  }
}
