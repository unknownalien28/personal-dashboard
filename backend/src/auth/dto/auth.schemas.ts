import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  name: z.string().min(1).max(120).optional(),
});
export type RegisterDto = z.infer<typeof registerSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
  rememberMe: z.boolean().default(false),
});
export type LoginDto = z.infer<typeof loginSchema>;

export const refreshSchema = z.object({
  refreshToken: z.string().min(1),
});
export type RefreshDto = z.infer<typeof refreshSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
});
export type ChangePasswordDto = z.infer<typeof changePasswordSchema>;

export const forgotPasswordSchema = z.object({
  email: z.string().email(),
});
export type ForgotPasswordDto = z.infer<typeof forgotPasswordSchema>;

export const resetPasswordSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
  newPassword: z.string().min(8),
});
export type ResetPasswordDto = z.infer<typeof resetPasswordSchema>;

export const verifyEmailSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
});
export type VerifyEmailDto = z.infer<typeof verifyEmailSchema>;
