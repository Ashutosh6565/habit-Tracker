export type PermissionKey =
  | "dashboard.view"
  | "tracker.view"
  | "templates.view"
  | "analytics.view"
  | "gamification.view"
  | "pricing.view"
  | "profile.view"
  | "admin.view"
  | "habits.unlimited"
  | "templates.premium"
  | "analytics.advanced"
  | "reports.export"
  | "payments.checkout";

export type PermissionOverride = "allow" | "deny" | "inherit";

export interface PermissionDefinition {
  key: PermissionKey;
  label: string;
  group: string;
  description: string;
  free: boolean;
  premium: boolean;
  admin: boolean;
}

export const PERMISSION_CATALOG: PermissionDefinition[] = [
  {
    key: "dashboard.view",
    label: "Dashboard",
    group: "Pages",
    description: "Access the main dashboard.",
    free: true,
    premium: true,
    admin: true,
  },
  {
    key: "tracker.view",
    label: "Tracker",
    group: "Pages",
    description: "Access daily habit tracking.",
    free: true,
    premium: true,
    admin: true,
  },
  {
    key: "templates.view",
    label: "Templates",
    group: "Pages",
    description: "Open the templates area.",
    free: true,
    premium: true,
    admin: true,
  },
  {
    key: "analytics.view",
    label: "Analytics",
    group: "Pages",
    description: "Open analytics dashboards.",
    free: true,
    premium: true,
    admin: true,
  },
  {
    key: "gamification.view",
    label: "Gamification",
    group: "Pages",
    description: "Open games, XP, achievements, and leaderboard.",
    free: true,
    premium: true,
    admin: true,
  },
  {
    key: "pricing.view",
    label: "Pricing",
    group: "Pages",
    description: "Open pricing and subscription page.",
    free: true,
    premium: true,
    admin: true,
  },
  {
    key: "profile.view",
    label: "Profile",
    group: "Pages",
    description: "Open and edit profile settings.",
    free: true,
    premium: true,
    admin: true,
  },
  {
    key: "admin.view",
    label: "Admin Panel",
    group: "Admin",
    description: "Access admin user, subscription, and permission controls.",
    free: false,
    premium: false,
    admin: true,
  },
  {
    key: "habits.unlimited",
    label: "Unlimited Habits",
    group: "Feature Limits",
    description: "Bypass the free plan limit of 5 active habits.",
    free: false,
    premium: true,
    admin: true,
  },
  {
    key: "templates.premium",
    label: "Premium Templates",
    group: "Feature Limits",
    description: "Access every premium template.",
    free: false,
    premium: true,
    admin: true,
  },
  {
    key: "analytics.advanced",
    label: "Advanced Analytics",
    group: "Premium",
    description: "Access advanced analytics and richer reports.",
    free: false,
    premium: true,
    admin: true,
  },
  {
    key: "reports.export",
    label: "Export Reports",
    group: "Premium",
    description: "Export analytics and progress reports.",
    free: false,
    premium: true,
    admin: true,
  },
  {
    key: "payments.checkout",
    label: "Payments",
    group: "Billing",
    description: "Allow the user to start checkout.",
    free: true,
    premium: true,
    admin: true,
  },
];

export const permissionKeys = PERMISSION_CATALOG.map((permission) => permission.key) as [
  PermissionKey,
  ...PermissionKey[],
];
