export interface StoredFileMeta {
  key: string;
  size: number;
  mimeType: string;
  url: string;
}

/**
 * Common contract every storage backend implements. Phase 9 ships a local
 * filesystem driver only; an S3 driver can be dropped in later behind the
 * same interface without touching callers (see STORAGE_DRIVER env var).
 */
export interface StorageDriver {
  save(key: string, buffer: Buffer, mimeType: string): Promise<StoredFileMeta>;
  read(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  getUrl(key: string): string;
}

export const STORAGE_DRIVER = "STORAGE_DRIVER";
