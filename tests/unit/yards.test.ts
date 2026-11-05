import { describe, expect, it } from "vitest";

import { createYardSchema, updateYardSchema } from "@/features/yards/schemas";

describe("yard schemas", () => {
  it("trims the name and address", () => {
    const yard = createYardSchema.parse({ name: "  Yard #1 ", address: " 54 Montgomery Ave, Warren, ME 04864 " });
    expect(yard).toEqual({ name: "Yard #1", address: "54 Montgomery Ave, Warren, ME 04864" });
  });

  it("needs a name and a full address", () => {
    expect(createYardSchema.safeParse({ name: "", address: "54 Montgomery Ave" }).success).toBe(false);
    expect(createYardSchema.safeParse({ name: "Yard #1", address: "54" }).success).toBe(false);
  });

  it("takes an id and an active flag when updating", () => {
    const id = "e1000000-0000-4000-8000-000000000101";
    expect(updateYardSchema.safeParse({ id, name: "Yard #2", address: "1225 Burkettville Road", isActive: false }).success).toBe(true);
    expect(updateYardSchema.safeParse({ id: "x", name: "Yard #2", address: "1225 Burkettville Road", isActive: true }).success).toBe(false);
  });
});
