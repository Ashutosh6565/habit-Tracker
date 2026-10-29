import { Router } from "express";
import { gamificationController } from "../controllers/gamification.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate";
import { gameParamSchema } from "../validators/gamification.validator";

export const gamificationRouter = Router();

gamificationRouter.use(authenticate);
gamificationRouter.get("/overview", gamificationController.overview);
gamificationRouter.get("/leaderboard", gamificationController.leaderboard);
gamificationRouter.post(
  "/games/:gameId/claim",
  validate({ params: gameParamSchema }),
  gamificationController.claimGame
);
