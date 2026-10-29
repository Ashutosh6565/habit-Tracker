import { describe, it, expect } from "vitest";
import { cn } from "./utils";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", "b")).toBe("a b");
  });

  it("drops falsy values (conditional classes)", () => {
    expect(cn("a", false && "b", undefined, null, "c")).toBe("a c");
  });

  it("de-duplicates conflicting tailwind classes (last wins)", () => {
    // tailwind-merge keeps the last conflicting utility.
    expect(cn("px-2", "px-4")).toBe("px-4");
  });

  it("merges arrays of class values", () => {
    expect(cn(["a", "b"], "c")).toBe("a b c");
  });
});
