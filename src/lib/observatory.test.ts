import { describe, expect, it } from "vitest";
import type { ReaderRegistryRow } from "./reader-registry";
import { buildObservatoryMetrics } from "./observatory";

const hour = 3_600_000;
const origin = new Date("2026-09-22T12:00:00.000Z").getTime();

function reader(
  email: string,
  status: ReaderRegistryRow["status"],
  activatedAt: number | null,
): ReaderRegistryRow {
  return {
    email,
    status,
    invitedAt: new Date(origin - hour).toISOString(),
    activatedAt: activatedAt === null ? null : new Date(activatedAt).toISOString(),
    createdAt: new Date(origin).toISOString(),
    lastSignInAt: activatedAt === null ? null : new Date(activatedAt).toISOString(),
  };
}

describe("Wizard Observatory metrics", () => {
  it("calculates anonymous reader aggregates without counting owner records", () => {
    const metrics = buildObservatoryMetrics({
      readers: [
        reader("first@example.com", "activated", origin),
        reader("second@example.com", "activated", origin),
        reader("third@example.com", "activated", origin),
        reader("waiting@example.com", "pending", null),
      ],
      users: [
        { id: "reader-1", email: "first@example.com" },
        { id: "reader-2", email: "second@example.com" },
        { id: "reader-3", email: "third@example.com" },
        { id: "reader-4", email: "waiting@example.com" },
        { id: "owner", email: "wizard@example.com" },
      ],
      books: [
        { user_id: "reader-1", status: "reading", added_at: new Date(origin + 2 * hour).toISOString() },
        { user_id: "reader-1", status: "finished", added_at: new Date(origin + 4 * hour).toISOString() },
        { user_id: "reader-2", status: "essential", added_at: new Date(origin + 26 * hour).toISOString() },
        { user_id: "owner", status: "finished", added_at: new Date(origin + hour).toISOString() },
      ],
      reflections: [
        { user_id: "reader-1" },
        { user_id: "reader-2" },
        { user_id: "owner" },
      ],
      covers: [
        { user_id: "reader-1" },
        { user_id: "owner" },
      ],
      ownerIds: new Set(["owner"]),
    });

    expect(metrics).toEqual({
      contributingReaders: 2,
      firstEntryReaders: 2,
      firstEntryRate: 67,
      medianHoursToFirstEntry: 14,
      totalBooks: 3,
      totalReflections: 2,
      totalCovers: 1,
      finishedBooks: 1,
      booksByStatus: {
        essential: 1,
        reading: 1,
        horizon: 0,
        finished: 1,
      },
    });
  });

  it("returns stable zero values when the Alpha has no activated readers", () => {
    const metrics = buildObservatoryMetrics({
      readers: [],
      users: [],
      books: [],
      reflections: [],
      covers: [],
      ownerIds: new Set(),
    });

    expect(metrics.firstEntryRate).toBe(0);
    expect(metrics.medianHoursToFirstEntry).toBeNull();
    expect(metrics.totalBooks).toBe(0);
  });
});
