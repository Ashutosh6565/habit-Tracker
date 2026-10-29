import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { analyticsService } from "../services/analytics.service";
import { reportService, type ReportType } from "../services/report.service";
import { AppError } from "../utils/AppError";

const REPORT_TYPES: ReportType[] = ["habits", "templates", "daily"];

export const analyticsController = {
  overview: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    res.json({ success: true, data: await analyticsService.overview(req.user.id) });
  }),

  exportCsv: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    const requested = String(req.query.type || "habits") as ReportType;
    const type = REPORT_TYPES.includes(requested) ? requested : "habits";
    const { filename, csv } = await reportService.exportCsv(req.user.id, type);
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.send(csv);
  }),
};
