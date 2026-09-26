import type { ReaderRegistryRow } from "./reader-registry";

export type ObservatoryUser = {
  id: string;
  email?: string | null;
};

export type ObservatoryBookRecord = {
  user_id: string;
  status: "essential" | "reading" | "horizon" | "finished";
  added_at: string;
};

export type ObservatoryOwnedRecord = {
  user_id: string;
};

export type ObservatoryMetrics = {
  contributingReaders: number;
  firstEntryReaders: number;
  firstEntryRate: number;
  medianHoursToFirstEntry: number | null;
  totalBooks: number;
  totalReflections: number;
  totalCovers: number;
  finishedBooks: number;
  booksByStatus: Record<ObservatoryBookRecord["status"], number>;
};

export const EMPTY_OBSERVATORY_METRICS: ObservatoryMetrics = {
  contributingReaders: 0,
  firstEntryReaders: 0,
  firstEntryRate: 0,
  medianHoursToFirstEntry: null,
  totalBooks: 0,
  totalReflections: 0,
  totalCovers: 0,
  finishedBooks: 0,
  booksByStatus: {
    essential: 0,
    reading: 0,
    horizon: 0,
    finished: 0,
  },
};

function median(values: number[]) {
  if (!values.length) return null;
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2
    ? sorted[middle]
    : (sorted[middle - 1] + sorted[middle]) / 2;
}

export function buildObservatoryMetrics({
  readers,
  users,
  books,
  reflections,
  covers,
  ownerIds,
}: {
  readers: ReaderRegistryRow[];
  users: ObservatoryUser[];
  books: ObservatoryBookRecord[];
  reflections: ObservatoryOwnedRecord[];
  covers: ObservatoryOwnedRecord[];
  ownerIds: Set<string>;
}): ObservatoryMetrics {
  const readerUsers = users.filter((user) => !ownerIds.has(user.id.toLowerCase()));
  const readerIds = new Set(readerUsers.map((user) => user.id));
  const userIdByEmail = new Map(
    readerUsers
      .filter((user) => Boolean(user.email))
      .map((user) => [user.email!.toLowerCase(), user.id]),
  );

  const readerBooks = books.filter((book) => readerIds.has(book.user_id));
  const readerReflections = reflections.filter((reflection) => readerIds.has(reflection.user_id));
  const readerCovers = covers.filter((cover) => readerIds.has(cover.user_id));
  const firstBookAtByUser = new Map<string, number>();
  const booksByStatus = { ...EMPTY_OBSERVATORY_METRICS.booksByStatus };

  for (const book of readerBooks) {
    booksByStatus[book.status] += 1;
    const addedAt = new Date(book.added_at).getTime();
    const earliest = firstBookAtByUser.get(book.user_id);
    if (Number.isFinite(addedAt) && (earliest === undefined || addedAt < earliest)) {
      firstBookAtByUser.set(book.user_id, addedAt);
    }
  }

  const activatedReaders = readers.filter((reader) => reader.status === "activated");
  const firstEntryReaders = activatedReaders.filter((reader) => {
    const userId = userIdByEmail.get(reader.email.toLowerCase());
    return userId ? firstBookAtByUser.has(userId) : false;
  });
  const hoursToFirstEntry = firstEntryReaders.flatMap((reader) => {
    if (!reader.activatedAt) return [];
    const userId = userIdByEmail.get(reader.email.toLowerCase());
    const firstBookAt = userId ? firstBookAtByUser.get(userId) : undefined;
    const activatedAt = new Date(reader.activatedAt).getTime();
    if (firstBookAt === undefined || !Number.isFinite(activatedAt) || firstBookAt < activatedAt) {
      return [];
    }
    return [(firstBookAt - activatedAt) / 3_600_000];
  });

  return {
    contributingReaders: firstBookAtByUser.size,
    firstEntryReaders: firstEntryReaders.length,
    firstEntryRate: activatedReaders.length
      ? Math.round((firstEntryReaders.length / activatedReaders.length) * 100)
      : 0,
    medianHoursToFirstEntry: median(hoursToFirstEntry),
    totalBooks: readerBooks.length,
    totalReflections: readerReflections.length,
    totalCovers: readerCovers.length,
    finishedBooks: booksByStatus.finished,
    booksByStatus,
  };
}
