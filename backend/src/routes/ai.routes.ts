import { Router } from "express";
import { aiController } from "../controllers/ai.controller";
import { optionalAuthenticate } from "../middlewares/auth.middleware";
import { aiLimiter } from "../middlewares/rateLimit.middleware";
import { validate } from "../middlewares/validate";
import { aiRecommendSchema } from "../validators/ai.validator";

export const aiRouter = Router();

aiRouter.post(
  "/recommend",
  optionalAuthenticate,
  aiLimiter,
  validate({ body: aiRecommendSchema }),
  aiController.recommend
);
