import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { notificationService } from "../services/notification.service";
import { reminderService } from "../services/reminder.service";
import { AppError } from "../utils/AppError";

export const notificationController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    res.json({ success: true, data: { notifications: await notificationService.list(req.user.id) } });
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const userId = req.body.userId || req.user?.id;
    if (!userId) throw new AppError("User id is required", 400, "USER_REQUIRED");
    const notification = await notificationService.create({ ...req.body, userId });
    res.status(201).json({ success: true, data: { notification } });
  }),

  markRead: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    const notification = await notificationService.markRead(req.user.id, String(req.params.id));
    res.json({ success: true, data: { notification } });
  }),

  runScheduler: asyncHandler(async (_req: Request, res: Response) => {
    res.json({ success: true, data: await reminderService.runPass() });
  }),
};
