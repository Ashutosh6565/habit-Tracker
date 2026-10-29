import { User } from "../models/User";
import { Subscription } from "../models/Subscription";
import { AppError } from "../utils/AppError";
import { formatSubscription } from "./subscription.service";
import { permissionService, normalizePermissionOverrides } from "./permission.service";
import type { PermissionKey, PermissionOverride } from "../config/permissions";

export const serializeUser = async (userId: string) => {
  const user = await User.findById(userId).select("+password");
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
  const subscription = await Subscription.findOne({ user: user.id });
  const permissions = permissionService.compute(user, subscription);
  return {
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl || null,
    role: user.role,
    isEmailVerified: user.isEmailVerified,
    hasPassword: Boolean(user.password),
    settings: user.settings,
    permissions,
    permissionOverrides: normalizePermissionOverrides(user.permissionOverrides),
    createdAt: user.createdAt.toISOString(),
    updatedAt: user.updatedAt.toISOString(),
    subscription: formatSubscription(subscription),
  };
};

export const userService = {
  serializeUser,

  async updateProfile(userId: string, input: { fullName?: string; avatarUrl?: string | null }) {
    const update: Record<string, unknown> = {};
    if (input.fullName !== undefined) update.fullName = input.fullName;
    if (input.avatarUrl !== undefined) update.avatarUrl = input.avatarUrl;

    const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true });
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
    return serializeUser(user.id);
  },

  async updateSettings(userId: string, settings: Record<string, unknown>) {
    const $set = Object.fromEntries(
      Object.entries(settings).map(([key, value]) => [`settings.${key}`, value])
    );
    const user = await User.findByIdAndUpdate(userId, { $set }, { new: true });
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
    return serializeUser(user.id);
  },

  async adminListUsers() {
    const users = await User.find().sort({ createdAt: -1 });
    const subs = await Subscription.find({ user: { $in: users.map((u) => u.id) } });
    const subMap = new Map(subs.map((sub) => [String(sub.user), sub]));

    return users.map((user) => {
      const subscription = subMap.get(user.id);
      return {
        id: user.id,
        email: user.email,
        full_name: user.fullName,
        avatar_url: user.avatarUrl || null,
        role: user.role,
        created_at: user.createdAt.toISOString(),
        permissions: permissionService.compute(user, subscription),
        permissionOverrides: normalizePermissionOverrides(user.permissionOverrides),
        subscription: subscription
          ? {
              status: subscription.status,
              plan: subscription.plan,
              tier: formatSubscription(subscription).tier,
              trial_end: subscription.trialEnd?.toISOString() || null,
              current_period_end: subscription.currentPeriodEnd?.toISOString() || null,
            }
          : undefined,
      };
    });
  },

  async adminUpdateUser(userId: string, input: { fullName?: string; email?: string; role?: "user" | "admin" }) {
    const update: Record<string, unknown> = {};
    if (input.fullName !== undefined) update.fullName = input.fullName;
    if (input.email !== undefined) update.email = input.email;
    if (input.role !== undefined) update.role = input.role;
    const user = await User.findByIdAndUpdate(userId, { $set: update }, { new: true });
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
    return user;
  },

  async adminUpdatePermissions(
    userId: string,
    overrides: Partial<Record<PermissionKey, PermissionOverride>>
  ) {
    const normalized = Object.fromEntries(
      Object.entries(overrides).filter(([, value]) => value && value !== "inherit")
    );
    const user = await User.findByIdAndUpdate(
      userId,
      { $set: { permissionOverrides: normalized } },
      { new: true }
    );
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");
    return serializeUser(user.id);
  },

  permissionCatalog() {
    return permissionService.catalog();
  },
};
