import { describe, expect, it } from "vitest";

import { findTravelClash } from "@/features/orders/travel";

const block = (id: string, pumpId: string, startHour: number, durationHours: number, travelMinutes = 30) => ({
  id,
  pumpId,
  startHour,
  durationHours,
  travelMinutes,
});

const day = [block("a", "p1", 7, 3), block("b", "p2", 7, 3)];
const slot = { pumpId: "p1", durationHours: 3, prepHours: 0.5, travelMinutes: 30 };

describe("findTravelClash", () => {
  it("is clear when there is enough time to drive between jobs", () => {
    expect(findTravelClash(day, { ...slot, startHour: 10.5 })).toBeNull();
  });

  it("flags a job that starts before the drive from the last one is done", () => {
    const clash = findTravelClash(day, { ...slot, startHour: 10.25 });
    expect(clash?.kind).toBe("previous");
    expect(clash?.gapMinutes).toBe(15);
    // Earliest block start is 10:30, so the pour (30 min prep) is 11:00.
    expect(clash?.suggestedPourHour).toBe(11);
  });

  it("flags a true overlap and suggests a pour after the travel time", () => {
    const clash = findTravelClash(day, { ...slot, startHour: 9 });
    expect(clash?.kind).toBe("previous");
    expect(clash?.gapMinutes).toBe(-60);
    expect(clash?.suggestedPourHour).toBe(11);
  });

  it("ignores other pumps and the job being edited", () => {
    expect(findTravelClash(day, { ...slot, pumpId: "p3", startHour: 8 })).toBeNull();
    expect(findTravelClash(day, { ...slot, startHour: 8, ignoreId: "a" })).toBeNull();
  });

  it("flags a job that runs into the next one, using the next job's travel time", () => {
    const clash = findTravelClash(day, { ...slot, startHour: 3.75 });
    expect(clash?.kind).toBe("next");
    expect(clash?.gapMinutes).toBe(15);
    expect(clash?.suggestedPourHour).toBeNull();
  });

  it("treats zero travel back-to-back as fine", () => {
    expect(findTravelClash(day, { ...slot, startHour: 10, travelMinutes: 0 })).toBeNull();
  });
});
