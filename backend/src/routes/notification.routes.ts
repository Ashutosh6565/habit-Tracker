import { Router } from "express";
import { notificationController } from "../controllers/notification.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate";
import { createNotificationSchema, notificationIdParamSchema } from "../validators/notification.validator";

export const notificationRouter = Router();

notificationRouter.use(authenticate);
notificationRouter.get("/", notificationController.list);
notificationRouter.post(
  "/",
  authorize("admin"),
  validate({ body: createNotificationSchema }),
  notificationController.create
);
notificationRouter.patch(
  "/:id/read",
  validate({ params: notificationIdParamSchema }),
  notificationController.markRead
);
notificationRouter.post("/scheduler/run", authorize("admin"), notificationController.runScheduler);
