import { INestApplication, Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { PrismaClient } from "@prisma/client";

/**
 * Thin wrapper around PrismaClient so it participates in Nest's DI and
 * lifecycle (connect on module init, disconnect on shutdown, enable
 * graceful shutdown hooks for `app.close()`).
 */
@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super({
      log: [
        { emit: "event", level: "warn" },
        { emit: "event", level: "error" },
      ],
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
    this.logger.log("Prisma connected to database");

    // Cast to any: the generated event-emitter overload for `$on` is only
    // present when `log` includes `{ emit: 'event' }` entries, which
    // TypeScript's static client types don't always narrow correctly.
    (this as any).$on("warn", (event: unknown) => this.logger.warn(event));
    (this as any).$on("error", (event: unknown) => this.logger.error(event));
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }

  /** Call from main.ts if you need `app.close()` to also close Prisma on process signals. */
  async enableShutdownHooks(app: INestApplication): Promise<void> {
    process.on("beforeExit", async () => {
      await app.close();
    });
  }
}
