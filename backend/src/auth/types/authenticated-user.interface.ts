import { Role } from "@prisma/client";

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: Role;
}

export interface JwtAccessPayload {
  sub: string;
  email: string;
  role: Role;
  type: "access";
}

export interface JwtRefreshPayload {
  sub: string;
  sessionId: string;
  type: "refresh";
}
