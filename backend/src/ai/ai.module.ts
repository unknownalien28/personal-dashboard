import { Module } from "@nestjs/common";
import { ConversationsModule } from "../conversations/conversations.module";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { PromptManagerService } from "./prompt-manager.service";
import { DemoAiProvider } from "./providers/demo.provider";
import { AnthropicProvider, GeminiProvider, OllamaProvider, OpenAiProvider } from "./providers/external-providers.stub";
import { AiProviderRegistry } from "./providers/registry";

@Module({
  imports: [ConversationsModule],
  controllers: [AiController],
  providers: [
    AiService,
    PromptManagerService,
    DemoAiProvider,
    OpenAiProvider,
    AnthropicProvider,
    GeminiProvider,
    OllamaProvider,
    AiProviderRegistry,
  ],
})
export class AiModule {}
