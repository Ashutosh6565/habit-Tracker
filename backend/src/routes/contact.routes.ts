import { Router } from "express";
import { contactController } from "../controllers/contact.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { contactLimiter } from "../middlewares/rateLimit.middleware";
import { validate } from "../middlewares/validate";
import {
  contactIdParamSchema,
  contactMessageSchema,
  contactStatusSchema,
} from "../validators/contact.validator";

export const contactRouter = Router();

contactRouter.post("/", contactLimiter, validate({ body: contactMessageSchema }), contactController.create);

contactRouter.use(authenticate, authorize("admin"));
contactRouter.get("/", contactController.list);
contactRouter.patch(
  "/:id",
  validate({ params: contactIdParamSchema, body: contactStatusSchema }),
  contactController.updateStatus
);
contactRouter.delete(
  "/:id",
  validate({ params: contactIdParamSchema }),
  contactController.remove
);
