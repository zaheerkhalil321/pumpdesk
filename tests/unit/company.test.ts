import { describe, expect, it } from "vitest";

import { updateCompanyProfileSchema } from "@/features/company/schemas";

const valid = {
  companyName: "Midcoast Concrete Pumping",
  legalBusinessName: "Midcoast Concrete Pumping LLC",
  phone: "(207) 555-0100",
  email: "Office@Midcoast.example",
  website: "midcoastpumping.com",
  streetAddress: "54 Montgomery Ave",
  suiteUnit: "",
  city: "Warren",
  state: "me",
  zipCode: "04864",
  useAddressOnInvoices: true,
};

describe("updateCompanyProfileSchema", () => {
  it("normalises phone, email, state and blank fields", () => {
    const parsed = updateCompanyProfileSchema.parse(valid);
    expect(parsed.phone).toBe("+12075550100");
    expect(parsed.email).toBe("office@midcoast.example");
    expect(parsed.state).toBe("ME");
    expect(parsed.suiteUnit).toBeNull();
  });

  it("needs the company and legal names", () => {
    expect(updateCompanyProfileSchema.safeParse({ ...valid, companyName: " " }).success).toBe(false);
    expect(updateCompanyProfileSchema.safeParse({ ...valid, legalBusinessName: "" }).success).toBe(false);
  });

  it("rejects a bad phone, email or ZIP code but lets them be blank", () => {
    expect(updateCompanyProfileSchema.safeParse({ ...valid, phone: "555" }).success).toBe(false);
    expect(updateCompanyProfileSchema.safeParse({ ...valid, email: "nope" }).success).toBe(false);
    expect(updateCompanyProfileSchema.safeParse({ ...valid, zipCode: "ABCDE" }).success).toBe(false);
    expect(updateCompanyProfileSchema.safeParse({ ...valid, phone: "", email: "", zipCode: "", state: "" }).success).toBe(true);
  });
});
