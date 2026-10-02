"use client";

import { useState } from "react";
import { ScheduleHeader } from "@/components/schedule/schedule-header";
import { ScheduleToolbar } from "@/components/schedule/schedule-toolbar";
import { TimelineGrid } from "@/components/schedule/timeline-grid";
import { ScheduleEmptyState } from "@/components/schedule/schedule-empty-state";
import { UnassignedJobsDrawer } from "@/components/schedule/unassigned-jobs-drawer";
import { ScheduleLegend } from "@/components/schedule/schedule-legend";
import { NewOrderModal } from "@/components/schedule/new-order-modal";
import { OrderDossierModal } from "@/components/schedule/order-dossier-popover";
import {
  PumpLane,
  ScheduleBooking,
  ScheduleViewMode,
} from "@/components/schedule/schedule-types";
import {
  useBookings,
  useUnassignedJobs,
  addOrUpdateBooking,
  addOrUpdateUnassignedJob,
  deleteStoredBooking,
} from "@/lib/orders-store";
import { toast } from "sonner";
import { AlertTriangle, X } from "lucide-react";

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

  // Schedule Bookings State backed by persistent orders store (reactive, SSR safe)
  const bookings = useBookings();

  // Quick Booking Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerInitialPump, setDrawerInitialPump] = useState<string | undefined>();
  const [drawerInitialHour, setDrawerInitialHour] = useState<number | undefined>();
  const [editingBooking, setEditingBooking] = useState<ScheduleBooking | null>(null);

  // Unassigned jobs awaiting pump dispatch backed by persistent store (reactive, SSR safe)
  const unassignedJobs = useUnassignedJobs();
  const [showAlertBanner, setShowAlertBanner] = useState(true);

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
    setEditingBooking(null);
    setDrawerInitialPump(pumpId || INITIAL_PUMPS[0]?.id);
    setDrawerInitialHour(hour || 14);
    setIsDrawerOpen(true);
  };

  const handleAddBooking = (newBooking: ScheduleBooking) => {
    addOrUpdateBooking(newBooking);
  };

  const handleAddUnassignedJob = (job: ScheduleBooking) => {
    addOrUpdateUnassignedJob(job);
  };

  const handleAssignJobFromDrawer = (job: ScheduleBooking) => {
    setEditingBooking(job);
    setDrawerInitialPump(INITIAL_PUMPS[0]?.id);
    setDrawerInitialHour(job.startHour);
    setIsDrawerOpen(true);
  };

  const handleUpdateBooking = (updated: ScheduleBooking) => {
    addOrUpdateBooking(updated);
  };

  const handleDeleteBooking = (bookingId: string) => {
    deleteStoredBooking(bookingId);
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

    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking) return;

    toast.success("Job Rescheduled (Drag & Drop)", {
      description: `${booking.customerName} moved to ${targetPump?.code || "Pump"} at ${hourLabel}`,
    });
    const updatedBooking: ScheduleBooking = {
      ...booking,
      pumpId: targetPumpId,
      startHour: targetStartHour,
    };
    addOrUpdateBooking(updatedBooking);
  };

  const [selectedDossierBooking, setSelectedDossierBooking] =
    useState<ScheduleBooking | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  const handleBookingClick = (booking: ScheduleBooking) => {
    setSelectedDossierBooking(booking);
    setIsDossierOpen(true);
  };

  const handleQuickEditFromDossier = (booking: ScheduleBooking) => {
    setEditingBooking(booking);
    setIsDrawerOpen(true);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-4">
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

      {/* ── Alert Banner: Jobs needing pump assignment (Screenshot 3) ── */}
      {showAlertBanner && unassignedJobs.length > 0 && (
        <div className="bg-amber-50/90 border border-amber-200/90 rounded-xl px-4 py-2.5 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span className="text-xs sm:text-sm font-semibold text-amber-950">
              {unassignedJobs.length}{" "}
              {unassignedJobs.length === 1 ? "job needs" : "jobs need"} a pump assignment
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => handleAssignJobFromDrawer(unassignedJobs[0])}
              className="h-7 px-3 bg-white border border-slate-200/90 rounded-md text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            >
              Review
            </button>
            <button
              type="button"
              onClick={() => setShowAlertBanner(false)}
              className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

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
        unassignedJobs={unassignedJobs}
        onAssignJob={handleAssignJobFromDrawer}
      />

      {/* ── 6. Bottom Helper & Legend Bar ── */}
      <ScheduleLegend />

      {/* ── 7. New Order / Booking Modal (Screenshot 1: V1 + V2 Quick Dispatch Flow) ── */}
      <NewOrderModal
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        pumps={INITIAL_PUMPS}
        initialPumpId={drawerInitialPump}
        initialHour={drawerInitialHour}
        editingBooking={editingBooking}
        onAddBooking={handleAddBooking}
        onAddUnassignedJob={handleAddUnassignedJob}
        onUpdateBooking={handleUpdateBooking}
        onDeleteBooking={handleDeleteBooking}
      />

      {/* ── 8. Order Dossier Popover (Screenshot 3) ── */}
      <OrderDossierModal
        isOpen={isDossierOpen}
        onOpenChange={setIsDossierOpen}
        booking={selectedDossierBooking}
        pumps={INITIAL_PUMPS}
        onQuickEdit={handleQuickEditFromDossier}
      />
    </div>
  );
}