import type { Request } from "express";

export const getPagination = (req: Request) => {
  const page = Math.max(Number(req.query.page || 1), 1);
  const limit = Math.min(Math.max(Number(req.query.limit || 20), 1), 100);
  const skip = (page - 1) * limit;
  const sortBy = String(req.query.sortBy || "createdAt");
  const sortOrder = String(req.query.sortOrder || "desc") === "asc" ? 1 : -1;
  return { page, limit, skip, sort: { [sortBy]: sortOrder } as Record<string, 1 | -1> };
};

export const paginated = <T>(data: T[], total: number, page: number, limit: number) => ({
  data,
  meta: {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  },
});
