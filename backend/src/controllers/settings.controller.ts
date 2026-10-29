import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { userService } from "../services/user.service";
import { AppError } from "../utils/AppError";

export const settingsController = {
  get: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    const user = await userService.serializeUser(req.user.id);
    res.json({ success: true, data: { settings: user.settings } });
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    const user = await userService.updateSettings(req.user.id, req.body);
    res.json({ success: true, data: { settings: user.settings, user } });
  }),
};
