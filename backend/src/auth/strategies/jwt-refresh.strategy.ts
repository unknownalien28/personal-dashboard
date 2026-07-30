import { Injectable, UnauthorizedException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import { JwtRefreshPayload } from "../types/authenticated-user.interface";

@Injectable()
export class JwtRefreshStrategy extends PassportStrategy(Strategy, "jwt-refresh") {
  constructor(config: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([(req: Request) => req?.body?.refreshToken ?? null]),
      ignoreExpiration: false,
      secretOrKey: config.get<string>("jwt.refreshSecret")!,
      passReqToCallback: true,
    });
  }

  validate(req: Request, payload: JwtRefreshPayload): JwtRefreshPayload & { refreshToken: string } {
    if (payload.type !== "refresh") {
      throw new UnauthorizedException("Invalid token type");
    }
    const refreshToken = req.body?.refreshToken as string;
    return { ...payload, refreshToken };
  }
}
