import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { gamificationService } from "../services/gamification.service";
import { AppError } from "../utils/AppError";

export const gamificationController = {
  overview: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    res.json({ success: true, data: await gamificationService.overview(req.user.id) });
  }),

  leaderboard: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    res.json({ success: true, data: await gamificationService.leaderboard(req.user.id) });
  }),

  claimGame: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    const data = await gamificationService.claimGame(req.user.id, String(req.params.gameId));
    res.json({ success: true, data });
  }),
};
