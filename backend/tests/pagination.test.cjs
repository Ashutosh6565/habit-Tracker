"use strict";
/**
 * Unit tests for src/utils/pagination.ts (compiled to dist/utils/pagination.js).
 *
 * Uses Node's built-in test runner (node:test) so it needs no extra
 * dependencies and runs on Node 20+. `npm test` compiles the TypeScript
 * to dist/ first, then runs these files against the compiled output.
 */
const test = require("node:test");
const assert = require("node:assert/strict");
const { getPagination, paginated } = require("../dist/utils/pagination.js");

// getPagination reads only from req.query, so a plain object is a valid stub.
const req = (query) => ({ query });

test("getPagination: sensible defaults when no query params", () => {
  const result = getPagination(req({}));
  assert.equal(result.page, 1);
  assert.equal(result.limit, 20);
  assert.equal(result.skip, 0);
  assert.deepEqual(result.sort, { createdAt: -1 });
});

test("getPagination: clamps limit to a maximum of 100", () => {
  assert.equal(getPagination(req({ limit: "500" })).limit, 100);
});

test("getPagination: clamps limit to a minimum of 1", () => {
  assert.equal(getPagination(req({ limit: "0" })).limit, 1);
  assert.equal(getPagination(req({ limit: "-10" })).limit, 1);
});

test("getPagination: forces page to be at least 1", () => {
  assert.equal(getPagination(req({ page: "0" })).page, 1);
  assert.equal(getPagination(req({ page: "-3" })).page, 1);
});

test("getPagination: computes skip from page and limit", () => {
  const result = getPagination(req({ page: "3", limit: "25" }));
  assert.equal(result.skip, 50); // (3 - 1) * 25
});

test("getPagination: sortOrder=asc maps to 1, anything else to -1", () => {
  assert.deepEqual(getPagination(req({ sortBy: "title", sortOrder: "asc" })).sort, { title: 1 });
  assert.deepEqual(getPagination(req({ sortBy: "title", sortOrder: "desc" })).sort, { title: -1 });
  assert.deepEqual(getPagination(req({ sortBy: "title", sortOrder: "weird" })).sort, { title: -1 });
});

test("paginated: builds meta with a correctly rounded totalPages", () => {
  const out = paginated([1, 2, 3], 21, 2, 10);
  assert.deepEqual(out.data, [1, 2, 3]);
  assert.equal(out.meta.total, 21);
  assert.equal(out.meta.page, 2);
  assert.equal(out.meta.limit, 10);
  assert.equal(out.meta.totalPages, 3); // ceil(21 / 10)
});
