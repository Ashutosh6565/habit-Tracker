import type { LearningVideoPlan } from "./learningVideos";

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api/v1";
const ASSET_BASE_URL = API_BASE_URL.replace(/\/api\/v1\/?$/, "");

type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: unknown;
  };
};

export interface SubscriptionInfo {
  status: string;
  plan?: string;
  tier?: "free" | "starter" | "premium";
  accessTier?: "free" | "starter" | "premium";
  trialEnd: string | null;
  currentPeriodEnd?: string | null;
  cancelAtPeriodEnd?: boolean;
  isActive: boolean;
  isPremium: boolean;
  isStarter?: boolean;
  isTrialing: boolean;
  daysLeft: number;
}

export type PlanCode =
  | "starter_monthly"
  | "premium_all_monthly"
  | "premium_monthly"
  | "premium_yearly"
  | "premium_lifetime";

export type PermissionOverride = "allow" | "deny" | "inherit";

export interface PermissionDefinition {
  key: string;
  label: string;
  group: string;
  description: string;
  free: boolean;
  premium: boolean;
  admin: boolean;
}

export interface ApiUser {
  id: string;
  email: string;
  fullName: string;
  avatarUrl: string | null;
  role: "user" | "admin";
  isEmailVerified: boolean;
  settings?: Record<string, unknown>;
  subscription?: SubscriptionInfo;
  permissions?: Record<string, boolean>;
  permissionOverrides?: Record<string, PermissionOverride>;
  createdAt: string;
  updatedAt: string;
}

export interface ApiSession {
  accessToken: string;
  refreshToken?: string;
}

export interface ApiHabit {
  id: string;
  title: string;
  slug?: string;
  streak: number;
  completed: boolean;
  xp: number;
  difficulty: "easy" | "medium" | "hard";
  frequency?: "daily" | "weekly" | "monthly";
  category: string;
  icon: string;
  reminderTime?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface YouTubeMetadataDto {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  totalDurationSeconds?: number;
}

export interface TemplateProgressDto {
  templateId: string;
  templateName: string;
  habits: { habitId: string; name: string; icon: string }[];
  completions: Record<string, Record<number, boolean>>;
  totalDays: number;
  moodRatings?: Record<number, number>;
  notes?: string;
}

export type TemplateUnlockTier = "free" | "starter" | "premium";

export interface TemplateCatalogDto {
  id?: string;
  templateId: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  month: string;
  year: number;
  totalDays: number;
  habits: { habitId: string; name: string; icon: string }[];
  unlockTier: TemplateUnlockTier;
  isActive: boolean;
  sortOrder: number;
  locked?: boolean;
  canUse?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface TemplateCatalogResponse {
  accessTier: "free" | "starter" | "premium";
  templates: TemplateCatalogDto[];
}

export interface PaymentPlanDto {
  code: PlanCode;
  label: string;
  amount: number;
  currency: string;
}

export interface PaymentPlansResponse {
  paymentLink: string;
  supportEmail: string;
  plans: PaymentPlanDto[];
}

export interface PaymentClaimDto {
  id: string;
  plan: string;
  planLabel: string;
  status: "pending" | "paid" | "failed" | "refunded";
  amount: number;
  currency: string;
  reference: string;
  note: string;
  reviewNote: string;
  verification?: "verified" | "not_found" | "skipped" | "unverified";
  gatewayAmount?: number | null;
  createdAt: string;
  reviewedAt: string | null;
  user?: { id: string; email: string; fullName: string };
}

export interface ContactMessageDto {
  id: string;
  name: string;
  email: string;
  topic: "general" | "billing" | "bug" | "feature" | "press" | "careers";
  subject: string;
  message: string;
  status: "new" | "read" | "replied";
  createdAt: string;
  updatedAt: string;
}

export interface GamificationStatsDto {
  totalXP: number;
  todayXP: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  bestStreak: number;
  longestStreak: number;
  completedToday: number;
  weeklyCompleted: number;
  totalCompletions: number;
  gamesPlayedToday: number;
}

export interface GamificationAchievementDto {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  unlocked: boolean;
  unlockedAt: string | null;
}

export interface GamificationChallengeDto {
  id: string;
  title: string;
  xpReward: number;
  target: number;
  progress: number;
  completed: boolean;
  claimed: boolean;
}

export interface GamificationGameDto {
  id: string;
  xpReward: number;
  claimedToday: boolean;
}

export interface GamificationOverviewDto {
  stats: GamificationStatsDto;
  achievements: GamificationAchievementDto[];
  challenges: GamificationChallengeDto[];
  games: GamificationGameDto[];
}

export interface LeaderboardEntryDto {
  rank: number;
  userId: string;
  name: string;
  xp: number;
  streak: number;
  isCurrentUser: boolean;
}

export interface GameClaimResultDto {
  gameId: string;
  xpEarned: number;
  totalXP: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
}

export interface AnalyticsOverviewDto {
  stats: Record<string, number>;
  habits: ApiHabit[];
  categoryBreakdown: { name: string; total: number; completed: number; rate: number }[];
  difficultyBreakdown: { name: string; total: number; completed: number; rate: number }[];
  dailyTrend: { date: string; completed: number; total: number }[];
  templates: { templateId: string; templateName: string; totalDays: number; habits: number }[];
}

export interface AdminUserRowDto {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url?: string | null;
  role?: "user" | "admin";
  created_at: string;
  permissions?: Record<string, boolean>;
  permissionOverrides?: Record<string, PermissionOverride>;
  subscription?: {
    status: string;
    plan?: string;
    tier?: "free" | "starter" | "premium";
    trial_end: string | null;
    current_period_end: string | null;
  };
}

export interface PaymentDto {
  id?: string;
  provider: string;
  amount: number;
  currency: string;
  status: string;
  plan: string;
  createdAt?: string;
}

export interface RazorpayOrderInfo {
  orderId: string;
  amount: number;
  currency: string;
  keyId: string;
  plan: PlanCode;
  user: { name: string; email: string };
}

export type CheckoutResult =
  | { gateway: "razorpay"; order: RazorpayOrderInfo }
  | { gateway: "stripe"; session: { id: string; url: string | null } };

const ACCESS_TOKEN_KEY = "habbiters_access_token";
const REFRESH_TOKEN_KEY = "habbiters_refresh_token";

export const tokenStore = {
  getAccessToken: () => localStorage.getItem(ACCESS_TOKEN_KEY),
  getRefreshToken: () => localStorage.getItem(REFRESH_TOKEN_KEY),
  set(session: ApiSession) {
    localStorage.setItem(ACCESS_TOKEN_KEY, session.accessToken);
    if (session.refreshToken) localStorage.setItem(REFRESH_TOKEN_KEY, session.refreshToken);
  },
  clear() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  },
};

export class ApiError extends Error {
  code: string;
  status: number;
  details?: unknown;

  constructor(message: string, code = "API_ERROR", status = 500, details?: unknown) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

const normalizeAssetUrl = (url?: string | null) => {
  if (!url) return null;
  if (url.startsWith("http")) return url;
  return `${ASSET_BASE_URL}${url}`;
};

export const normalizeUser = (user: ApiUser): ApiUser => ({
  ...user,
  avatarUrl: normalizeAssetUrl(user.avatarUrl),
});

async function request<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {  const headers = new Headers(options.headers);
  const hasFormData = options.body instanceof FormData;
  if (!hasFormData && !headers.has("Content-Type")) headers.set("Content-Type", "application/json");

  const accessToken = tokenStore.getAccessToken();
  if (accessToken && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: "include",
  });

  if (response.status === 401 && retry && path !== "/auth/refresh") {
    const refreshToken = tokenStore.getRefreshToken();
    if (refreshToken) {
      try {
        const refreshed = await request<{ user: ApiUser; session: ApiSession }>(
          "/auth/refresh",
          { method: "POST", body: JSON.stringify({ refreshToken }) },
          false
        );
        tokenStore.set(refreshed.session);
        return request<T>(path, options, false);
      } catch {
        tokenStore.clear();
      }
    }
  }

  if (response.status === 204) return undefined as T;

  const payload = (await response.json().catch(() => ({}))) as ApiResponse<T>;
  if (!response.ok || payload.success === false) {
    throw new ApiError(
      payload.error?.message || "Request failed",
      payload.error?.code,
      response.status,
      payload.error?.details
    );
  }

  return (payload.data ?? payload) as T;
}

async function requestBlob(path: string, retry = true): Promise<Blob> {
  const headers = new Headers();
  const accessToken = tokenStore.getAccessToken();
  if (accessToken) headers.set("Authorization", `Bearer ${accessToken}`);

  let response = await fetch(`${API_BASE_URL}${path}`, { headers, credentials: "include" });

  if (response.status === 401 && retry) {
    const refreshToken = tokenStore.getRefreshToken();
    if (refreshToken) {
      try {
        const refreshed = await request<{ user: ApiUser; session: ApiSession }>(
          "/auth/refresh",
          { method: "POST", body: JSON.stringify({ refreshToken }) },
          false
        );
        tokenStore.set(refreshed.session);
        return requestBlob(path, false);
      } catch {
        tokenStore.clear();
      }
    }
  }

  if (!response.ok) {
    const payload = (await response.json().catch(() => ({}))) as ApiResponse<unknown>;
    throw new ApiError(
      payload.error?.message || "Export failed",
      payload.error?.code,
      response.status,
      payload.error?.details
    );
  }

  return response.blob();
}

export const api = {
  auth: {
    async signup(fullName: string, email: string, password: string) {
      const data = await request<{ user: ApiUser; session: ApiSession }>("/auth/signup", {
        method: "POST",
        body: JSON.stringify({ fullName, email, password }),
      });
      tokenStore.set(data.session);
      return { ...data, user: normalizeUser(data.user) };
    },
    requestSignupOtp(email: string) {
      return request<{ message: string; delivered: boolean; expiresInMinutes: number; devOtp?: string }>("/auth/signup/request-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
    async verifySignupOtp(fullName: string, email: string, password: string, otp: string) {
      const data = await request<{ user: ApiUser; session: ApiSession }>("/auth/signup/verify-otp", {
        method: "POST",
        body: JSON.stringify({ fullName, email, password, otp }),
      });
      tokenStore.set(data.session);
      return { ...data, user: normalizeUser(data.user) };
    },
    async login(email: string, password: string, rememberMe = false) {
      const data = await request<{ user: ApiUser; session: ApiSession }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password, rememberMe }),
      });
      tokenStore.set(data.session);
      return { ...data, user: normalizeUser(data.user) };
    },
    requestLoginOtp(email: string) {
      return request<{ message: string; delivered: boolean; expiresInMinutes: number; devOtp?: string }>("/auth/login/request-otp", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
    async verifyLoginOtp(email: string, otp: string, rememberMe = false) {
      const data = await request<{ user: ApiUser; session: ApiSession }>("/auth/login/verify-otp", {
        method: "POST",
        body: JSON.stringify({ email, otp, rememberMe }),
      });
      tokenStore.set(data.session);
      return { ...data, user: normalizeUser(data.user) };
    },
    async googleLogin(credential: string, rememberMe = true) {
      const data = await request<{ user: ApiUser; session: ApiSession }>("/auth/google", {
        method: "POST",
        body: JSON.stringify({ credential, rememberMe }),
      });
      tokenStore.set(data.session);
      return { ...data, user: normalizeUser(data.user) };
    },
    async me() {
      const data = await request<{ user: ApiUser }>("/auth/me");
      return { user: normalizeUser(data.user) };
    },
    async logout() {
      await request("/auth/logout", { method: "POST" }).catch(() => undefined);
      tokenStore.clear();
    },
    forgotPassword(email: string) {
      return request("/auth/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email }),
      });
    },
    resetPassword(token: string, password: string) {
      return request("/auth/reset-password", {
        method: "POST",
        body: JSON.stringify({ token, password }),
      });
    },
    changePassword(currentPassword: string, newPassword: string) {
      return request("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
    },
  },
  users: {
    async updateProfile(input: { fullName?: string; avatarUrl?: string | null }) {
      const data = await request<{ user: ApiUser }>("/users/me", {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      return { user: normalizeUser(data.user) };
    },
    async uploadAvatar(file: File) {
      const form = new FormData();
      form.append("avatar", file);
      const data = await request<{ avatarUrl: string; user: ApiUser }>("/users/me/avatar", {
        method: "POST",
        body: form,
      });
      return { ...data, avatarUrl: normalizeAssetUrl(data.avatarUrl), user: normalizeUser(data.user) };
    },
    listAdminUsers() {
      return request<{ users: AdminUserRowDto[] }>("/users");
    },
    updateAdminUser(id: string, input: { fullName?: string; email?: string; role?: "user" | "admin" }) {
      return request(`/users/${id}`, { method: "PATCH", body: JSON.stringify(input) });
    },
    updateAdminSubscription(id: string, input: { status: string; durationMonths?: number; plan?: PlanCode }) {
      return request(`/users/${id}/subscription`, { method: "PATCH", body: JSON.stringify(input) });
    },
    permissionCatalog() {
      return request<{ permissions: PermissionDefinition[] }>("/users/permissions/catalog");
    },
    updateAdminPermissions(id: string, overrides: Record<string, PermissionOverride>) {
      return request(`/users/${id}/permissions`, {
        method: "PATCH",
        body: JSON.stringify({ overrides }),
      });
    },
  },
  habits: {
    async list() {
      return request<ApiHabit[]>("/habits?limit=100&sortBy=createdAt&sortOrder=asc");
    },
    async create(input: Partial<ApiHabit> & { title: string }) {
      const data = await request<{ habit: ApiHabit }>("/habits", {
        method: "POST",
        body: JSON.stringify(input),
      });
      return data.habit;
    },
    async update(id: string, input: Partial<ApiHabit>) {
      const data = await request<{ habit: ApiHabit }>(`/habits/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
      return data.habit;
    },
    async remove(id: string) {
      await request(`/habits/${id}`, { method: "DELETE" });
    },
    async setProgress(id: string, completed: boolean) {
      const data = await request<{ habit: ApiHabit }>(`/habits/${id}/progress`, {
        method: "POST",
        body: JSON.stringify({ completed }),
      });
      return data.habit;
    },
    summary() {
      return request<{ habits: ApiHabit[]; stats: Record<string, number> }>("/habits/summary");
    },
    youtubeMetadata(url: string) {
      return request<YouTubeMetadataDto>(`/habits/youtube-metadata?url=${encodeURIComponent(url)}`);
    },
  },
  templates: {
    catalog(includeInactive = false) {      return request<TemplateCatalogResponse>(
        `/templates/catalog${includeInactive ? "?includeInactive=true" : ""}`
      );
    },
    createCatalog(input: Omit<TemplateCatalogDto, "id" | "createdAt" | "updatedAt">) {
      return request<{ template: TemplateCatalogDto }>("/templates/catalog", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    updateCatalog(templateId: string, input: Partial<Omit<TemplateCatalogDto, "id" | "templateId" | "createdAt" | "updatedAt">>) {
      return request<{ template: TemplateCatalogDto }>(`/templates/catalog/${templateId}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
    },
    deleteCatalog(templateId: string) {
      return request<{ template: TemplateCatalogDto }>(`/templates/catalog/${templateId}`, {
        method: "DELETE",
      });
    },
    list() {
      return request<{ templates: TemplateProgressDto[] }>("/templates");
    },
    upsert(input: TemplateProgressDto) {
      return request("/templates", {
        method: "PUT",
        body: JSON.stringify(input),
      });
    },
  },
  learning: {
    list() {
      return request<{ plans: LearningVideoPlan[] }>("/learning");
    },
    upsert(plan: LearningVideoPlan) {
      return request<{ plan: LearningVideoPlan }>("/learning", {
        method: "PUT",
        body: JSON.stringify(plan),
      });
    },
    remove(planId: string) {
      return request<void>(`/learning/${encodeURIComponent(planId)}`, { method: "DELETE" });
    },
  },
  payments: {
    subscription() {
      return request<{ subscription: SubscriptionInfo }>("/payments/subscription");
    },
    checkout(plan: PlanCode) {
      return request<CheckoutResult>("/payments/checkout", {
        method: "POST",
        body: JSON.stringify({ plan }),
      });
    },
    verifyRazorpay(input: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) {
      return request<{ subscription: SubscriptionInfo }>("/payments/razorpay/verify", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    history() {
      return request<{ payments: PaymentDto[] }>("/payments/history");
    },
    plans() {
      return request<PaymentPlansResponse>("/payments/plans");
    },
    createClaim(input: { plan: PlanCode; reference: string; note?: string }) {
      return request<{ claim: PaymentClaimDto }>("/payments/claims", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    myClaims() {
      return request<{ claims: PaymentClaimDto[] }>("/payments/claims/me");
    },
    adminClaims(status?: string) {
      return request<{ claims: PaymentClaimDto[] }>(
        `/payments/admin/claims${status ? `?status=${encodeURIComponent(status)}` : ""}`
      );
    },
    reviewClaim(
      id: string,
      input: { action: "approve" | "reject"; plan?: PlanCode; durationMonths?: number; note?: string }
    ) {
      return request<{ claim: PaymentClaimDto }>(`/payments/admin/claims/${id}`, {
        method: "PATCH",
        body: JSON.stringify(input),
      });
    },
    cancel() {
      return request<{ subscription: SubscriptionInfo }>("/payments/subscription/cancel", {
        method: "POST",
      });
    },
  },
  contact: {
    create(input: {
      name: string;
      email: string;
      topic: ContactMessageDto["topic"];
      subject?: string;
      message: string;
    }) {
      return request<{ message: ContactMessageDto; info: string }>("/contact", {
        method: "POST",
        body: JSON.stringify(input),
      });
    },
    listAdmin(status?: string) {
      return request<{ messages: ContactMessageDto[] }>(
        `/contact${status ? `?status=${encodeURIComponent(status)}` : ""}`
      );
    },
    updateStatus(id: string, status: ContactMessageDto["status"]) {
      return request<{ message: ContactMessageDto }>(`/contact/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
    },
    remove(id: string) {
      return request<void>(`/contact/${id}`, { method: "DELETE" });
    },
  },
  analytics: {
    overview() {
      return request<AnalyticsOverviewDto>("/analytics/overview");
    },
    exportCsv(type: "habits" | "templates" | "daily") {
      return requestBlob(`/analytics/export?type=${type}`);
    },
  },
  gamification: {
    overview() {
      return request<GamificationOverviewDto>("/gamification/overview");
    },
    leaderboard() {
      return request<{ entries: LeaderboardEntryDto[] }>("/gamification/leaderboard");
    },
    claimGame(gameId: string) {
      return request<GameClaimResultDto>(
        `/gamification/games/${encodeURIComponent(gameId)}/claim`,
        { method: "POST" }
      );
    },
  },
};

export const getApiErrorMessage = (error: unknown) =>
  error instanceof Error ? error.message : "Something went wrong";
