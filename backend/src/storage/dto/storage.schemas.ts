import { z } from "zod";

export const uploadFileSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(120),
  /** Base64-encoded file contents. Kept simple for Phase 9; a multipart/form-data route can be added later without changing StorageService. */
  dataBase64: z.string().min(1),
});
export type UploadFileDto = z.infer<typeof uploadFileSchema>;
