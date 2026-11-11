import { describe, expect, it } from "vitest";

import { PHONE_ERROR, phoneProblem } from "@/lib/phone";
import { formatUSPhone } from "@/lib/utils";

describe("formatUSPhone", () => {
  it("formats as the number is typed", () => {
    expect(formatUSPhone("415")).toBe("(415");
    expect(formatUSPhone("4151313")).toBe("(415) 131-3");
    expect(formatUSPhone("4151313131")).toBe("(415) 131-3131");
  });

  it("stops at 10 digits and drops a leading country code", () => {
    expect(formatUSPhone("415131313131")).toBe("(415) 131-3131");
    expect(formatUSPhone("+1 207 555 0100")).toBe("(207) 555-0100");
  });
});

describe("phoneProblem", () => {
  it("accepts an empty box or a full US number", () => {
    expect(phoneProblem("")).toBeNull();
    expect(phoneProblem("(207) 555-0100")).toBeNull();
  });

  it("flags a number that is too short or not a US number", () => {
    expect(phoneProblem("(207) 555-01")).toBe(PHONE_ERROR);
    expect(phoneProblem("(107) 555-0100")).toBe(PHONE_ERROR);
  });
});
