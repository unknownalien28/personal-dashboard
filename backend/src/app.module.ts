import { Module } from "@nestjs/common";
import { APP_GUARD } from "@nestjs/core";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerGuard, ThrottlerModule } from "@nestjs/throttler";
import configuration from "./config/configuration";
import { PrismaModule } from "./database/prisma.module";
import { AppController } from "./app.controller";
import { JwtAuthGuard } from "./auth/guards/jwt-auth.guard";
import { RolesGuard } from "./common/guards/roles.guard";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { TasksModule } from "./tasks/tasks.module";
import { NotesModule } from "./notes/notes.module";
import { CalendarModule } from "./calendar/calendar.module";
import { GoalsModule } from "./goals/goals.module";
import { FinanceModule } from "./finance/finance.module";
import { ContentModule } from "./content/content.module";
import { WorkspaceModule } from "./workspace/workspace.module";
import { ConversationsModule } from "./conversations/conversations.module";
import { NotificationsModule } from "./notifications/notifications.module";
import { SearchModule } from "./search/search.module";
import { StorageModule } from "./storage/storage.module";
import { AiModule } from "./ai/ai.module";

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true, load: [configuration] }),
    ThrottlerModule.forRoot([
      {
        ttl: parseInt(process.env.THROTTLE_TTL ?? "60", 10) * 1000,
        limit: parseInt(process.env.THROTTLE_LIMIT ?? "100", 10),
      },
    ]),
    PrismaModule,

    // Domain modules
    AuthModule,
    UsersModule,
    TasksModule,
    NotesModule,
    CalendarModule,
    GoalsModule,
    FinanceModule,
    ContentModule,
    WorkspaceModule,
    ConversationsModule,
    NotificationsModule,
    SearchModule,
    StorageModule,
    AiModule,
  ],
  controllers: [AppController],
  providers: [
    // Order matters: Nest evaluates APP_GUARDs in registration order.
    // Throttling first, then identity (JWT), then authorization (roles).
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}
