import { describe, expect, it } from "vitest";

import { parseUsAddress } from "@/features/orders/address";

describe("parseUsAddress", () => {
  it("reads the Google format", () => {
    expect(parseUsAddress("123 Main St, Portland, ME, USA")).toEqual({
      addressLine1: "123 Main St",
      city: "Portland",
      state: "ME",
      postalCode: null,
    });
  });

  it("reads a ZIP code, with or without the country", () => {
    expect(parseUsAddress("14 Ridge Road, Appleton, ME 04862")?.postalCode).toBe("04862");
    expect(parseUsAddress("14 Ridge Road, Appleton, ME 04862-1234, USA")?.postalCode).toBe("04862");
  });

  it("keeps a unit in the street line", () => {
    expect(parseUsAddress("5 Pine St, Unit 2, Camden, ME 04843")?.addressLine1).toBe("5 Pine St, Unit 2");
  });

  it("accepts a city and state alone, with no street", () => {
    expect(parseUsAddress("San Francisco, CA, USA")).toEqual({
      addressLine1: null,
      city: "San Francisco",
      state: "CA",
      postalCode: null,
    });
    expect(parseUsAddress("Appleton, ME 04862")).toEqual({
      addressLine1: null,
      city: "Appleton",
      state: "ME",
      postalCode: "04862",
    });
  });

  it("returns null when there is no city and state to read", () => {
    expect(parseUsAddress("Appleton")).toBeNull();
    expect(parseUsAddress("Main St and Elm St")).toBeNull();
    expect(parseUsAddress("Lot 4, Somewhere, XX 12345")).toBeNull();
    expect(parseUsAddress("Somewhere, XX")).toBeNull();
    expect(parseUsAddress("")).toBeNull();
  });
});
