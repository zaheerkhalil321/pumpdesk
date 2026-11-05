import { describe, expect, it } from "vitest";

import { formatDuration, pumpMinutesFor } from "@/features/orders/duration";

describe("pumpMinutesFor", () => {
  it("is 60 minutes plus 1.5 per yard, to the nearest 15 minutes", () => {
    expect(pumpMinutesFor(0)).toBe(60);
    expect(pumpMinutesFor(2)).toBe(60);
    expect(pumpMinutesFor(5)).toBe(75);
    expect(pumpMinutesFor(12)).toBe(75);
    expect(pumpMinutesFor(60)).toBe(150);
    expect(pumpMinutesFor(100)).toBe(210);
  });

  it("falls back to the one-hour base for a missing or invalid volume", () => {
    expect(pumpMinutesFor(0)).toBe(60);
    expect(pumpMinutesFor(Number.NaN)).toBe(60);
    expect(pumpMinutesFor(-10)).toBe(60);
  });
});

describe("formatDuration", () => {
  it("reads as hours and minutes", () => {
    expect(formatDuration(45)).toBe("45 min");
    expect(formatDuration(120)).toBe("2 hr");
    expect(formatDuration(75)).toBe("1 hr 15 min");
  });
});
