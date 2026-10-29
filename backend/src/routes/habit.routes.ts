import { Router } from "express";
import { habitController } from "../controllers/habit.controller";
import { authenticate, requirePermission } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate";
import {
  createHabitSchema,
  habitIdParamSchema,
  listHabitQuerySchema,
  toggleProgressSchema,
  updateHabitSchema,
} from "../validators/habit.validator";
import { youtubeMetadataQuerySchema } from "../validators/youtube.validator";

export const habitRouter = Router();

habitRouter.use(authenticate);
habitRouter.use(requirePermission("tracker.view"));
habitRouter.get("/summary", habitController.summary);
habitRouter.get("/youtube-metadata", validate({ query: youtubeMetadataQuerySchema }), habitController.youtubeMetadata);
habitRouter.get("/", validate({ query: listHabitQuerySchema }), habitController.list);
habitRouter.post("/", validate({ body: createHabitSchema }), habitController.create);
habitRouter.patch("/:id", validate({ params: habitIdParamSchema, body: updateHabitSchema }), habitController.update);
habitRouter.delete("/:id", validate({ params: habitIdParamSchema }), habitController.remove);
habitRouter.post(
  "/:id/progress",
  validate({ params: habitIdParamSchema, body: toggleProgressSchema }),
  habitController.setProgress
);
