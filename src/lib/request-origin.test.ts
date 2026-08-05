import { describe, expect, it } from "vitest";
import { resolveRequestOrigin } from "./request-origin";

function requestHeaders(values: Record<string, string> = {}) {
  return new Headers(values);
}

describe("resolveRequestOrigin", () => {
  it("uses the browser origin when it is present", () => {
    expect(
      resolveRequestOrigin(
        requestHeaders({ origin: "https://preview.example.com" }),
        "https://readmarginalia.org",
      ),
    ).toBe("https://preview.example.com");
  });

  it("uses Vercel's forwarded host when the origin header is absent", () => {
    expect(
      resolveRequestOrigin(
        requestHeaders({
          "x-forwarded-host": "readmarginalia-git-alpha.vercel.app",
          "x-forwarded-proto": "https",
        }),
        "http://localhost:3000",
      ),
    ).toBe("https://readmarginalia-git-alpha.vercel.app");
  });

  it("keeps local development callbacks on http", () => {
    expect(resolveRequestOrigin(requestHeaders({ host: "localhost:4330" }))).toBe(
      "http://localhost:4330",
    );
  });

  it("falls back to the configured site origin", () => {
    expect(resolveRequestOrigin(requestHeaders(), "https://readmarginalia.org/app")).toBe(
      "https://readmarginalia.org",
    );
  });
});
