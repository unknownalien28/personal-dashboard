import { Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import * as path from "node:path";
import { StorageDriver, StoredFileMeta } from "./storage.interface";

/**
 * Stores files on local disk under `STORAGE_LOCAL_ROOT`. Keys are namespaced
 * paths, e.g. `users/<id>/avatars/<hash>.png`. Swap for an S3Driver later —
 * everything upstream only depends on the StorageDriver interface.
 */
@Injectable()
export class LocalStorageDriver implements StorageDriver {
  private readonly root: string;

  constructor(config: ConfigService) {
    this.root = path.resolve(config.get<string>("storage.localRoot") ?? "./storage");
  }

  async save(key: string, buffer: Buffer, _mimeType: string): Promise<StoredFileMeta> {
    const filePath = this.resolveSafe(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, buffer);
    return {
      key,
      size: buffer.byteLength,
      mimeType: _mimeType,
      url: this.getUrl(key),
    };
  }

  async read(key: string): Promise<Buffer> {
    try {
      return await fs.readFile(this.resolveSafe(key));
    } catch {
      throw new NotFoundException(`File not found: ${key}`);
    }
  }

  async delete(key: string): Promise<void> {
    try {
      await fs.unlink(this.resolveSafe(key));
    } catch {
      // Deleting something that's already gone is a no-op, not an error.
    }
  }

  async exists(key: string): Promise<boolean> {
    try {
      await fs.access(this.resolveSafe(key));
      return true;
    } catch {
      return false;
    }
  }

  getUrl(key: string): string {
    // Served later via a dedicated static/download route; for now this is a
    // stable, deterministic reference the frontend can store.
    return `/api/storage/files/${encodeURIComponent(key)}`;
  }

  /** Builds a fingerprinted key for a fresh upload (caller supplies the folder/namespace). */
  buildKey(namespace: string, originalName: string, buffer: Buffer): string {
    const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 16);
    const ext = path.extname(originalName);
    return path.posix.join(namespace, `${hash}${ext}`);
  }

  /** Resolves a key to an absolute path while refusing to escape the storage root (path traversal guard). */
  private resolveSafe(key: string): string {
    const resolved = path.resolve(this.root, key);
    if (!resolved.startsWith(this.root)) {
      throw new NotFoundException("Invalid storage key");
    }
    return resolved;
  }
}
