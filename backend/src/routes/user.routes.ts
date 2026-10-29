import { Router } from "express";
import { userController } from "../controllers/user.controller";
import { authenticate, authorize } from "../middlewares/auth.middleware";
import { avatarUpload } from "../middlewares/upload.middleware";
import { validate } from "../middlewares/validate";
import {
  adminSubscriptionSchema,
  adminPermissionSchema,
  adminUpdateUserSchema,
  deleteAccountSchema,
  objectIdParamSchema,
  updateProfileSchema,
} from "../validators/user.validator";

export const userRouter = Router();

userRouter.use(authenticate);
userRouter.patch("/me", validate({ body: updateProfileSchema }), userController.updateProfile);
userRouter.post("/me/avatar", avatarUpload.single("avatar"), userController.uploadAvatar);
userRouter.delete("/me", validate({ body: deleteAccountSchema }), userController.deleteAccount);
userRouter.get("/", authorize("admin"), userController.listUsers);
userRouter.get("/permissions/catalog", authorize("admin"), userController.permissionCatalog);
userRouter.patch(
  "/:id",
  authorize("admin"),
  validate({ params: objectIdParamSchema, body: adminUpdateUserSchema }),
  userController.updateUser
);
userRouter.patch(
  "/:id/subscription",
  authorize("admin"),
  validate({ params: objectIdParamSchema, body: adminSubscriptionSchema }),
  userController.updateSubscription
);
userRouter.patch(
  "/:id/permissions",
  authorize("admin"),
  validate({ params: objectIdParamSchema, body: adminPermissionSchema }),
  userController.updatePermissions
);
