import { describe, expect, it } from "vitest";

import { findOverlap } from "@/features/orders/conflicts";
import type { ScheduleBooking } from "@/components/schedule/schedule-types";

function booking(id: string, pumpId: string, startHour: number, durationHours: number): ScheduleBooking {
  return {
    id,
    orderNumber: id,
    pumpId,
    customerName: "Customer",
    jobSiteName: "Site",
    startHour,
    durationHours,
    pourHour: startHour,
    pourHours: durationHours,
    travelMinutes: 0,
    volumeYards: 10,
    status: "travel",
  };
}

const bookings = [booking("a", "p1", 8, 2), booking("b", "p2", 8, 2)];

describe("findOverlap", () => {
  it("finds a booking that overlaps on the same pump", () => {
    expect(findOverlap(bookings, { pumpId: "p1", startHour: 9, durationHours: 2 })?.id).toBe("a");
  });

  it("ignores other pumps", () => {
    expect(findOverlap(bookings, { pumpId: "p3", startHour: 9, durationHours: 2 })).toBeNull();
  });

  it("treats back-to-back jobs as free", () => {
    expect(findOverlap(bookings, { pumpId: "p1", startHour: 10, durationHours: 1 })).toBeNull();
    expect(findOverlap(bookings, { pumpId: "p1", startHour: 7, durationHours: 1 })).toBeNull();
  });

  it("never conflicts with the order being moved", () => {
    expect(findOverlap(bookings, { pumpId: "p1", startHour: 8, durationHours: 2, ignoreId: "a" })).toBeNull();
  });
});
