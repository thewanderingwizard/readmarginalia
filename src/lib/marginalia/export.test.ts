import { strFromU8, unzipSync } from "fflate";
import { describe, expect, it } from "vitest";
import { buildExportHtml, buildExportRecord, buildLibraryArchive } from "./export";
import type { MarginaliaLibrary } from "./types";

const library: MarginaliaLibrary = {
  onboarded: true,
  profile: { name: "A Reader", why: "I read because <wonder> endures." },
  books: [{
    id: "11111111-1111-4111-8111-111111111111",
    title: "A Book & Its Margins",
    author: "An Author",
    format: "Hardcover",
    photo: "data:image/webp;base64,AAAA",
    photoPath: null,
    status: "essential",
    addedAt: Date.parse("2026-08-01T12:00:00Z"),
    essentialWhy: "It changed me.",
    essentialWhen: "Long ago",
    reflections: [{
      id: "22222222-2222-4222-8222-222222222222",
      text: "A private <thought>.",
      ts: Date.parse("2026-08-02T12:00:00Z"),
      shareable: false,
    }],
  }],
};

describe("reader export", () => {
  it("creates a portable JSON record without signed storage URLs", () => {
    const record = buildExportRecord(library, new Date("2026-08-03T00:00:00Z"));
    expect(record.books[0].photograph).toMatch(/^photographs\//);
    expect(JSON.stringify(record)).not.toContain("data:image");
    expect(record.profile.readingMotto).toBe(library.profile.why);
  });

  it("escapes reader-authored HTML", () => {
    const html = buildExportHtml(library, new Date("2026-08-03T00:00:00Z"));
    expect(html).toContain("&lt;wonder&gt;");
    expect(html).toContain("A private &lt;thought&gt;.");
    expect(html).not.toContain("A private <thought>.");
  });

  it("packages HTML, JSON, instructions, and photographs in one archive", async () => {
    const archive = await buildLibraryArchive(library, new Date("2026-08-03T00:00:00Z"));
    const files = unzipSync(archive);
    expect(Object.keys(files)).toContain("marginalia-library.html");
    expect(Object.keys(files)).toContain("marginalia-library.json");
    expect(Object.keys(files)).toContain("README.txt");
    expect(Object.keys(files).some((name) => name.startsWith("photographs/"))).toBe(true);
    expect(strFromU8(files["marginalia-library.json"])).toContain("A Book & Its Margins");
  });
});
