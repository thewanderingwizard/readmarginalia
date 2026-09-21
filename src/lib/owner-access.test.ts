import { describe, expect, it } from "vitest";
import { isAllowedOwnerUserId, parseOwnerUserIds } from "./owner-access";

const OWNER_ID = "183c844e-63c7-4e19-8c65-e919399633e0";
const SECOND_OWNER_ID = "bb05d5f0-8d17-4124-aac5-9a381ed04045";

describe("Marginalia Owner allowlist", () => {
  it("normalizes valid UUIDs separated by commas, semicolons, or newlines", () => {
    expect(
      [...parseOwnerUserIds(` ${OWNER_ID.toUpperCase()},${SECOND_OWNER_ID}; not-a-user-id\n`)],
    ).toEqual([OWNER_ID, SECOND_OWNER_ID]);
  });

  it("matches the immutable user ID without regard to case or whitespace", () => {
    expect(isAllowedOwnerUserId(` ${OWNER_ID.toUpperCase()} `, OWNER_ID)).toBe(true);
  });

  it("denies access when the allowlist or user ID is missing", () => {
    expect(isAllowedOwnerUserId(OWNER_ID, undefined)).toBe(false);
    expect(isAllowedOwnerUserId(undefined, OWNER_ID)).toBe(false);
  });
});
