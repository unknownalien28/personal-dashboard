import { Injectable } from "@nestjs/common";
import { LocalStorageDriver } from "./local-storage.driver";
import { StorageDriver, StoredFileMeta } from "./storage.interface";

/**
 * Public-facing storage API used by feature modules (e.g. profile avatars,
 * content attachments). Currently backed by LocalStorageDriver; wiring an
 * S3Driver later is a one-line change in StorageModule's provider factory.
 */
@Injectable()
export class StorageService implements StorageDriver {
  constructor(private readonly driver: LocalStorageDriver) {}

  save(key: string, buffer: Buffer, mimeType: string): Promise<StoredFileMeta> {
    return this.driver.save(key, buffer, mimeType);
  }

  read(key: string): Promise<Buffer> {
    return this.driver.read(key);
  }

  delete(key: string): Promise<void> {
    return this.driver.delete(key);
  }

  exists(key: string): Promise<boolean> {
    return this.driver.exists(key);
  }

  getUrl(key: string): string {
    return this.driver.getUrl(key);
  }

  buildKey(namespace: string, originalName: string, buffer: Buffer): string {
    return this.driver.buildKey(namespace, originalName, buffer);
  }
}
