import { describe, expect, it } from "vitest";

import { formatHourlyRate, formatMinHours, getPumpDisplayName } from "@/features/fleet/format";
import {
  daysUntil,
  mapOperator,
  mapPump,
  type EmployeeRow,
  type EquipmentRow,
} from "@/features/fleet/mappers";
import { createOperatorSchema, createPumpSchema } from "@/features/fleet/schemas";

const TODAY = "2026-10-21";

const operatorRow: EmployeeRow = {
  id: "e-1",
  branch_id: "b-1",
  first_name: "Rob",
  last_name: "Black",
  email: "rob@midcoast.example",
  phone: "+12075550168",
  status: "active",
  is_operator: true,
  job_title: "Lead operator",
  cdl_expires_on: "2026-11-10",
  medical_cert_expires_on: null,
};

const pumpRow: EquipmentRow = {
  id: "p-1",
  branch_id: null,
  equipment_number: "01",
  type: "boom_pump",
  status: "available",
  make: "Putzmeister",
  model: "34Z",
  model_year: 2023,
  boom_length_m: 34,
  horizontal_reach_ft: 111,
  hourly_rate_override: 195,
  min_hours_override: 4,
  default_operator_id: "e-1",
  next_inspection_due: "2026-10-28",
  notes: null,
};

describe("format helpers", () => {
  it("builds the schedule display name", () => {
    expect(getPumpDisplayName({ unitNumber: "01", boomSize: 34 })).toBe("01 · 34M");
    expect(getPumpDisplayName({ unitNumber: "04", type: "line_pump", boomLength: "Ground Line (500ft)" })).toBe("04 · Line");
  });
  it("formats rate and minimum hours", () => {
    expect(formatHourlyRate(195)).toBe("$195 / hr");
    expect(formatMinHours(4)).toBe("4.0 hrs");
  });
});

describe("daysUntil", () => {
  it("counts whole days, negative when past", () => {
    expect(daysUntil("2026-10-28", TODAY)).toBe(7);
    expect(daysUntil("2026-10-15", TODAY)).toBe(-6);
    expect(daysUntil(TODAY, TODAY)).toBe(0);
  });
});

describe("mapPump", () => {
  it("maps a boom pump with its default operator and a due-soon inspection", () => {
    const pump = mapPump(pumpRow, new Map([["e-1", operatorRow]]), TODAY);
    expect(pump.typeLabel).toBe("Boom pump · 34M");
    expect(pump.boomLength).toBe("34M (111 ft)");
    expect(pump.defaultOperator.name).toBe("Rob Black");
    expect(pump.nextInspection.date).toBe("Oct 28, 2026");
    expect(pump.nextInspection.iso).toBe("2026-10-28");
    expect(pump.nextInspection.dueSoon).toBe(true);
    expect(pump.status).toBe("available");
    expect(pump.hourlyRate).toBe(195);
  });

  it("maps a line pump in maintenance without an operator", () => {
    const pump = mapPump(
      { ...pumpRow, type: "line_pump", boom_length_m: null, horizontal_reach_ft: 500, status: "maintenance", default_operator_id: null, notes: "Hose swap", next_inspection_due: null, hourly_rate_override: null },
      new Map(),
      TODAY,
    );
    expect(pump.typeLabel).toBe("Line pump");
    expect(pump.boomLength).toBe("Ground Line (500ft)");
    expect(pump.defaultOperator.name).toBe("Unassigned");
    expect(pump.inMaintenance).toBe(true);
    expect(pump.maintenanceNote).toBe("Hose swap");
    expect(pump.nextInspection.dueSoon).toBe(false);
    expect(pump.hourlyRate).toBe("");
  });
});

describe("mapOperator", () => {
  it("formats the phone, branch and a CDL alert", () => {
    const op = mapOperator(operatorRow, new Map([["b-1", "Warren"]]), "01 · 34M", TODAY);
    expect(op.name).toBe("Rob Black");
    expect(op.phone).toBe("(207) 555-0168");
    expect(op.branch).toBe("Warren");
    expect(op.defaultPump).toBe("01 · 34M");
    expect(op.status).toBe("Active");
    expect(op.credentialAlert?.title).toBe("CDL expires in 20 days");
  });

  it("flags an expired credential and ignores far-off ones", () => {
    const expired = mapOperator({ ...operatorRow, cdl_expires_on: "2026-10-15" }, new Map(), undefined, TODAY);
    expect(expired.credentialAlert?.title).toBe("CDL expired 6 days ago");
    const fine = mapOperator({ ...operatorRow, cdl_expires_on: "2027-06-01" }, new Map(), undefined, TODAY);
    expect(fine.credentialAlert).toBeNull();
    expect(fine.defaultPump).toBe("None");
  });

  it("shows inactive for any non-active status", () => {
    expect(mapOperator({ ...operatorRow, status: "leave" }, new Map(), undefined, TODAY).status).toBe("Inactive");
  });
});

describe("schemas", () => {
  const validPump = {
    unitNumber: "05", make: "", model: "", year: 2024, type: "boom_pump" as const, boomSize: 38,
    horizontalReach: 124, hourlyRate: 195, minHours: 4, defaultOperatorId: null,
    status: "available" as const, maintenanceNote: "", inspectionDate: "",
  };

  it("accepts a valid pump and turns blanks into null", () => {
    const parsed = createPumpSchema.parse(validPump);
    expect(parsed.make).toBeNull();
    expect(parsed.inspectionDate).toBeNull();
  });
  it("rejects out-of-range numbers and a boom pump without a boom size", () => {
    expect(createPumpSchema.safeParse({ ...validPump, boomSize: 150 }).success).toBe(false);
    expect(createPumpSchema.safeParse({ ...validPump, hourlyRate: 6000 }).success).toBe(false);
    expect(createPumpSchema.safeParse({ ...validPump, boomSize: null }).success).toBe(false);
    expect(createPumpSchema.safeParse({ ...validPump, type: "line_pump", boomSize: null }).success).toBe(true);
  });
  it("normalises an operator phone to E.164 and rejects a bad one", () => {
    const base = { firstName: "A", lastName: "B", role: "", email: "", branchId: null, cdlExpiresOn: "", medicalCertExpiresOn: "", defaultPumpId: null };
    expect(createOperatorSchema.parse({ ...base, phone: "(207) 555-0168" }).phone).toBe("+12075550168");
    expect(createOperatorSchema.safeParse({ ...base, phone: "555" }).success).toBe(false);
  });
});
