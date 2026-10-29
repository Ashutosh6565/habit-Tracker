import { describe, it, expect, beforeEach } from "vitest";
import { tokenStore, normalizeUser, ApiError, getApiErrorMessage, type ApiUser } from "./api";

const makeUser = (avatarUrl: ApiUser["avatarUrl"]): ApiUser => ({
  id: "u1",
  email: "a@b.com",
  fullName: "A B",
  avatarUrl,
  role: "user",
  isEmailVerified: true,
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-01T00:00:00.000Z",
});

describe("tokenStore", () => {
  beforeEach(() => localStorage.clear());

  it("returns null when no tokens are stored", () => {
    expect(tokenStore.getAccessToken()).toBeNull();
    expect(tokenStore.getRefreshToken()).toBeNull();
  });

  it("persists and reads back access + refresh tokens", () => {
    tokenStore.set({ accessToken: "acc", refreshToken: "ref" });
    expect(tokenStore.getAccessToken()).toBe("acc");
    expect(tokenStore.getRefreshToken()).toBe("ref");
  });

  it("leaves the refresh token untouched when the session omits it", () => {
    tokenStore.set({ accessToken: "acc", refreshToken: "ref" });
    tokenStore.set({ accessToken: "acc2" });
    expect(tokenStore.getAccessToken()).toBe("acc2");
    expect(tokenStore.getRefreshToken()).toBe("ref");
  });

  it("clear() removes both tokens", () => {
    tokenStore.set({ accessToken: "acc", refreshToken: "ref" });
    tokenStore.clear();
    expect(tokenStore.getAccessToken()).toBeNull();
    expect(tokenStore.getRefreshToken()).toBeNull();
  });
});

describe("normalizeUser", () => {
  it("prefixes a relative avatar path with the asset base URL", () => {
    expect(normalizeUser(makeUser("/uploads/avatars/x.png")).avatarUrl).toBe(
      "http://localhost:5000/uploads/avatars/x.png"
    );
  });

  it("leaves an absolute http(s) avatar URL unchanged", () => {
    const abs = "https://cdn.example.com/x.png";
    expect(normalizeUser(makeUser(abs)).avatarUrl).toBe(abs);
  });

  it("passes null avatar through as null", () => {
    expect(normalizeUser(makeUser(null)).avatarUrl).toBeNull();
  });
});

describe("ApiError", () => {
  it("defaults code/status and carries details", () => {
    const err = new ApiError("nope");
    expect(err).toBeInstanceOf(Error);
    expect(err.code).toBe("API_ERROR");
    expect(err.status).toBe(500);

    const detailed = new ApiError("bad", "VALIDATION", 400, { field: "email" });
    expect(detailed.status).toBe(400);
    expect(detailed.details).toEqual({ field: "email" });
  });
});

describe("getApiErrorMessage", () => {
  it("returns the message from an Error", () => {
    expect(getApiErrorMessage(new Error("boom"))).toBe("boom");
  });

  it("returns a fallback for non-Error values", () => {
    expect(getApiErrorMessage("weird")).toBe("Something went wrong");
  });
});
