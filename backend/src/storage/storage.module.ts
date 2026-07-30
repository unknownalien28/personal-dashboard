import { Module } from "@nestjs/common";
import { AttachmentsService } from "./attachments.service";
import { LocalStorageDriver } from "./local-storage.driver";
import { StorageController } from "./storage.controller";
import { StorageService } from "./storage.service";

@Module({
  controllers: [StorageController],
  providers: [LocalStorageDriver, StorageService, AttachmentsService],
  exports: [StorageService, AttachmentsService],
})
export class StorageModule {}
