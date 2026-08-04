import {
  BOOK_FORMATS,
  BOOK_STATUSES,
  EMPTY_LIBRARY,
  type BookFormat,
  type BookStatus,
  type LibraryBook,
  type MarginaliaLibrary,
  type Reflection,
} from "./types";

export const STORAGE_KEY = "marginalia.v0.1";
const MIGRATION_KEY_PREFIX = "marginalia.supabase.pending.";
const MIGRATED_KEY_PREFIX = "marginalia.supabase.migrated.";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isBookFormat(value: unknown): value is BookFormat {
  return typeof value === "string" && BOOK_FORMATS.includes(value as BookFormat);
}

function isBookStatus(value: unknown): value is BookStatus {
  return typeof value === "string" && BOOK_STATUSES.includes(value as BookStatus);
}

function sanitizeReflection(value: unknown): Reflection | null {
  if (!isRecord(value) || typeof value.text !== "string") return null;

  return {
    id: typeof value.id === "string" ? value.id : `note_${Math.random().toString(36).slice(2)}`,
    text: value.text.slice(0, 20_000),
    ts: typeof value.ts === "number" ? value.ts : Date.now(),
    shareable: value.shareable === true,
  };
}

function sanitizeBook(value: unknown): LibraryBook | null {
  if (!isRecord(value) || typeof value.title !== "string" || !value.title.trim()) return null;

  const reflections = Array.isArray(value.reflections)
    ? value.reflections.map(sanitizeReflection).filter((note): note is Reflection => note !== null)
    : [];

  return {
    id: typeof value.id === "string" ? value.id : `book_${Math.random().toString(36).slice(2)}`,
    title: value.title.trim().slice(0, 300),
    author:
      typeof value.author === "string" && value.author.trim()
        ? value.author.trim().slice(0, 300)
        : "Unknown hand",
    format: isBookFormat(value.format) ? value.format : "Softcover",
    photo: typeof value.photo === "string" && value.photo.startsWith("data:image/") ? value.photo : null,
    photoPath: typeof value.photoPath === "string" ? value.photoPath : null,
    status: isBookStatus(value.status) ? value.status : "horizon",
    addedAt: typeof value.addedAt === "number" ? value.addedAt : Date.now(),
    reflections,
    essentialWhy: typeof value.essentialWhy === "string" ? value.essentialWhy.slice(0, 20_000) : "",
    essentialWhen: typeof value.essentialWhen === "string" ? value.essentialWhen.slice(0, 500) : "",
  };
}

export function parseStoredLibrary(raw: string | null): MarginaliaLibrary {
  if (!raw) return EMPTY_LIBRARY;

  try {
    const value: unknown = JSON.parse(raw);
    if (!isRecord(value)) return EMPTY_LIBRARY;

    const profile = isRecord(value.profile) ? value.profile : {};
    const books = Array.isArray(value.books)
      ? value.books.map(sanitizeBook).filter((book): book is LibraryBook => book !== null)
      : [];

    return {
      profile: {
        name: typeof profile.name === "string" ? profile.name.slice(0, 120) : "",
        why: typeof profile.why === "string" ? profile.why.slice(0, 20_000) : "",
      },
      books,
      onboarded: value.onboarded === true && books.length > 0,
    };
  } catch {
    return EMPTY_LIBRARY;
  }
}

export function loadLibrary(): MarginaliaLibrary {
  if (typeof window === "undefined") return EMPTY_LIBRARY;
  return parseStoredLibrary(window.localStorage.getItem(STORAGE_KEY));
}

export function saveLibrary(library: MarginaliaLibrary) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(library));
}

export function prepareLocalMigration(userId: string): MarginaliaLibrary | null {
  if (typeof window === "undefined") return null;
  if (window.localStorage.getItem(`${MIGRATED_KEY_PREFIX}${userId}`)) return null;

  const pendingKey = `${MIGRATION_KEY_PREFIX}${userId}`;
  const pending = window.localStorage.getItem(pendingKey);
  if (pending) return parseStoredLibrary(pending);

  const local = loadLibrary();
  if (!local.onboarded || !local.books.length) return null;
  const remapped: MarginaliaLibrary = {
    ...local,
    books: local.books.map((book) => ({
      ...book,
      id: globalThis.crypto.randomUUID(),
      photoPath: null,
      reflections: book.reflections.map((reflection) => ({
        ...reflection,
        id: globalThis.crypto.randomUUID(),
      })),
    })),
  };
  window.localStorage.setItem(pendingKey, JSON.stringify(remapped));
  return remapped;
}

export function completeLocalMigration(userId: string) {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(`${MIGRATION_KEY_PREFIX}${userId}`);
  window.localStorage.setItem(`${MIGRATED_KEY_PREFIX}${userId}`, new Date().toISOString());
}
