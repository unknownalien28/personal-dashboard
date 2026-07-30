import { Global, Module } from "@nestjs/common";
import { PrismaService } from "./prisma.service";

/** Marked @Global so every feature module can inject PrismaService without re-importing it. */
@Global()
@Module({
  providers: [PrismaService],
  exports: [PrismaService],
})
export class PrismaModule {}
