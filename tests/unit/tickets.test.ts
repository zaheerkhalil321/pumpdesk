import { describe, expect, it } from "vitest";

import type { TicketItem } from "@/features/tickets/types";
import {
  EMPTY_TICKET_FILTERS,
  dateRangeFor,
  filterTickets,
  hasActiveFilters,
  hoursBetween,
  ticketStateOf,
  ticketTotals,
  ticketsToCsv,
} from "@/features/tickets/utils";

function ticket(overrides: Partial<TicketItem> = {}): TicketItem {
  return {
    id: "t1",
    jobId: "j1",
    orderNumber: "ORD-1001",
    jobVersion: 3,
    serviceDate: "2026-11-18",
    timezone: "America/New_York",
    customerId: "c1",
    customerName: "Turner Construction",
    siteAddress: "24 Bay View St, Camden, ME",
    pourType: "Footings",
    operatorId: "e1",
    operatorName: "Rob Black",
    operatorPhone: "(207) 555-0100",
    pumpId: "p1",
    pumpCode: "02",
    state: "needs_review",
    arrivedAt: null,
    startedPourAt: null,
    finishedPourAt: null,
    departedAt: null,
    pumpHours: 2,
    onSiteHours: 3,
    estimatedYards: 40,
    yardsPumped: 36.5,
    hose3inFt: 50,
    hose4inFt: null,
    extras: ["Primer bag"],
    comments: "",
    signerName: "Dave",
    hasSignature: true,
    signedAt: null,
    submittedAt: "2026-11-18T15:00:00Z",
    updatedAt: "2026-11-18T15:00:00Z",
    ...overrides,
  };
}

describe("hoursBetween", () => {
  it("gives hours to two decimals", () => {
    expect(hoursBetween("2026-11-18T12:00:00Z", "2026-11-18T14:30:00Z")).toBe(2.5);
  });
  it("is null when a time is missing or the end is not after the start", () => {
    expect(hoursBetween(null, "2026-11-18T14:30:00Z")).toBeNull();
    expect(hoursBetween("2026-11-18T14:30:00Z", "2026-11-18T12:00:00Z")).toBeNull();
  });
});

describe("ticketStateOf", () => {
  it("is in progress while the ticket is a draft", () => {
    expect(ticketStateOf("draft", "reviewed")).toBe("in_progress");
  });
  it("needs review once turned in, until the order is reviewed", () => {
    expect(ticketStateOf("submitted", "turned_in")).toBe("needs_review");
    expect(ticketStateOf("submitted", "confirmed")).toBe("needs_review");
    expect(ticketStateOf("submitted", "reviewed")).toBe("reviewed");
  });
});

describe("dateRangeFor", () => {
  it("starts weeks on Monday", () => {
    // 2026-11-18 is a Wednesday.
    expect(dateRangeFor("this_week", "2026-11-18")).toEqual({ from: "2026-11-16", to: "2026-11-22" });
  });
  it("covers whole months", () => {
    expect(dateRangeFor("this_month", "2026-11-18")).toEqual({ from: "2026-11-01", to: "2026-11-30" });
    expect(dateRangeFor("last_month", "2026-01-10")).toEqual({ from: "2025-12-01", to: "2025-12-31" });
  });
  it("passes a custom range through and leaves all dates open", () => {
    expect(dateRangeFor("custom", "2026-11-18", { from: "2026-11-01", to: "" })).toEqual({ from: "2026-11-01", to: "" });
    expect(dateRangeFor("all", "2026-11-18")).toEqual({ from: "", to: "" });
  });
});

describe("filterTickets", () => {
  const list = [
    ticket(),
    ticket({ id: "t2", state: "reviewed", customerId: "c2", customerName: "Granite Co", serviceDate: "2026-10-30", pumpId: "p2", pumpCode: "05" }),
    ticket({ id: "t3", state: "in_progress", operatorId: "e2", operatorName: "Dave Smith" }),
  ];
  const ids = (filters: Partial<typeof EMPTY_TICKET_FILTERS>) =>
    filterTickets(list, { ...EMPTY_TICKET_FILTERS, ...filters }, "2026-11-18").map((t) => t.id);

  it("filters by status, customer, operator and pump", () => {
    expect(ids({ state: "needs_review" })).toEqual(["t1"]);
    expect(ids({ customerId: "c2" })).toEqual(["t2"]);
    expect(ids({ operatorId: "e2" })).toEqual(["t3"]);
    expect(ids({ pumpId: "p2" })).toEqual(["t2"]);
  });
  it("filters by date range", () => {
    expect(ids({ datePreset: "this_month" })).toEqual(["t1", "t3"]);
    expect(ids({ datePreset: "last_month" })).toEqual(["t2"]);
  });
  it("searches the order, customer, site, operator and pump", () => {
    expect(ids({ search: "granite" })).toEqual(["t2"]);
    expect(ids({ search: "dave smith" })).toEqual(["t3"]);
    expect(ids({ search: "ORD-1001" })).toEqual(["t1", "t2", "t3"]);
  });
});

describe("ticketTotals", () => {
  it("counts tickets that need review and sums turned-in yards and hours only", () => {
    const totals = ticketTotals([
      ticket(),
      ticket({ id: "t2", state: "reviewed", yardsPumped: 10, pumpHours: 1.25 }),
      ticket({ id: "t3", state: "in_progress", yardsPumped: 99, pumpHours: 9 }),
    ]);
    expect(totals).toEqual({ count: 3, needsReview: 1, yardsPumped: 46.5, pumpHours: 3.3 });
  });
});

describe("hasActiveFilters", () => {
  it("is false for the defaults and true once anything changes", () => {
    expect(hasActiveFilters(EMPTY_TICKET_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_TICKET_FILTERS, search: "x" })).toBe(true);
  });
});

describe("ticketsToCsv", () => {
  it("writes a header and quotes cells with commas", () => {
    const csv = ticketsToCsv([ticket({ comments: 'Late truck, "cold" day' })]).split("\n");
    expect(csv[0].startsWith("Date,Order,Customer")).toBe(true);
    expect(csv[1]).toContain('"24 Bay View St, Camden, ME"');
    expect(csv[1]).toContain('"Late truck, ""cold"" day"');
    expect(csv[1]).toContain("Needs review");
  });
});
