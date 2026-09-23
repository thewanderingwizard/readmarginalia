import { describe, expect, it } from "vitest";
import { buildReaderRegistry, type RegistryInvitation } from "./reader-registry";

const invitation: RegistryInvitation = {
  id: "invite-1",
  email: "reader@example.com",
  status: "pending",
  created_at: "2026-09-21T12:00:00.000Z",
  accepted_at: null,
};

function user(lastSignInAt: string | null) {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    email: "reader@example.com",
    created_at: "2026-09-21T12:00:01.000Z",
    email_confirmed_at: lastSignInAt ?? undefined,
    last_sign_in_at: lastSignInAt ?? undefined,
  };
}

describe("reader registry", () => {
  it("treats a successful Supabase sign-in as activated even when the ledger is stale", () => {
    const signedInAt = "2026-09-22T15:30:00.000Z";
    const [reader] = buildReaderRegistry(
      [user(signedInAt)],
      [invitation],
      new Set(),
      new Set(),
    );

    expect(reader.status).toBe("activated");
    expect(reader.activatedAt).toBe(signedInAt);
    expect(reader.lastSignInAt).toBe(signedInAt);
  });

  it("keeps an invitation pending until the reader first signs in", () => {
    const [reader] = buildReaderRegistry([user(null)], [invitation], new Set(), new Set());

    expect(reader.status).toBe("pending");
    expect(reader.activatedAt).toBeNull();
  });

  it("preserves an explicit revocation even if the account signed in previously", () => {
    const [reader] = buildReaderRegistry(
      [user("2026-09-22T15:30:00.000Z")],
      [{ ...invitation, status: "revoked" }],
      new Set(),
      new Set(),
    );

    expect(reader.status).toBe("revoked");
  });

  it("presents accepted ledger records as activated", () => {
    const [reader] = buildReaderRegistry(
      [],
      [{ ...invitation, status: "accepted", accepted_at: "2026-09-22T15:30:00.000Z" }],
      new Set(),
      new Set(),
    );

    expect(reader.status).toBe("activated");
  });
});
