import { Router } from "express";
import { templateController } from "../controllers/template.controller";
import { authenticate, authorize, optionalAuthenticate, requirePermission } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate";
import {
  createCatalogTemplateSchema,
  templateIdParamSchema,
  updateCatalogTemplateSchema,
  upsertTemplateProgressSchema,
} from "../validators/template.validator";

export const templateRouter = Router();

templateRouter.get("/catalog", optionalAuthenticate, templateController.catalog);

templateRouter.use(authenticate);
templateRouter.use(requirePermission("templates.view"));
templateRouter.post(
  "/catalog",
  authorize("admin"),
  validate({ body: createCatalogTemplateSchema }),
  templateController.createCatalog
);
templateRouter.patch(
  "/catalog/:templateId",
  authorize("admin"),
  validate({ params: templateIdParamSchema, body: updateCatalogTemplateSchema }),
  templateController.updateCatalog
);
templateRouter.delete(
  "/catalog/:templateId",
  authorize("admin"),
  validate({ params: templateIdParamSchema }),
  templateController.deleteCatalog
);
templateRouter.get("/", templateController.list);
templateRouter.put("/", validate({ body: upsertTemplateProgressSchema }), templateController.upsert);
templateRouter.delete("/:templateId", validate({ params: templateIdParamSchema }), templateController.remove);
