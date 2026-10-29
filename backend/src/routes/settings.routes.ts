import { Router } from "express";
import { settingsController } from "../controllers/settings.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate";
import { updateSettingsSchema } from "../validators/settings.validator";

export const settingsRouter = Router();

settingsRouter.use(authenticate);
settingsRouter.get("/", settingsController.get);
settingsRouter.patch("/", validate({ body: updateSettingsSchema }), settingsController.update);
