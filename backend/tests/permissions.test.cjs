"use strict";
/**
 * Unit tests for the permission engine.
 *   src/services/permission.service.ts  -> dist/services/permission.service.js
 *   src/config/permissions.ts           -> dist/config/permissions.js
 *
 * NOTE: permissionService.compute() calls getSubscriptionTier(), which is
 * currently STUBBED to always return "premium" (see audit finding B: paywall
 * disabled). These tests therefore assert only invariants that hold regardless
 * of that stub: override precedence, the admin path, and completeness. When the
 * paywall is re-enabled, add free-vs-premium tier tests here.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { permissionService, normalizePermissionOverrides } = require("../dist/services/permission.service.js");
const { PERMISSION_CATALOG } = require("../dist/config/permissions.js");

const userWith = (over = {}, role = "user") => ({ role, permissionOverrides: over });

test("compute: returns a boolean for every catalog key (no missing/extra keys)", () => {
  const map = permissionService.compute(userWith(), null);
  const catalogKeys = PERMISSION_CATALOG.map((p) => p.key).sort();
  const resultKeys = Object.keys(map).sort();
  assert.deepEqual(resultKeys, catalogKeys);
  for (const key of resultKeys) {
    assert.equal(typeof map[key], "boolean", `${key} should be boolean`);
  }
});

test("compute: an 'allow' override grants a permission that is false at every tier", () => {
  // admin.view is free:false, premium:false for a non-admin -> normally denied.
  const denied = permissionService.compute(userWith(), null);
  assert.equal(denied["admin.view"], false);

  const allowed = permissionService.compute(userWith({ "admin.view": "allow" }), null);
  assert.equal(allowed["admin.view"], true);
});

test("compute: a 'deny' override revokes a permission that is true at every tier", () => {
  const granted = permissionService.compute(userWith(), null);
  assert.equal(granted["dashboard.view"], true);

  const revoked = permissionService.compute(userWith({ "dashboard.view": "deny" }), null);
  assert.equal(revoked["dashboard.view"], false);
});

test("compute: admin role receives admin-only permissions", () => {
  const admin = permissionService.compute(userWith({}, "admin"), null);
  assert.equal(admin["admin.view"], true);
});

test("compute: accepts a Map of overrides as well as a plain object", () => {
  const viaMap = permissionService.compute(
    userWith(new Map([["admin.view", "allow"]])),
    null
  );
  assert.equal(viaMap["admin.view"], true);
});

test("normalizePermissionOverrides: drops 'inherit' and undefined, keeps allow/deny", () => {
  assert.deepEqual(normalizePermissionOverrides(undefined), {});
  assert.deepEqual(
    normalizePermissionOverrides({ "a.b": "inherit", "c.d": "allow", "e.f": "deny" }),
    { "c.d": "allow", "e.f": "deny" }
  );
});
