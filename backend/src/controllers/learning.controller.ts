import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { learningService, type LearningPlanInput } from "../services/learning.service";
import { AppError } from "../utils/AppError";

export const learningController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    res.json({ success: true, data: { plans: await learningService.list(req.user.id) } });
  }),

  upsert: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    const plan = await learningService.upsert(req.user.id, req.body as LearningPlanInput);
    res.json({ success: true, data: { plan } });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    await learningService.remove(req.user.id, String(req.params.planId));
    res.status(204).send();
  }),
};
