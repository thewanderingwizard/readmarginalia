import { describe, expect, it } from "vitest";
import { isAllowedAdminEmail, parseAdminEmails } from "./admin-access";

describe("Marginalia admin allowlist", () => {
  it("normalizes comma, semicolon, and newline separated addresses", () => {
    expect(
      [...parseAdminEmails(" Keeper@Example.com,second@example.com; third@example.com\nfourth@example.com ")],
    ).toEqual(["keeper@example.com", "second@example.com", "third@example.com", "fourth@example.com"]);
  });

  it("matches addresses without regard to case or surrounding whitespace", () => {
    expect(isAllowedAdminEmail(" Keeper@Example.com ", "keeper@example.com")).toBe(true);
  });

  it("denies access when the allowlist or user email is missing", () => {
    expect(isAllowedAdminEmail("keeper@example.com", undefined)).toBe(false);
    expect(isAllowedAdminEmail(undefined, "keeper@example.com")).toBe(false);
  });
});
