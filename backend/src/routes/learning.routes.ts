import { Router } from "express";
import { learningController } from "../controllers/learning.controller";
import { authenticate, requirePermission } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate";
import { learningPlanIdParamSchema, upsertLearningPlanSchema } from "../validators/learning.validator";

export const learningRouter = Router();

learningRouter.use(authenticate);
learningRouter.use(requirePermission("templates.view"));
learningRouter.get("/", learningController.list);
learningRouter.put("/", validate({ body: upsertLearningPlanSchema }), learningController.upsert);
learningRouter.delete("/:planId", validate({ params: learningPlanIdParamSchema }), learningController.remove);
