import { describe, it, expect } from "vitest";

function calculateTicketTotal({
  hourlyRate,
  hoursWorked,
  minimumHours,
  travelRate,
  travelHours,
  volumePumped,
  volumeRate,
}: {
  hourlyRate: number;
  hoursWorked: number;
  minimumHours: number;
  travelRate: number;
  travelHours: number;
  volumePumped: number;
  volumeRate: number;
}) {
  const billableRigHours = Math.max(hoursWorked, minimumHours);
  const rigCharge = billableRigHours * hourlyRate;
  const travelCharge = travelHours * travelRate;
  const volumeCharge = volumePumped * volumeRate;

  return rigCharge + travelCharge + volumeCharge;
}

describe("Concrete Pumping Rate Engine", () => {
  it("enforces 4.0 hour minimum when job duration is only 2 hours", () => {
    const total = calculateTicketTotal({
      hourlyRate: 195,
      hoursWorked: 2.0, // only 2 hours
      minimumHours: 4.0, // 4 hours min
      travelRate: 110,
      travelHours: 1.5,
      volumePumped: 100,
      volumeRate: 0.75,
    });

    // 4 * 195 = 780
    // 1.5 * 110 = 165
    // 100 * 0.75 = 75
    // Total = 780 + 165 + 75 = 1020
    expect(total).toBe(1020);
  });
});
