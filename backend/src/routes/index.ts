import { Router } from "express";
import { analyticsRouter } from "./analytics.routes";
import { authRouter } from "./auth.routes";
import { contactRouter } from "./contact.routes";
import { gamificationRouter } from "./gamification.routes";
import { habitRouter } from "./habit.routes";
import { learningRouter } from "./learning.routes";
import { notificationRouter } from "./notification.routes";
import { paymentRouter } from "./payment.routes";
import { plannerRouter } from "./planner.routes";
import { settingsRouter } from "./settings.routes";
import { templateRouter } from "./template.routes";
import { userRouter } from "./user.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRouter);
apiRouter.use("/users", userRouter);
apiRouter.use("/habits", habitRouter);
apiRouter.use("/templates", templateRouter);
apiRouter.use("/analytics", analyticsRouter);
apiRouter.use("/payments", paymentRouter);
apiRouter.use("/notifications", notificationRouter);
apiRouter.use("/settings", settingsRouter);
apiRouter.use("/contact", contactRouter);
apiRouter.use("/gamification", gamificationRouter);
apiRouter.use("/learning", learningRouter);
apiRouter.use("/planner", plannerRouter);
