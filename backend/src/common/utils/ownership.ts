import { ForbiddenException, NotFoundException } from "@nestjs/common";

/**
 * Shared "does this row exist, and does it belong to this user" check.
 * Every domain service repeated the same two lines
 * (`if (!x) throw NotFound; if (x.userId !== userId) throw Forbidden;`)
 * in every `findOne`/mutation path. Centralizing it here means the 404-vs-403
 * behavior (never leak *existence* of another user's row via a 403 - a
 * missing row and someone else's row both read the same way to the caller
 * up to this point, only the message differs) stays consistent everywhere
 * it's used instead of drifting per-module.
 *
 * Written as a TypeScript assertion function so the caller's existing
 * `const x = await prisma.x.findUnique(...)` binding narrows from `T | null`
 * to `T` after the call, with no need to reassign or use a return value:
 *
 * ```ts
 * const task = await this.prisma.task.findUnique({ where: { id } });
 * assertOwned(task, userId, "Task not found");
 * return task; // now typed as Task, not Task | null
 * ```
 */
export function assertOwned<T extends { userId: string }>(
  entity: T | null,
  userId: string,
  notFoundMessage: string,
): asserts entity is T {
  if (!entity) throw new NotFoundException(notFoundMessage);
  if (entity.userId !== userId) throw new ForbiddenException();
}
