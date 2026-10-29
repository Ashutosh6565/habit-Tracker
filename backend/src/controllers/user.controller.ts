import type { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler";
import { accountService } from "../services/account.service";
import { userService } from "../services/user.service";
import { subscriptionService } from "../services/subscription.service";
import { AppError } from "../utils/AppError";

export const userController = {
  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    res.json({ success: true, data: { user: await userService.updateProfile(req.user.id, req.body) } });
  }),

  uploadAvatar: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    if (!req.file) throw new AppError("Avatar file is required", 400, "FILE_REQUIRED");
    const avatarUrl = `/uploads/avatars/${req.file.filename}`;
    const user = await userService.updateProfile(req.user.id, { avatarUrl });
    res.json({ success: true, data: { avatarUrl, user } });
  }),

  deleteAccount: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    const result = await accountService.deleteAccount(req.user.id, req.body.currentPassword);
    res.status(200).json({ success: true, data: result });
  }),

  listUsers: asyncHandler(async (_req: Request, res: Response) => {
    res.json({ success: true, data: { users: await userService.adminListUsers() } });
  }),

  updateUser: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.adminUpdateUser(String(req.params.id), req.body);
    res.json({ success: true, data: { user } });
  }),

  updateSubscription: asyncHandler(async (req: Request, res: Response) => {
    const subscription = await subscriptionService.updateManual(
      String(req.params.id),
      req.body.status,
      req.body.durationMonths,
      req.body.plan
    );
    res.json({ success: true, data: { subscription } });
  }),

  updatePermissions: asyncHandler(async (req: Request, res: Response) => {
    const user = await userService.adminUpdatePermissions(String(req.params.id), req.body.overrides);
    res.json({ success: true, data: { user } });
  }),

  permissionCatalog: asyncHandler(async (_req: Request, res: Response) => {
    res.json({ success: true, data: { permissions: userService.permissionCatalog() } });
  }),
};
