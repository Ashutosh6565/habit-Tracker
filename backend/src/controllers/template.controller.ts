import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { templateService } from "../services/template.service";
import { AppError } from "../utils/AppError";

export const templateController = {
  catalog: asyncHandler(async (req: Request, res: Response) => {
    const isAdmin = req.user?.role === "admin";
    const includeInactive = isAdmin && req.query.includeInactive === "true";
    const data = await templateService.listCatalog(req.user?.id, includeInactive, isAdmin);
    res.json({ success: true, data });
  }),

  createCatalog: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    const template = await templateService.createCatalogTemplate(req.user.id, req.body);
    res.status(201).json({ success: true, data: { template } });
  }),

  updateCatalog: asyncHandler(async (req: Request, res: Response) => {
    const template = await templateService.updateCatalogTemplate(String(req.params.templateId), req.body);
    if (!template) throw new AppError("Template not found", 404, "TEMPLATE_NOT_FOUND");
    res.json({ success: true, data: { template } });
  }),

  deleteCatalog: asyncHandler(async (req: Request, res: Response) => {
    const template = await templateService.deactivateCatalogTemplate(String(req.params.templateId));
    if (!template) throw new AppError("Template not found", 404, "TEMPLATE_NOT_FOUND");
    res.json({ success: true, data: { template } });
  }),

  list: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    res.json({ success: true, data: { templates: await templateService.list(req.user.id) } });
  }),

  upsert: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    const canUse = await templateService.canUseTemplate(
      req.user.id,
      String(req.body.templateId),
      req.user.role === "admin"
    );
    if (!canUse) {
      throw new AppError(
        "This template requires an upgraded plan. Upgrade to unlock it.",
        403,
        "TEMPLATE_LOCKED"
      );
    }
    const template = await templateService.upsert(req.user.id, req.body);
    res.json({ success: true, data: { template } });
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    await templateService.remove(req.user.id, String(req.params.templateId));
    res.status(204).send();
  }),
};
