"use strict";
/**
 * Unit tests for src/utils/AppError.ts (compiled to dist/utils/AppError.js).
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { AppError } = require("../dist/utils/AppError.js");

test("AppError is an Error subclass with a usable message", () => {
  const err = new AppError("boom");
  assert.ok(err instanceof Error);
  assert.ok(err instanceof AppError);
  assert.equal(err.message, "boom");
});

test("AppError defaults statusCode to 500 when omitted", () => {
  assert.equal(new AppError("boom").statusCode, 500);
});

test("AppError records statusCode, code, and details", () => {
  const details = { field: "email" };
  const err = new AppError("bad request", 400, "VALIDATION", details);
  assert.equal(err.statusCode, 400);
  assert.equal(err.code, "VALIDATION");
  assert.deepEqual(err.details, details);
});

test("AppError captures a stack trace", () => {
  assert.equal(typeof new AppError("boom").stack, "string");
});
