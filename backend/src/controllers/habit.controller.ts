import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { habitService } from "../services/habit.service";
import { youtubeService } from "../services/youtube.service";
import { getPagination, paginated } from "../utils/pagination";
import { AppError } from "../utils/AppError";

export const habitController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    const { page, limit, skip, sort } = getPagination(req);
    const result = await habitService.list(req.user.id, {
      search: req.query.search as string | undefined,
      category: req.query.category as string | undefined,
      difficulty: req.query.difficulty as "easy" | "medium" | "hard" | undefined,
      completed: req.query.completed as "true" | "false" | undefined,
      skip,
      limit,
      sort,
    });
    res.json({ success: true, ...paginated(result.data, result.total, page, limit) });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    res.status(201).json({ success: true, data: { habit: await habitService.create(req.user.id, req.body) } });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    res.json({ success: true, data: { habit: await habitService.update(req.user.id, String(req.params.id), req.body) } });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    await habitService.remove(req.user.id, String(req.params.id));
    res.status(204).send();
  }),

  setProgress: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    const habit = await habitService.setProgress(req.user.id, String(req.params.id), req.body);
    res.json({ success: true, data: { habit } });
  }),

  summary: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    res.json({ success: true, data: await habitService.summary(req.user.id) });
  }),

  history: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    const days = Number(req.query.days) || 30;
    res.json({ success: true, data: await habitService.history(req.user.id, days) });
  }),

  youtubeMetadata: asyncHandler(async (req: Request, res: Response) => {
    res.json({ success: true, data: await youtubeService.getMetadata(String(req.query.url)) });
  }),
};
