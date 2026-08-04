export const BOOK_FORMATS = [
  "Hardcover",
  "Softcover",
  "Digital",
  "PDF",
  "Audio",
] as const;

export const BOOK_STATUSES = ["reading", "horizon", "finished", "essential"] as const;

export type BookFormat = (typeof BOOK_FORMATS)[number];
export type BookStatus = (typeof BOOK_STATUSES)[number];
export type ShelfFilter = BookStatus;

export type Reflection = {
  id: string;
  text: string;
  ts: number;
  shareable: boolean;
};

export type LibraryBook = {
  id: string;
  title: string;
  author: string;
  format: BookFormat;
  photo: string | null;
  photoPath: string | null;
  status: BookStatus;
  addedAt: number;
  reflections: Reflection[];
  essentialWhy: string;
  essentialWhen: string;
};

export type ReaderProfile = {
  name: string;
  why: string;
};

export type MarginaliaLibrary = {
  profile: ReaderProfile;
  books: LibraryBook[];
  onboarded: boolean;
};

export const STATUS_LABELS: Record<BookStatus, string> = {
  reading: "Currently Reading",
  horizon: "On the Horizon",
  finished: "Finished Reads",
  essential: "Essential Reads",
};

export const EMPTY_SHELF_MESSAGES: Record<BookStatus, string> = {
  reading: "No book rests here yet. What are you carrying with you today?",
  horizon: "The horizon is clear. Place a book here when it begins to call.",
  finished: "No finished volumes yet. A shelf should grow at a reader’s pace.",
  essential: "Essential books reveal themselves slowly.",
};

export const EMPTY_LIBRARY: MarginaliaLibrary = {
  profile: { name: "", why: "" },
  books: [],
  onboarded: false,
};

export function createId(prefix: "book" | "note") {
  void prefix;
  return globalThis.crypto.randomUUID();
}
