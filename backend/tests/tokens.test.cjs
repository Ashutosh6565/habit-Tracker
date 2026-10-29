"use strict";
/**
 * Unit tests for src/utils/tokens.ts (compiled to dist/utils/tokens.js).
 *
 * These run with the development fallback JWT secrets (env.ts only *requires*
 * real secrets when NODE_ENV==="production"), so no .env file is needed.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const {
  signAccessToken,
  verifyAccessToken,
  signRefreshToken,
  verifyRefreshToken,
  createOpaqueToken,
} = require("../dist/utils/tokens.js");

// Minimal IUser stub: tokens.ts only reads .id and .role.
const user = { id: "507f1f77bcf86cd799439011", role: "user" };

test("access token round-trips and carries sub/role/type", () => {
  const token = signAccessToken(user);
  const payload = verifyAccessToken(token);
  assert.equal(payload.sub, user.id);
  assert.equal(payload.role, "user");
  assert.equal(payload.type, "access");
});

test("refresh token round-trips and is typed 'refresh'", () => {
  const payload = verifyRefreshToken(signRefreshToken(user));
  assert.equal(payload.sub, user.id);
  assert.equal(payload.type, "refresh");
});

test("verifyAccessToken throws on a tampered token", () => {
  const token = signAccessToken(user);
  const tampered = token.slice(0, -2) + (token.endsWith("a") ? "bb" : "aa");
  assert.throws(() => verifyAccessToken(tampered));
});

test("access and refresh secrets are distinct (cross-verify fails)", () => {
  // A refresh token must not validate as an access token.
  assert.throws(() => verifyAccessToken(signRefreshToken(user)));
});

test("createOpaqueToken returns 64 hex chars and is unique per call", () => {
  const a = createOpaqueToken();
  const b = createOpaqueToken();
  assert.match(a, /^[0-9a-f]{64}$/);
  assert.notEqual(a, b);
});
