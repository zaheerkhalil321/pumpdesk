"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, parse } from "date-fns";
import { ScheduleHeader } from "@/components/schedule/schedule-header";
import { ScheduleToolbar } from "@/components/schedule/schedule-toolbar";
import { TimelineGrid } from "@/components/schedule/timeline-grid";
import { MobileRigCardView } from "@/components/schedule/mobile-rig-card-view";
import { useIsMobile } from "@/hooks/use-mobile";
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
import { updateOrder } from "@/features/orders/server/actions";
import { reportAction } from "@/lib/action-feedback";
import { toast } from "sonner";
import { CredentialAlertBanner } from "@/components/schedule/credential-alert-banner";
import type { CredentialAlertItem } from "@/features/fleet/types";
import type { OrderFormOptions } from "@/features/orders/types";
import { AlertTriangle, X, Plus } from "lucide-react";

interface ScheduleBoardProps {
  credentialAlerts: CredentialAlertItem[];
  /** Real pumps from the database, one lane each. */
  pumps: PumpLane[];
  /** Real customers, pumps and operators for the booking form. */
  orderOptions: OrderFormOptions;
  /** The day being shown (yyyy-MM-dd). */
  date: string;
  /** Pours on that day, each on a pump. */
  bookings: ScheduleBooking[];
  /** Upcoming orders that still need a pump. */
  unassignedJobs: ScheduleBooking[];
}

export function ScheduleBoard({
  credentialAlerts,
  pumps,
  orderOptions,
  date,
  bookings: savedBookings,
  unassignedJobs,
}: ScheduleBoardProps) {
  const router = useRouter();
  const [, startSaving] = useTransition();
  // A dragged card moves at once; the saved data replaces it when the server answers (or puts it back on failure).
  const [bookings, moveBooking] = useOptimistic(
    savedBookings,
    (current, move: { id: string; pumpId: string; startHour: number }) =>
      current.map((b) => (b.id === move.id ? { ...b, pumpId: move.pumpId, startHour: move.startHour } : b)),
  );

  // The day is in the URL, so the server loads that day's pours.
  // Noon, so formatting in another timezone never lands on the neighbouring day.
  const currentDate = parse(`${date} 12:00`, "yyyy-MM-dd HH:mm", new Date());
  const setCurrentDate = (next: Date) => router.push(`/schedule?date=${format(next, "yyyy-MM-dd")}`);
  const [searchQuery, setSearchQuery] = useState("");
  const isMobile = useIsMobile();
  const [userViewMode, setUserViewMode] = useState<ScheduleViewMode | null>(null);
  const viewMode: ScheduleViewMode = userViewMode ?? (isMobile ? "list" : "day");
  const [selectedPumpId, setSelectedPumpId] = useState("all");
  const [selectedOperator, setSelectedOperator] = useState("all");

  // Quick Booking Drawer State
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [drawerInitialPump, setDrawerInitialPump] = useState<string | undefined>();
  const [drawerInitialHour, setDrawerInitialHour] = useState<number | undefined>();
  const [editingBooking, setEditingBooking] = useState<ScheduleBooking | null>(null);

  const [showAlertBanner, setShowAlertBanner] = useState(true);

  // Filtered pumps based on dropdown selections
  const filteredPumps = pumps.filter((pump) => {
    if (selectedPumpId !== "all" && pump.id !== selectedPumpId) return false;
    if (selectedOperator !== "all") {
      const hasOperatorJob = bookings.some(
        (b) => b.pumpId === pump.id && b.operator === selectedOperator
      );
      if (!hasOperatorJob) return false;
    }
    return true;
  });

  // Filtered bookings based on search query & operator selection
  const filteredBookings = bookings.filter((b) => {
    if (selectedOperator !== "all" && b.operator !== selectedOperator) return false;
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      b.customerName.toLowerCase().includes(query) ||
      b.jobSiteName.toLowerCase().includes(query) ||
      b.orderNumber.toLowerCase().includes(query)
    );
  });

  const dispatchedCount = filteredBookings.filter(
    (b) => b.dispatchStatus === "dispatched"
  ).length;
  const draftCount = filteredBookings.filter(
    (b) => b.operator && b.dispatchStatus !== "dispatched"
  ).length;
  const needsOperatorCount = filteredBookings.filter(
    (b) => !b.operator
  ).length;

  const handleOpenNewBooking = (pumpId?: string, hour?: number) => {
    setEditingBooking(null);
    setDrawerInitialPump(pumpId || pumps[0]?.id);
    setDrawerInitialHour(hour || 14);
    setIsDrawerOpen(true);
  };

  const handleAssignJobFromDrawer = (job: ScheduleBooking) => {
    setEditingBooking(job);
    setDrawerInitialPump(pumps[0]?.id);
    setDrawerInitialHour(job.startHour);
    setIsDrawerOpen(true);
  };

  const handleRescheduleBooking = (
    bookingId: string,
    targetPumpId: string,
    targetStartHour: number
  ) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking?.jobId || booking.version === undefined) return;
    const targetPump = pumps.find((p) => p.id === targetPumpId);
    const hour = Math.floor(targetStartHour);
    const minute = Math.round((targetStartHour - hour) * 60);
    const clock = `${hour % 12 === 0 ? 12 : hour % 12}:${String(minute).padStart(2, "0")} ${hour >= 12 ? "PM" : "AM"}`;

    startSaving(async () => {
      moveBooking({ id: bookingId, pumpId: targetPumpId, startHour: targetStartHour });
      const result = await updateOrder({
        id: booking.jobId!,
        version: booking.version!,
        date,
        pourTime: clock,
        equipmentId: targetPumpId,
      });
      if (!reportAction(result, { entity: "order", refresh: () => router.refresh() })) return;
      toast.success("Job rescheduled", {
        description: `${booking.customerName} moved to ${targetPump?.code || "Pump"} at ${clock}`,
      });
    });
  };

  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);
  const [isDossierOpen, setIsDossierOpen] = useState(false);

  const selectedDossierBooking = selectedBookingId
    ? bookings.find((b) => b.id === selectedBookingId) || null
    : null;

  const handleBookingClick = (booking: ScheduleBooking) => {
    setSelectedBookingId(booking.id);
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
        dispatchedCount={dispatchedCount}
        draftCount={draftCount}
        needsOperatorCount={needsOperatorCount}
        viewMode={viewMode}
        onViewModeChange={setUserViewMode}
        pumps={pumps}
        selectedPumpId={selectedPumpId}
        onSelectPump={setSelectedPumpId}
        selectedOperator={selectedOperator}
        onSelectOperator={setSelectedOperator}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      {/* ── Alert Banner: operator CDL / medical cert expiring within 30 days ── */}
      <CredentialAlertBanner alerts={credentialAlerts} />

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

      {/* ── 3. Schedule Content: Mobile Card View (Cards Mode) OR Gantt Timeline Grid (Grid Mode) ── */}
      {viewMode === "list" ? (
        <MobileRigCardView
          pumps={filteredPumps}
          bookings={filteredBookings}
          onBookingClick={handleBookingClick}
          onSlotClick={(pumpId, hour) => handleOpenNewBooking(pumpId, hour)}
        />
      ) : (
        <TimelineGrid
          pumps={filteredPumps}
          bookings={filteredBookings}
          onSlotClick={(pumpId, hour) => handleOpenNewBooking(pumpId, hour)}
          onBookingClick={handleBookingClick}
          onRescheduleBooking={handleRescheduleBooking}
        />
      )}

      {/* ── 4. Empty State Card (Visible when schedule is clear for the day in Grid view) ── */}
      {filteredBookings.length === 0 && viewMode !== "list" && (
        <ScheduleEmptyState onNewBookingClick={() => handleOpenNewBooking()} />
      )}

      {/* ── 5. Unassigned Jobs Accordion ── */}
      <UnassignedJobsDrawer
        unassignedJobs={unassignedJobs}
        onAssignJob={handleAssignJobFromDrawer}
      />

      {/* ── 6. Bottom Helper & Legend Bar (Desktop) ── */}
      <div className="hidden md:block">
        <ScheduleLegend />
      </div>

      {/* ── 7. New Order / Booking Modal (Screenshot 1: V1 + V2 Quick Dispatch Flow) ── */}
      <NewOrderModal
        isOpen={isDrawerOpen}
        onOpenChange={setIsDrawerOpen}
        pumps={pumps}
        options={orderOptions}
        initialPumpId={drawerInitialPump}
        initialHour={drawerInitialHour}
        editingBooking={editingBooking}
        date={date}
      />

      {/* ── 8. Order Dossier Popover (Screenshot 3) ── */}
      <OrderDossierModal
        isOpen={isDossierOpen}
        onOpenChange={setIsDossierOpen}
        booking={selectedDossierBooking}
        pumps={pumps}
        operators={orderOptions.operators}
        onQuickEdit={handleQuickEditFromDossier}
      />

      {/* ── 9. Mobile Floating Action Button (FAB) for 1-Hand Booking ── */}
      <button
        type="button"
        onClick={() => handleOpenNewBooking()}
        className="fixed bottom-6 right-5 z-40 md:hidden h-14 w-14 rounded-full bg-brand hover:bg-brand-hover text-white shadow-xl flex items-center justify-center active:scale-95 transition-all cursor-pointer border-2 border-white/20"
        title="New booking"
        aria-label="New booking"
      >
        <Plus className="h-6 w-6" />
      </button>
    </div>
  );
}