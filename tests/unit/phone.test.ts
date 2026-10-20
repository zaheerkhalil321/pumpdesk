import { describe, expect, it } from "vitest";

import { formatE164, toE164 } from "@/lib/phone";

describe("toE164", () => {
  it("converts the UI format", () => {
    expect(toE164("(207) 555-0101")).toBe("+12075550101");
  });
  it("converts dashed and plain digits", () => {
    expect(toE164("207-555-0101")).toBe("+12075550101");
    expect(toE164("2075550101")).toBe("+12075550101");
  });
  it("accepts a leading country code", () => {
    expect(toE164("+1 207 555 0101")).toBe("+12075550101");
    expect(toE164("12075550101")).toBe("+12075550101");
  });
  it("rejects wrong lengths and bad area codes", () => {
    expect(toE164("555-0101")).toBeNull();
    expect(toE164("(007) 555-0101")).toBeNull();
    expect(toE164("")).toBeNull();
  });
});

describe("formatE164", () => {
  it("formats a US number", () => {
    expect(formatE164("+12075550101")).toBe("(207) 555-0101");
  });
  it("handles empty values and non-US numbers", () => {
    expect(formatE164(null)).toBe("");
    expect(formatE164("+442071234567")).toBe("+442071234567");
  });
});
