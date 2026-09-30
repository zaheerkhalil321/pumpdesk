"use client";

import { useState } from "react";
import { ScheduleHeader } from "@/components/schedule/schedule-header";
import { ScheduleToolbar } from "@/components/schedule/schedule-toolbar";
import { TimelineGrid } from "@/components/schedule/timeline-grid";
import { ScheduleEmptyState } from "@/components/schedule/schedule-empty-state";
import { UnassignedJobsDrawer } from "@/components/schedule/unassigned-jobs-drawer";
import { ScheduleLegend } from "@/components/schedule/schedule-legend";
import { QuickBookingDrawer } from "@/components/schedule/quick-booking-drawer";
import {
  PumpLane,
  ScheduleBooking,
  ScheduleViewMode,
} from "@/components/schedule/schedule-types";
import { toast } from "sonner";

// Midcoast Concrete Pumping Fleet Roster matching specification
const INITIAL_PUMPS: PumpLane[] = [
  {
    id: "01-34m",
    code: "01 · 34M",
    name: "34M Putzmeister Boom",
    boomLength: "34 Meter",
    operator: "Rob Black",
    status: "active",
  },
  {
    id: "02-28m",
    code: "02 · 28M",
    name: "28M Putzmeister Boom",
    boomLength: "28 Meter",
    operator: null, // Displays 'No default operator'
    status: "active",
  },
  {
    id: "03-47m",
    code: "03 · 47M",
    name: "47M Schwing Boom",
    boomLength: "47 Meter",
    operator: "Dave Smith",
    status: "active",
  },
  {
    id: "04-line-pump",
    code: "04 · Line pump",
    name: "Trailer Line Pump",
    boomLength: "2.5 Inch Line",
    operator: "Tony Perez",
    status: "active",
  },
];

export default function SchedulePage() {
  // Target initial date: Saturday, September 12, 2026 per spec
  const [currentDate, setCurrentDate] = useState<Date>(
    new Date(2026, 8, 12, 12, 0, 0)
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [viewMode, setViewMode] = useState<ScheduleViewMode>("day");
  const [selectedPumpId, setSelectedPumpId] = useState("all");
  const [selectedOperator, setSelectedOperator] = useState("all");

  // Schedule Bookings State (Starts empty on Sep 12, 2026 as per reference design)
  const [bookings, setBookings] = useState<ScheduleBooking[]>([]);

  // Quick Booking Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerInitialPump, setDrawerInitialPump] = useState<string | undefined>();
  const [drawerInitialHour, setDrawerInitialHour] = useState<number | undefined>();

  // Filtered pumps based on dropdown selections
  const filteredPumps = INITIAL_PUMPS.filter((pump) => {
    if (selectedPumpId !== "all" && pump.id !== selectedPumpId) return false;
    if (selectedOperator !== "all" && pump.operator !== selectedOperator)
      return false;
    return true;
  });

  // Filtered bookings based on search query
  const filteredBookings = bookings.filter((b) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      b.customerName.toLowerCase().includes(query) ||
      b.jobSiteName.toLowerCase().includes(query) ||
      b.orderNumber.toLowerCase().includes(query)
    );
  });

  const handleOpenNewBooking = (pumpId?: string, hour?: number) => {
    setDrawerInitialPump(pumpId || INITIAL_PUMPS[0]?.id);
    setDrawerInitialHour(hour || 7);
    setIsDrawerOpen(true);
  };

  const handleAddBooking = (newBooking: ScheduleBooking) => {
    setBookings((prev) => [...prev, newBooking]);
  };

  const handleRescheduleBooking = (
    bookingId: string,
    targetPumpId: string,
    targetStartHour: number
  ) => {
    const targetPump = INITIAL_PUMPS.find((p) => p.id === targetPumpId);
    const hourLabel =
      targetStartHour <= 12
        ? `${targetStartHour}:00 AM`
        : `${targetStartHour - 12}:00 PM`;

    setBookings((prev) =>
      prev.map((b) => {
        if (b.id === bookingId) {
          toast.success("Job Rescheduled (Drag & Drop)", {
            description: `${b.customerName} moved to ${targetPump?.code || "Pump"} at ${hourLabel}`,
          });
          return {
            ...b,
            pumpId: targetPumpId,
            startHour: targetStartHour,
          };
        }
        return b;
      })
    );
  };

  const handleBookingClick = (booking: ScheduleBooking) => {
    toast.info(`Order ${booking.orderNumber}`, {
      description: `${booking.customerName} at ${booking.jobSiteName} (${booking.volumeYards} yd³ • ${booking.durationHours}h)`,
    });
  };

  return (
    <div className="p-4 sm:p-6 lg:p-7 max-w-7xl mx-auto space-y-4">
      {/* ── 1. Top Header (Title, Global Search, + New booking) ── */}
      <ScheduleHeader
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onNewBookingClick={() => handleOpenNewBooking()}
      />

      {/* ── 2. Toolbar (Date navigator, View toggle, Filter dropdowns, V2 Expand) ── */}
      <ScheduleToolbar
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        bookingCount={filteredBookings.length}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        pumps={INITIAL_PUMPS}
        selectedPumpId={selectedPumpId}
        onSelectPump={setSelectedPumpId}
        selectedOperator={selectedOperator}
        onSelectOperator={setSelectedOperator}
      />

      {/* ── 3. Gantt Timeline Grid (5 AM - 5 PM, 4 Rigs, Drag & Drop + Multi-Hour Spanning) ── */}
      <TimelineGrid
        pumps={filteredPumps}
        bookings={filteredBookings}
        onSlotClick={(pumpId, hour) => handleOpenNewBooking(pumpId, hour)}
        onBookingClick={handleBookingClick}
        onRescheduleBooking={handleRescheduleBooking}
      />

      {/* ── 4. Empty State Card (Visible when schedule is clear for the day) ── */}
      {filteredBookings.length === 0 && (
        <ScheduleEmptyState onNewBookingClick={() => handleOpenNewBooking()} />
      )}

      {/* ── 5. Unassigned Jobs Accordion ── */}
      <UnassignedJobsDrawer
        unassignedJobs={[]}
        onAssignJob={(job) => handleOpenNewBooking(undefined, job.startHour)}
      />

      {/* ── 6. Bottom Helper & Legend Bar ── */}
      <ScheduleLegend />

      {/* ── 7. Quick Order Booking Drawer (15-second dispatcher flow) ── */}
      <QuickBookingDrawer
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        pumps={INITIAL_PUMPS}
        initialPumpId={drawerInitialPump}
        initialHour={drawerInitialHour}
        onAddBooking={handleAddBooking}
      />
    </div>
  );
}