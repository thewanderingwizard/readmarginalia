import { describe, expect, it } from "vitest";
import { parseStoredLibrary } from "./storage";

describe("parseStoredLibrary", () => {
  it("preserves a valid v0.1 library", () => {
    const library = parseStoredLibrary(
      JSON.stringify({
        profile: { name: "Cameron", why: "To remember what changed me." },
        books: [
          {
            id: "book_1",
            title: "The Left Hand of Darkness",
            author: "Ursula K. Le Guin",
            format: "Softcover",
            photo: null,
            status: "reading",
            addedAt: 1,
            reflections: [{ id: "note_1", text: "A first note.", ts: 2, shareable: false }],
            essentialWhy: "",
            essentialWhen: "",
          },
        ],
        onboarded: true,
      }),
    );

    expect(library.profile.name).toBe("Cameron");
    expect(library.books[0]?.title).toBe("The Left Hand of Darkness");
    expect(library.onboarded).toBe(true);
  });

  it("returns an empty library for malformed JSON", () => {
    expect(parseStoredLibrary("not-json").books).toEqual([]);
    expect(parseStoredLibrary("not-json").onboarded).toBe(false);
  });

  it("rejects unsafe photo values and unknown statuses", () => {
    const library = parseStoredLibrary(
      JSON.stringify({
        profile: {},
        books: [{ title: "A Book", status: "somewhere", photo: "https://example.com/tracker" }],
        onboarded: true,
      }),
    );

    expect(library.books[0]?.status).toBe("horizon");
    expect(library.books[0]?.photo).toBeNull();
  });
});
