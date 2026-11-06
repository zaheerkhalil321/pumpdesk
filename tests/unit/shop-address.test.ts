import { describe, expect, it } from "vitest";

import { routableAddress } from "@/features/company/shop-address";

const empty = { address_line_1: null, city: null, state: null, postal_code: null };

describe("routableAddress", () => {
  it("joins street, town, state and ZIP into one line", () => {
    expect(
      routableAddress({ address_line_1: "50 Niilo Hill Rd", city: "Warren", state: "ME", postal_code: "04864" }),
    ).toBe("50 Niilo Hill Rd, Warren, ME 04864");
  });

  it("skips a branch saved with only its state", () => {
    expect(routableAddress({ ...empty, state: "ME" })).toBeNull();
    expect(routableAddress({ ...empty, state: "ME", postal_code: "04864" })).toBeNull();
  });

  it("accepts a town without a street", () => {
    expect(routableAddress({ ...empty, city: "Warren", state: "ME" })).toBe("Warren, ME");
  });

  it("ignores blank text and missing rows", () => {
    expect(routableAddress({ ...empty, address_line_1: "  ", city: " ", state: "ME" })).toBeNull();
    expect(routableAddress(null)).toBeNull();
  });
});
