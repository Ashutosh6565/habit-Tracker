import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { aiService } from "../services/ai.service";

export const aiController = {
  recommend: asyncHandler(async (req: Request, res: Response) => {
    const data = await aiService.recommend(req.body);
    res.json({ success: true, data });
  }),
};
