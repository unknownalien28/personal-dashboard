import { z } from "zod";

/** Shared `?page=&limit=` query schema for list endpoints. */
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export type PaginationQuery = z.infer<typeof paginationQuerySchema>;

export interface PaginatedResult<T> {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export function toSkipTake(query: PaginationQuery): { skip: number; take: number } {
  return { skip: (query.page - 1) * query.limit, take: query.limit };
}

export function paginate<T>(items: T[], total: number, query: PaginationQuery): PaginatedResult<T> {
  return {
    items,
    meta: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / query.limit)),
    },
  };
}
