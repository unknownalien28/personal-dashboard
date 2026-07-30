import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { ExtractJwt, Strategy } from "passport-jwt";
import { PrismaService } from "../../database/prisma.service";
import { AuthenticatedUser, JwtAccessPayload } from "../types/authenticated-user.interface";

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  constructor(config: ConfigService, private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get<string>("jwt.accessSecret")!,
    });
  }

  async validate(payload: JwtAccessPayload): Promise<AuthenticatedUser> {
    if (payload.type !== "access") {
      throw new UnauthorizedException("Invalid token type");
    }
    const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || !user.isActive) {
      throw new UnauthorizedException("User no longer active");
    }
    return { id: user.id, email: user.email, role: user.role };
  }
}
