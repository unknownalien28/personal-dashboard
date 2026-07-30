import { z } from "zod";

export const uploadAvatarSchema = z.object({
  filename: z.string().min(1).max(255),
  mimeType: z.string().refine((v) => v.startsWith("image/"), "Avatar must be an image"),
  dataBase64: z.string().min(1),
});
export type UploadAvatarDto = z.infer<typeof uploadAvatarSchema>;
