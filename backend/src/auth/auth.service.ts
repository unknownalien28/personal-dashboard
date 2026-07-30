import { ConflictException, Injectable, NotFoundException, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { JwtService } from "@nestjs/jwt";
import { Role } from "@prisma/client";
import * as bcrypt from "bcrypt";
import { randomBytes } from "node:crypto";
import { PrismaService } from "../database/prisma.service";
import { EmailService } from "../email/email.service";
import { ChangePasswordDto, ForgotPasswordDto, LoginDto, RegisterDto, ResetPasswordDto } from "./dto/auth.schemas";
import { JwtAccessPayload, JwtRefreshPayload } from "./types/authenticated-user.interface";

export interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

export interface SafeUser {
  id: string;
  email: string;
  role: Role;
  emailVerified: boolean;
  createdAt: Date;
}

export interface RequestContext {
  userAgent?: string;
  ipAddress?: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
    private readonly config: ConfigService,
    private readonly emailService: EmailService,
  ) {}

  async register(dto: RegisterDto, context: RequestContext): Promise<{ user: SafeUser; tokens: TokenPair }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException("An account with this email already exists");
    }

    const saltRounds = this.config.get<number>("security.bcryptSaltRounds") ?? 12;
    const passwordHash = await bcrypt.hash(dto.password, saltRounds);

    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        profile: { create: { name: dto.name ?? "", email: dto.email } },
        appearanceSettings: { create: {} },
        visualEffectsSettings: { create: {} },
        notificationSettings: { create: {} },
        preferenceSettings: { create: {} },
        aiSettings: { create: {} },
      },
    });

    const tokens = await this.issueTokenPair(user.id, user.email, user.role, false, context);

    // Fire-and-forget: a slow/misconfigured mail transport should never block registration.
    void this.sendVerificationEmail(user.id).catch(() => undefined);

    return { user: this.toSafeUser(user), tokens };
  }

  async login(dto: LoginDto, context: RequestContext): Promise<{ user: SafeUser; tokens: TokenPair }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const passwordMatches = await bcrypt.compare(dto.password, user.passwordHash);
    if (!passwordMatches) {
      throw new UnauthorizedException("Invalid email or password");
    }

    const tokens = await this.issueTokenPair(user.id, user.email, user.role, dto.rememberMe, context);
    return { user: this.toSafeUser(user), tokens };
  }

  /** Rotates the refresh token: the presented one is revoked and a new pair is issued. */
  async refresh(payload: JwtRefreshPayload, presentedToken: string): Promise<TokenPair> {
    const session = await this.prisma.session.findUnique({ where: { id: payload.sessionId } });
    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException("Session expired or revoked");
    }

    const tokenMatches = await bcrypt.compare(presentedToken, session.refreshTokenHash);
    if (!tokenMatches) {
      // Possible token reuse/theft — revoke the session defensively.
      await this.prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
      throw new UnauthorizedException("Refresh token invalid");
    }

    const user = await this.prisma.user.findUnique({ where: { id: session.userId } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("User no longer active");
    }

    // Preserve the session's original remember-me duration on rotation by
    // comparing its lifetime against the two configured windows.
    const rememberMe = this.wasRememberMeSession(session.createdAt, session.expiresAt);
    await this.prisma.session.update({ where: { id: session.id }, data: { revokedAt: new Date() } });
    return this.issueTokenPair(user.id, user.email, user.role, rememberMe, {});
  }

  async logout(sessionId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { id: sessionId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.prisma.session.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  // ------------------------------------------------------------ Sessions
  async listSessions(userId: string, currentSessionId?: string) {
    const sessions = await this.prisma.session.findMany({
      where: { userId, revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { createdAt: "desc" },
      select: { id: true, userAgent: true, ipAddress: true, createdAt: true, expiresAt: true },
    });
    return sessions.map((s) => ({ ...s, current: s.id === currentSessionId }));
  }

  async revokeSession(userId: string, sessionId: string): Promise<void> {
    const session = await this.prisma.session.findUnique({ where: { id: sessionId } });
    if (!session || session.userId !== userId) throw new NotFoundException("Session not found");
    await this.prisma.session.update({ where: { id: sessionId }, data: { revokedAt: new Date() } });
  }

  // ------------------------------------------------------------ Password
  async changePassword(userId: string, dto: ChangePasswordDto): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    const matches = await bcrypt.compare(dto.currentPassword, user.passwordHash);
    if (!matches) throw new UnauthorizedException("Current password is incorrect");

    const saltRounds = this.config.get<number>("security.bcryptSaltRounds") ?? 12;
    const passwordHash = await bcrypt.hash(dto.newPassword, saltRounds);
    await this.prisma.user.update({ where: { id: userId }, data: { passwordHash } });

    // Changing the password invalidates every other session as a safety measure.
    await this.logoutAll(userId);
  }

  /** Always resolves without revealing whether the email exists (prevents account enumeration). */
  async forgotPassword(dto: ForgotPasswordDto): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) return;

    const token = randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = addDuration(new Date(), this.config.get<string>("security.passwordResetExpiresIn") ?? "1h");

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordResetTokenHash: tokenHash, passwordResetExpiresAt: expiresAt },
    });

    const resetUrl = `${this.config.get<string>("frontendUrl")}/reset-password?token=${token}&email=${encodeURIComponent(user.email)}`;
    await this.emailService.sendPasswordResetEmail(user.email, resetUrl);
  }

  async resetPassword(dto: ResetPasswordDto & { email: string }): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user || !user.passwordResetTokenHash || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
      throw new UnauthorizedException("Reset link is invalid or has expired");
    }

    const matches = await bcrypt.compare(dto.token, user.passwordResetTokenHash);
    if (!matches) throw new UnauthorizedException("Reset link is invalid or has expired");

    const saltRounds = this.config.get<number>("security.bcryptSaltRounds") ?? 12;
    const passwordHash = await bcrypt.hash(dto.newPassword, saltRounds);

    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, passwordResetTokenHash: null, passwordResetExpiresAt: null },
    });
    await this.logoutAll(user.id);
  }

  // ------------------------------------------------------------ Email verification
  async sendVerificationEmail(userId: string): Promise<void> {
    const user = await this.prisma.user.findUniqueOrThrow({ where: { id: userId } });
    if (user.emailVerified) return;

    const token = randomBytes(32).toString("hex");
    const tokenHash = await bcrypt.hash(token, 10);
    const expiresAt = addDuration(new Date(), this.config.get<string>("security.emailVerificationExpiresIn") ?? "24h");

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerificationTokenHash: tokenHash, emailVerificationExpiresAt: expiresAt },
    });

    const verifyUrl = `${this.config.get<string>("frontendUrl")}/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`;
    await this.emailService.sendVerificationEmail(user.email, verifyUrl);
  }

  async verifyEmail(email: string, token: string): Promise<void> {
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (
      !user ||
      !user.emailVerificationTokenHash ||
      !user.emailVerificationExpiresAt ||
      user.emailVerificationExpiresAt < new Date()
    ) {
      throw new UnauthorizedException("Verification link is invalid or has expired");
    }

    const matches = await bcrypt.compare(token, user.emailVerificationTokenHash);
    if (!matches) throw new UnauthorizedException("Verification link is invalid or has expired");

    await this.prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: true, emailVerificationTokenHash: null, emailVerificationExpiresAt: null },
    });
  }

  // ------------------------------------------------------------ Internal
  private async issueTokenPair(
    userId: string,
    email: string,
    role: Role,
    rememberMe: boolean,
    context: RequestContext,
  ): Promise<TokenPair> {
    const accessPayload: JwtAccessPayload = { sub: userId, email, role, type: "access" };
    const accessToken = await this.jwt.signAsync(accessPayload, {
      secret: this.config.get<string>("jwt.accessSecret"),
      expiresIn: this.config.get<string>("jwt.accessExpiresIn"),
    });

    const refreshExpiresIn = rememberMe
      ? this.config.get<string>("jwt.refreshExpiresInRememberMe") ?? "30d"
      : this.config.get<string>("jwt.refreshExpiresIn") ?? "7d";
    const expiresAt = addDuration(new Date(), refreshExpiresIn);

    // Create the session first (without a hash) to get an id, then sign
    // the refresh token with that session id, then persist its hash.
    const session = await this.prisma.session.create({
      data: {
        userId,
        refreshTokenHash: "",
        userAgent: context.userAgent,
        ipAddress: context.ipAddress,
        expiresAt,
      },
    });

    const refreshPayload: JwtRefreshPayload = { sub: userId, sessionId: session.id, type: "refresh" };
    const refreshToken = await this.jwt.signAsync(refreshPayload, {
      secret: this.config.get<string>("jwt.refreshSecret"),
      expiresIn: refreshExpiresIn,
    });

    const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
    await this.prisma.session.update({ where: { id: session.id }, data: { refreshTokenHash } });

    return { accessToken, refreshToken };
  }

  /** Heuristic: a session is treated as "remember me" if its lifetime is closer to the long window than the short one. */
  private wasRememberMeSession(createdAt: Date, expiresAt: Date): boolean {
    const shortMs = durationToMs(this.config.get<string>("jwt.refreshExpiresIn") ?? "7d");
    const longMs = durationToMs(this.config.get<string>("jwt.refreshExpiresInRememberMe") ?? "30d");
    const lifetimeMs = expiresAt.getTime() - createdAt.getTime();
    return Math.abs(lifetimeMs - longMs) < Math.abs(lifetimeMs - shortMs);
  }

  private toSafeUser(user: { id: string; email: string; role: Role; emailVerified: boolean; createdAt: Date }): SafeUser {
    return { id: user.id, email: user.email, role: user.role, emailVerified: user.emailVerified, createdAt: user.createdAt };
  }
}

/** Parses simple durations like "15m", "7d", "1h" relative to `from`. Falls back to 7 days. */
function addDuration(from: Date, duration: string): Date {
  return new Date(from.getTime() + durationToMs(duration));
}

function durationToMs(duration: string): number {
  const match = /^(\d+)([smhd])$/.exec(duration.trim());
  if (!match) return 7 * 24 * 60 * 60 * 1000;
  const value = parseInt(match[1], 10);
  const unit = match[2];
  const unitMs: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return value * unitMs[unit];
}
