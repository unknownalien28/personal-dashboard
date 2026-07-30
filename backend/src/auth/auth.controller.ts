import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Req, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { Throttle } from "@nestjs/throttler";
import { Request } from "express";
import { Public } from "../common/decorators/public.decorator";
import { CurrentUser } from "../common/decorators/current-user.decorator";
import { ZodValidationPipe } from "../common/pipes/zod-validation.pipe";
import { AuthService } from "./auth.service";
import {
  ChangePasswordDto,
  ForgotPasswordDto,
  LoginDto,
  RefreshDto,
  RegisterDto,
  ResetPasswordDto,
  VerifyEmailDto,
  changePasswordSchema,
  forgotPasswordSchema,
  loginSchema,
  refreshSchema,
  registerSchema,
  resetPasswordSchema,
  verifyEmailSchema,
} from "./dto/auth.schemas";
import { JwtRefreshGuard } from "./guards/jwt-refresh.guard";
import { AuthenticatedUser, JwtRefreshPayload } from "./types/authenticated-user.interface";

@ApiTags("auth")
@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @Post("register")
  @ApiOperation({ summary: "Create a new AlienOS account" })
  register(@Body(new ZodValidationPipe(registerSchema)) dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, { userAgent: req.headers["user-agent"], ipAddress: req.ip });
  }

  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @Post("login")
  @ApiOperation({ summary: "Exchange credentials for an access/refresh token pair" })
  login(@Body(new ZodValidationPipe(loginSchema)) dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, { userAgent: req.headers["user-agent"], ipAddress: req.ip });
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.OK)
  @Post("refresh")
  @ApiOperation({ summary: "Rotate an access/refresh token pair" })
  refresh(@Body(new ZodValidationPipe(refreshSchema)) _dto: RefreshDto, @Req() req: Request) {
    const payload = req.user as JwtRefreshPayload & { refreshToken: string };
    return this.authService.refresh(payload, payload.refreshToken);
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("logout")
  @ApiOperation({ summary: "Revoke the current session's refresh token" })
  async logout(@Req() req: Request): Promise<void> {
    const payload = req.user as JwtRefreshPayload;
    await this.authService.logout(payload.sessionId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("logout-all")
  @ApiOperation({ summary: "Revoke every active session for the current user" })
  async logoutAll(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.authService.logoutAll(user.id);
  }

  @ApiBearerAuth("access-token")
  @Get("sessions")
  @ApiOperation({ summary: "List active sessions/devices for the current user" })
  listSessions(@CurrentUser() user: AuthenticatedUser) {
    return this.authService.listSessions(user.id);
  }

  @ApiBearerAuth("access-token")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete("sessions/:id")
  @ApiOperation({ summary: "Revoke a specific session/device" })
  async revokeSession(@CurrentUser() user: AuthenticatedUser, @Param("id") id: string): Promise<void> {
    await this.authService.revokeSession(user.id, id);
  }

  @ApiBearerAuth("access-token")
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("change-password")
  @ApiOperation({ summary: "Change the current user's password (revokes other sessions)" })
  async changePassword(
    @CurrentUser() user: AuthenticatedUser,
    @Body(new ZodValidationPipe(changePasswordSchema)) dto: ChangePasswordDto,
  ): Promise<void> {
    await this.authService.changePassword(user.id, dto);
  }

  @Public()
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("forgot-password")
  @ApiOperation({ summary: "Request a password-reset email (always returns 204, even for unknown emails)" })
  async forgotPassword(@Body(new ZodValidationPipe(forgotPasswordSchema)) dto: ForgotPasswordDto): Promise<void> {
    await this.authService.forgotPassword(dto);
  }

  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("reset-password")
  @ApiOperation({ summary: "Reset a password using the token emailed by /forgot-password" })
  async resetPassword(@Body(new ZodValidationPipe(resetPasswordSchema)) dto: ResetPasswordDto): Promise<void> {
    await this.authService.resetPassword(dto);
  }

  @Public()
  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("verify-email")
  @ApiOperation({ summary: "Verify an email address using the token emailed on registration" })
  async verifyEmail(@Body(new ZodValidationPipe(verifyEmailSchema)) dto: VerifyEmailDto): Promise<void> {
    await this.authService.verifyEmail(dto.email, dto.token);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Post("send-verification-email")
  @ApiOperation({ summary: "Re-send the email verification link for the current user" })
  async sendVerificationEmail(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.authService.sendVerificationEmail(user.id);
  }
}
