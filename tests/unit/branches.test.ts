import { describe, expect, it } from "vitest";

import { monogramOf, suggestBranchCode } from "@/features/branches/code";
import { createBranchSchema, updateBranchSchema } from "@/features/branches/schemas";

describe("suggestBranchCode", () => {
  it("uses initials for a name of several words", () => {
    expect(suggestBranchCode("Warren HQ", [])).toBe("WH");
    expect(suggestBranchCode("Midcoast South Yard", [])).toBe("MSY");
  });

  it("uses the first letters of a single word", () => {
    expect(suggestBranchCode("Portland", [])).toBe("POR");
  });

  it("adds a number when the code is taken, in any case", () => {
    expect(suggestBranchCode("Portland", ["POR"])).toBe("POR2");
    expect(suggestBranchCode("Portland", ["por", "POR2"])).toBe("POR3");
  });

  it("falls back to BR for a name with no letters", () => {
    expect(suggestBranchCode("!!", [])).toBe("BR");
  });
});

describe("monogramOf", () => {
  it("takes the first letters of the first two words", () => {
    expect(monogramOf("Midcoast Concrete Pumping")).toBe("MC");
    expect(monogramOf("Acme")).toBe("AC");
  });
});

const valid = {
  name: "Warren HQ",
  code: "",
  streetAddress: "50 Niilo Hill Rd",
  city: "Warren",
  state: "me",
  zipCode: "04864",
  phone: "",
  isHq: true,
};

describe("branch schemas", () => {
  it("cleans the values", () => {
    const parsed = createBranchSchema.parse(valid);
    expect(parsed.code).toBeNull();
    expect(parsed.state).toBe("ME");
    expect(parsed.phone).toBeNull();
  });

  it("needs a town and a state", () => {
    expect(createBranchSchema.safeParse({ ...valid, city: " " }).success).toBe(false);
    expect(createBranchSchema.safeParse({ ...valid, state: "" }).success).toBe(false);
  });

  it("rejects a bad code, ZIP or phone", () => {
    expect(createBranchSchema.safeParse({ ...valid, code: "WAR-1" }).success).toBe(false);
    expect(createBranchSchema.safeParse({ ...valid, zipCode: "4864" }).success).toBe(false);
    expect(createBranchSchema.safeParse({ ...valid, phone: "12" }).success).toBe(false);
  });

  it("keeps the main branch active", () => {
    const id = "6f0b1c2d-3e4f-4a5b-8c6d-7e8f9a0b1c2d";
    expect(updateBranchSchema.safeParse({ ...valid, id, isActive: false }).success).toBe(false);
    expect(updateBranchSchema.safeParse({ ...valid, id, isHq: false, isActive: false }).success).toBe(true);
  });
});
