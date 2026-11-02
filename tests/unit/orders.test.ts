import { describe, expect, it } from "vitest";

import {
  clockFromHour,
  localHour,
  parseClock,
  shiftClock,
  toBooking,
  toFullOrder,
  toInstant,
  toOrderItem,
  type HydratedJob,
  type JobRow,
} from "@/features/orders/mappers";
import { bookOrderSchema, cancelOrderSchema, updateOrderSchema } from "@/features/orders/schemas";

const ID = "e1000000-0000-4000-8000-000000000101";

function job(overrides: Partial<JobRow> = {}): JobRow {
  return {
    id: "11111111-1111-4111-8111-111111111111",
    company_id: "a0000000-0000-4000-8000-000000000001",
    job_number: "ORD-1001",
    customer_id: ID,
    job_site_id: null,
    site_label: "Rockland",
    job_name: null,
    pour_type: "Footings",
    supplier_name: null,
    scheduled_start: "2026-09-12T11:00:00Z",
    scheduled_end: "2026-09-12T14:00:00Z",
    arrive_by: "2026-09-12T10:30:00Z",
    timezone: "America/New_York",
    service_date: "2026-09-12",
    travel_minutes: 0,
    prep_minutes: 30,
    pump_minutes: 120,
    cleanup_minutes: 30,
    estimated_yards: 60,
    min_pump_size: "34 m",
    lines_on_site: false,
    purchase_order_number: null,
    collect_on_delivery: false,
    customer_notes: null,
    site_instructions: null,
    internal_note: null,
    billing_service: null,
    max_pump_size: null,
    extra_items: [],
    priority: "normal",
    booking_status: "pending",
    dispatch_status: "unassigned",
    field_status: "scheduled",
    confirmed_at: null,
    dispatched_at: null,
    cancelled_at: null,
    cancellation_reason: null,
    completed_at: null,
    version: 1,
    created_by: null,
    updated_by: null,
    created_at: "2026-09-01T00:00:00Z",
    updated_at: "2026-09-01T00:00:00Z",
    ...overrides,
  };
}

function hydrated(overrides: Partial<JobRow> = {}, extra: Partial<HydratedJob> = {}): HydratedJob {
  return {
    job: job(overrides),
    customerName: "Accurate Concrete",
    contact: null,
    pump: null,
    operator: null,
    secondOperator: null,
    siteAddress: "",
    ...extra,
  };
}

describe("clock helpers", () => {
  it("reads 12-hour times", () => {
    expect(parseClock("7:30 AM")).toEqual({ hour: 7, minute: 30 });
    expect(parseClock("12:15 AM")).toEqual({ hour: 0, minute: 15 });
    expect(parseClock("12:05 PM")).toEqual({ hour: 12, minute: 5 });
    expect(parseClock("1:00 pm")).toEqual({ hour: 13, minute: 0 });
    expect(() => parseClock("noon")).toThrow();
  });

  it("moves times and wraps past midnight", () => {
    expect(shiftClock("7:00 AM", 150)).toBe("9:30 AM");
    expect(shiftClock("12:00 AM", -30)).toBe("11:30 PM");
    expect(shiftClock("11:00 PM", 120)).toBe("1:00 AM");
    expect(clockFromHour(7.5)).toBe("7:30 AM");
    expect(clockFromHour(14)).toBe("2:00 PM");
  });

  it("builds instants in the company timezone, summer and winter", () => {
    expect(toInstant("2026-09-12", "7:00 AM", "America/New_York").toISOString()).toBe("2026-09-12T11:00:00.000Z");
    expect(toInstant("2026-12-01", "7:00 AM", "America/New_York").toISOString()).toBe("2026-12-01T12:00:00.000Z");
  });

  it("reads the local hour of an instant", () => {
    expect(localHour("2026-09-12T11:30:00Z", "America/New_York")).toBe(7.5);
    expect(localHour("2026-09-13T02:00:00Z", "America/New_York")).toBe(22);
  });
});

describe("order view models", () => {
  it("shows Pending, Inspection Pending, Confirmed, Turned In, Reviewed and Cancelled", () => {
    expect(toOrderItem(hydrated()).status).toBe("Pending");
    expect(toOrderItem(hydrated({ booking_status: "inspection_pending" })).status).toBe("Inspection Pending");
    expect(toOrderItem(hydrated({ booking_status: "confirmed" })).status).toBe("Confirmed");
    expect(toOrderItem(hydrated({ booking_status: "turned_in" })).status).toBe("Turned In");
    expect(toOrderItem(hydrated({ booking_status: "reviewed" })).status).toBe("Reviewed");
    expect(toOrderItem(hydrated({ booking_status: "cancelled" })).status).toBe("Cancelled");
  });

  it("marks an order without a pump as unassigned", () => {
    const item = toOrderItem(hydrated());
    expect(item.isUnassigned).toBe(true);
    expect(item.pump).toBe("Unassigned");
    expect(item.operator).toBe("Operator needed");
    const assigned = toOrderItem(
      hydrated({}, { pump: { id: "p1", code: "01 · 34M", model: "Putzmeister 34Z" }, operator: { id: "o1", name: "Rob Black", phone: "(207) 555-0168" } }),
    );
    expect(assigned.isUnassigned).toBe(false);
    expect(assigned.pump).toBe("01 · 34M");
    expect(assigned.operator).toBe("Rob Black");
  });

  it("formats the order page in the order's timezone", () => {
    const order = toFullOrder(hydrated());
    expect(order.serviceDate).toBe("Sat, Sep 12, 2026");
    expect(order.serviceDateIso).toBe("2026-09-12");
    expect(order.pourTime).toBe("7:00 AM");
    expect(order.arriveBy).toBe("6:30 AM");
    expect(order.estimatedEnd).toBe("10:00 AM");
    expect(order.customerContact).toBe("");
    expect(order.assignedOperator).toBe("Operator needed");
  });

  it("puts a booking on the grid by local hour and length", () => {
    const booking = toBooking(hydrated({}, { operator: { id: "o1", name: "Rob Black", phone: "" } }));
    // The block runs from prep (6:30 AM) to the end of clean-up (10:00 AM); the pour is 7:00 AM for 2.5 hours.
    expect(booking.startHour).toBe(6.5);
    expect(booking.durationHours).toBe(3.5);
    expect(booking.pourHour).toBe(7);
    expect(booking.pourHours).toBe(2.5);
    expect(booking.dispatchStatus).toBe("draft");
    expect(toBooking(hydrated({ dispatch_status: "dispatched" }, { operator: { id: "o1", name: "Rob", phone: "" } })).dispatchStatus).toBe("dispatched");
    expect(toBooking(hydrated()).dispatchStatus).toBe("unassigned");
  });
});

const valid = {
  customerId: ID,
  jobSiteId: null,
  siteLabel: "Rockland",
  jobName: "",
  pourType: "Footings",
  supplierName: "",
  date: "2026-09-12",
  pourTime: "7:00 AM",
  arriveBy: "6:30 AM",
  estimatedFinish: "10:00 AM",
  prepMinutes: 30,
  pumpMinutes: 120,
  cleanupMinutes: 30,
  travelMinutes: 0,
  estimatedYards: 60,
  minPumpSize: "34 m",
  linesOnSite: false,
  purchaseOrder: "",
  collectOnDelivery: false,
  customerNotes: "",
  siteInstructions: "",
  internalNote: "",
  billingService: "",
  bookingStatus: "pending" as const,
  contactId: null,
  equipmentId: null,
  employeeId: null,
};

describe("order validation", () => {
  it("accepts a complete order and turns empty text into null", () => {
    const parsed = bookOrderSchema.parse(valid);
    expect(parsed.jobName).toBeNull();
    expect(parsed.purchaseOrder).toBeNull();
    expect(parsed.siteLabel).toBe("Rockland");
  });

  it("needs a town, a real time and a sensible volume", () => {
    expect(bookOrderSchema.safeParse({ ...valid, siteLabel: " " }).success).toBe(false);
    expect(bookOrderSchema.safeParse({ ...valid, pourTime: "25:00" }).success).toBe(false);
    expect(bookOrderSchema.safeParse({ ...valid, pourTime: "7 AM" }).success).toBe(false);
    expect(bookOrderSchema.safeParse({ ...valid, estimatedYards: 0 }).success).toBe(false);
    expect(bookOrderSchema.safeParse({ ...valid, estimatedYards: 10001 }).success).toBe(false);
    expect(bookOrderSchema.safeParse({ ...valid, date: "12/09/2026" }).success).toBe(false);
  });

  it("accepts the short payload the quick booking form sends", () => {
    const quick = bookOrderSchema.safeParse({
      customerId: ID,
      jobSiteId: null,
      siteLabel: "Searsport",
      pourType: "Foundation",
      supplierName: "",
      estimatedYards: 40,
      minPumpSize: "",
      equipmentId: null,
      employeeId: null,
      date: "2026-09-12",
      pourTime: "2:00 PM",
      arriveBy: "1:30 PM",
      estimatedFinish: "4:30 PM",
      prepMinutes: 30,
      pumpMinutes: 120,
      cleanupMinutes: 30,
      travelMinutes: 0,
      linesOnSite: false,
      collectOnDelivery: false,
      bookingStatus: "pending",
      contactId: null,
    });
    expect(quick.success).toBe(true);
  });

  it("only allows new orders to be pending or confirmed", () => {
    expect(bookOrderSchema.safeParse({ ...valid, bookingStatus: "cancelled" }).success).toBe(false);
  });

  it("lets an update send only what changed", () => {
    expect(updateOrderSchema.safeParse({ id: ID, version: 1 }).success).toBe(true);
    expect(updateOrderSchema.safeParse({ id: ID, version: 1, dispatch: true }).success).toBe(true);
    expect(updateOrderSchema.safeParse({ id: ID, version: 0 }).success).toBe(false);
    expect(updateOrderSchema.safeParse({ id: "x", version: 1 }).success).toBe(false);
    expect(updateOrderSchema.parse({ id: ID, version: 2, jobName: "" }).jobName).toBeNull();
  });

  it("cancel needs the version and keeps the reason optional", () => {
    expect(cancelOrderSchema.safeParse({ id: ID, version: 3 }).success).toBe(true);
    expect(cancelOrderSchema.safeParse({ id: ID }).success).toBe(false);
  });
});
