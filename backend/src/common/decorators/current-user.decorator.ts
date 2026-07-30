import { ExecutionContext, createParamDecorator } from "@nestjs/common";
import { Request } from "express";
import { AuthenticatedUser } from "../../auth/types/authenticated-user.interface";

/** Extracts the authenticated user attached by JwtAuthGuard/JwtStrategy. */
export const CurrentUser = createParamDecorator((data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
  const request = ctx.switchToHttp().getRequest<Request & { user: AuthenticatedUser }>();
  const user = request.user;
  return data ? user?.[data] : user;
});
