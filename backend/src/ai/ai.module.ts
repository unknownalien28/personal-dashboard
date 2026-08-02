import { Module } from "@nestjs/common";
import { ConversationsModule } from "../conversations/conversations.module";
import { UsersModule } from "../users/users.module";
import { TasksModule } from "../tasks/tasks.module";
import { NotesModule } from "../notes/notes.module";
import { GoalsModule } from "../goals/goals.module";
import { CalendarModule } from "../calendar/calendar.module";
import { FinanceModule } from "../finance/finance.module";
import { NotificationsModule } from "../notifications/notifications.module";
import { SearchModule } from "../search/search.module";
import { AiController } from "./ai.controller";
import { AiService } from "./ai.service";
import { AiOrchestratorService } from "./orchestrator.service";
import { PromptManagerService } from "./prompt-manager.service";
import { GeminiProvider } from "./providers/gemini.provider";
import { ToolRegistryService } from "./tools/tool-registry.service";
import { CreateTaskTool } from "./tools/create-task.tool";
import { UpdateTaskTool } from "./tools/update-task.tool";
import { DeleteTaskTool } from "./tools/delete-task.tool";
import { CreateNoteTool } from "./tools/create-note.tool";
import { SearchNotesTool } from "./tools/search-notes.tool";
import { CreateGoalTool } from "./tools/create-goal.tool";
import { UpdateGoalTool } from "./tools/update-goal.tool";
import { DeleteGoalTool } from "./tools/delete-goal.tool";
import { CreateHabitTool } from "./tools/create-habit.tool";
import { CreateCalendarEventTool } from "./tools/create-calendar-event.tool";
import { UpdateCalendarEventTool } from "./tools/update-calendar-event.tool";
import { CreateTransactionTool } from "./tools/create-transaction.tool";
import { DashboardStatsTool } from "./tools/dashboard-stats.tool";
import { SearchWorkspaceTool } from "./tools/search-workspace.tool";
import { ListNotificationsTool } from "./tools/list-notifications.tool";

@Module({
  imports: [
    ConversationsModule,
    UsersModule,
    TasksModule,
    NotesModule,
    GoalsModule,
    CalendarModule,
    FinanceModule,
    NotificationsModule,
    SearchModule,
  ],
  controllers: [AiController],
  providers: [
    AiService,
    AiOrchestratorService,
    PromptManagerService,
    GeminiProvider,

    // Tool calling
    CreateTaskTool,
    UpdateTaskTool,
    DeleteTaskTool,
    CreateNoteTool,
    SearchNotesTool,
    CreateGoalTool,
    UpdateGoalTool,
    DeleteGoalTool,
    CreateHabitTool,
    CreateCalendarEventTool,
    UpdateCalendarEventTool,
    CreateTransactionTool,
    DashboardStatsTool,
    SearchWorkspaceTool,
    ListNotificationsTool,
    ToolRegistryService,
  ],
})
export class AiModule {}
