import { Router } from "express";
import { analyticsController } from "../controllers/analytics.controller";
import { authenticate, requirePermission } from "../middlewares/auth.middleware";

export const analyticsRouter = Router();

analyticsRouter.use(authenticate);
analyticsRouter.use(requirePermission("analytics.view"));
analyticsRouter.get("/overview", analyticsController.overview);
analyticsRouter.get(
  "/export",
  requirePermission("reports.export"),
  analyticsController.exportCsv
);
