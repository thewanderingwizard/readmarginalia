import { describe, expect, it } from "vitest";
import {
  MARGINALIA_QUOTES,
  findMarginaliaQuote,
  nextMarginaliaQuoteId,
  randomMarginaliaQuoteId,
} from "./quotes";

describe("Marginalia commonplace book", () => {
  it("contains fifty complete, uniquely identified quotations", () => {
    expect(MARGINALIA_QUOTES).toHaveLength(50);
    expect(new Set(MARGINALIA_QUOTES.map((quote) => quote.id)).size).toBe(50);

    for (const quote of MARGINALIA_QUOTES) {
      expect(quote.text.trim()).not.toBe("");
      expect(quote.author.trim()).not.toBe("");
      expect(quote.source.trim()).not.toBe("");
      expect(quote.sourceUrl).toMatch(/^https:\/\//);
    }
  });

  it("selects deterministic boundary entries", () => {
    expect(randomMarginaliaQuoteId(() => 0)).toBe(MARGINALIA_QUOTES[0].id);
    expect(randomMarginaliaQuoteId(() => 0.999999)).toBe(MARGINALIA_QUOTES.at(-1)?.id);
  });

  it("never immediately repeats the current quotation", () => {
    for (const current of MARGINALIA_QUOTES) {
      expect(nextMarginaliaQuoteId(current.id, () => 0)).not.toBe(current.id);
      expect(nextMarginaliaQuoteId(current.id, () => 0.999999)).not.toBe(current.id);
    }
  });

  it("falls back safely when an unknown quotation id is supplied", () => {
    expect(findMarginaliaQuote("missing")).toBe(MARGINALIA_QUOTES[0]);
    expect(nextMarginaliaQuoteId("missing", () => 0)).toBe(MARGINALIA_QUOTES[1].id);
  });
});
