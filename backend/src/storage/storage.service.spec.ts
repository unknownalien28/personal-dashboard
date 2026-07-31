import { Test } from "@nestjs/testing";
import { ConfigService } from "@nestjs/config";
import { promises as fs } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";
import { StorageService } from "./storage.service";
import { LocalStorageDriver } from "./local-storage.driver";

describe("StorageService (real file I/O against a temp directory)", () => {
  let storage: StorageService;
  let tempRoot: string;

  beforeEach(async () => {
    tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "alienos-storage-test-"));
    const moduleRef = await Test.createTestingModule({
      providers: [
        StorageService,
        LocalStorageDriver,
        { provide: ConfigService, useValue: { get: (key: string) => (key === "storage.localRoot" ? tempRoot : undefined) } },
      ],
    }).compile();
    storage = moduleRef.get(StorageService);
  });

  afterEach(async () => {
    await fs.rm(tempRoot, { recursive: true, force: true });
  });

  it("saves a file and reads back the exact same bytes", async () => {
    const buffer = Buffer.from("hello from a real end-to-end storage test");
    const key = storage.buildKey("users/test-user/uploads", "hello.txt", buffer);
    const meta = await storage.save(key, buffer, "text/plain");

    expect(meta.size).toBe(buffer.byteLength);
    expect(meta.mimeType).toBe("text/plain");

    const readBack = await storage.read(meta.key);
    expect(readBack.toString("utf8")).toBe(buffer.toString("utf8"));
  });

  it("blocks path traversal attempts", async () => {
    await expect(storage.read("../../../etc/passwd")).rejects.toThrow();
  });

  it("exists()/delete() reflect the real filesystem state", async () => {
    const buffer = Buffer.from("temp content");
    const key = storage.buildKey("users/test-user/uploads", "temp.txt", buffer);
    await storage.save(key, buffer, "text/plain");

    expect(await storage.exists(key)).toBe(true);
    await storage.delete(key);
    expect(await storage.exists(key)).toBe(false);
  });

  it("deleting an already-deleted file is a no-op, not an error", async () => {
    const buffer = Buffer.from("x");
    const key = storage.buildKey("users/test-user/uploads", "gone.txt", buffer);
    await storage.save(key, buffer, "text/plain");
    await storage.delete(key);
    await expect(storage.delete(key)).resolves.not.toThrow();
  });

  it("buildKey produces different keys for different content, same key for identical content (content-addressed)", () => {
    const a = storage.buildKey("ns", "a.txt", Buffer.from("content A"));
    const b = storage.buildKey("ns", "b.txt", Buffer.from("content B"));
    const aAgain = storage.buildKey("ns", "a-renamed.txt", Buffer.from("content A"));

    expect(a).not.toBe(b);
    // Same bytes -> same hash-derived filename, even under a different original name/extension-bearing name,
    // though the extension itself does come from the (possibly different) provided filename.
    expect(a.split("/").pop()?.split(".")[0]).toBe(aAgain.split("/").pop()?.split(".")[0]);
  });
});
