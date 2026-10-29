import type { IUser } from "../models/User";
import type { ISubscription } from "../models/Subscription";
import { PERMISSION_CATALOG, type PermissionKey, type PermissionOverride } from "../config/permissions";
import { getAccessTier } from "./subscription.service";

export type PermissionMap = Record<PermissionKey, boolean>;
export type PermissionOverrideMap = Partial<Record<PermissionKey, PermissionOverride>>;

export const normalizePermissionOverrides = (value?: Map<string, PermissionOverride> | Record<string, PermissionOverride>) => {
  if (!value) return {} as PermissionOverrideMap;
  const entries = value instanceof Map ? Array.from(value.entries()) : Object.entries(value);
  return entries.reduce((acc, [key, override]) => {
    if (override && override !== "inherit") acc[key as PermissionKey] = override;
    return acc;
  }, {} as PermissionOverrideMap);
};

export const permissionService = {
  catalog() {
    return PERMISSION_CATALOG;
  },

  compute(user: IUser, subscription?: ISubscription | null): PermissionMap {
    const isAdmin = user.role === "admin";
    const accessTier = getAccessTier(subscription);
    const isPremium = accessTier === "premium";
    const overrides = normalizePermissionOverrides(user.permissionOverrides);

    return PERMISSION_CATALOG.reduce((acc, permission) => {
      const override = overrides[permission.key];
      if (override === "allow") {
        acc[permission.key] = true;
      } else if (override === "deny") {
        acc[permission.key] = false;
      } else if (isAdmin) {
        acc[permission.key] = permission.admin;
      } else if (isPremium) {
        acc[permission.key] = permission.premium;
      } else {
        acc[permission.key] = permission.free;
      }
      return acc;
    }, {} as PermissionMap);
  },

  has(user: IUser, subscription: ISubscription | null | undefined, key: PermissionKey) {
    return this.compute(user, subscription)[key];
  },
};
