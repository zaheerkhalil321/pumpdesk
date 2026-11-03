"use client";

import { useOptimistic, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { format, parse } from "date-fns";
import { ScheduleHeader } from "@/components/schedule/schedule-header";
import { ScheduleToolbar } from "@/components/schedule/schedule-toolbar";
import { TimelineGrid } from "@/components/schedule/timeline-grid";
import { MobileRigCardView } from "@/components/schedule/mobile-rig-card-view";
import { useIsMobile } from "@/hooks/use-mobile";
import { findOverlap } from "@/features/orders/conflicts";
import { findTravelClash } from "@/features/orders/travel";
import { ScheduleEmptyState } from "@/components/schedule/schedule-empty-state";
import { UnassignedJobsDrawer } from "@/components/schedule/unassigned-jobs-drawer";
import { ScheduleLegend } from "@/components/schedule/schedule-legend";
import { NewOrderModal } from "@/components/schedule/new-order-modal";
import { OrderDossierModal } from "@/components/schedule/order-dossier-popover";
import { OperatorSwapDialog, type OperatorRef } from "@/components/schedule/operator-swap-dialog";
import { MoveDetailsDialog, type MoveDetails } from "@/components/schedule/move-details-dialog";
import { TravelClashDialog, type PendingTravelClash } from "@/components/schedule/travel-clash-dialog";
import { clockFromHour } from "@/features/orders/mappers";
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
import type { DayCounts, OrderFormOptions } from "@/features/orders/types";
import { AlertTriangle, X, Plus } from "lucide-react";

/** An operator's name picked out in a toast. */
function Bold({ children }: { children: React.ReactNode }) {
  return <strong className="font-semibold text-foreground">{children}</strong>;
}

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
  /** Orders per day around the shown day, for the calendar. */
  dayCounts: DayCounts;
}

export function ScheduleBoard({
  credentialAlerts,
  pumps,
  orderOptions,
  date,
  bookings: savedBookings,
  unassignedJobs,
  dayCounts,
}: ScheduleBoardProps) {
  const router = useRouter();
  const [, startSaving] = useTransition();
  // A dragged card moves at once; the saved data replaces it when the server answers (or puts it back on failure).
  const [bookings, moveBooking] = useOptimistic(
    savedBookings,
    (current, move: { id: string; pumpId: string; startHour: number; operator?: string | null }) =>
      current.map((b) =>
        b.id === move.id
          ? {
              ...b,
              pumpId: move.pumpId,
              startHour: move.startHour,
              // The pour keeps its place inside the block (prep comes first).
              pourHour: move.startHour + (b.pourHour - b.startHour),
              // A new operator is not dispatched yet, so the card goes back to a draft.
              ...("operator" in move
                ? { operator: move.operator, dispatchStatus: move.operator ? ("draft" as const) : ("unassigned" as const) }
                : {}),
            }
          : b,
      ),
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
    setDrawerInitialPump(pumpId);
    setDrawerInitialHour(hour || 14);
    setIsDrawerOpen(true);
  };

  const handleAssignJobFromDrawer = (job: ScheduleBooking) => {
    setEditingBooking(job);
    setDrawerInitialPump(undefined);
    setDrawerInitialHour(job.pourHour);
    setIsDrawerOpen(true);
  };

  /** The operator on a card, with their id, or null when the card has none. */
  const operatorOf = (booking: ScheduleBooking): OperatorRef | null => {
    const found = orderOptions.operators.find((o) => o.name === booking.operator);
    return found ? { id: found.id, name: found.name } : null;
  };

  /** The usual operator of a pump, or null when it has none. */
  const usualOperatorOf = (pumpId: string): OperatorRef | null => {
    const id = orderOptions.pumps.find((p) => p.id === pumpId)?.defaultOperatorId;
    const found = orderOptions.operators.find((o) => o.id === id);
    return found ? { id: found.id, name: found.name } : null;
  };

  /**
   * Moves a card to a pump and start hour. With `operatorChange` the operator changes too.
   * The toast offers Undo, which puts back the pump, the time and the operator.
   */
  const moveOrder = (
    booking: ScheduleBooking,
    version: number,
    targetPumpId: string,
    targetStartHour: number,
    options: { isUndo?: boolean; operatorChange?: { from: OperatorRef | null; to: OperatorRef | null } } = {},
  ) => {
    const { isUndo = false, operatorChange } = options;
    const targetPump = pumps.find((p) => p.id === targetPumpId);
    // The card moves as a whole block; the order's pour time is where the pour sits inside it.
    const prepHours = booking.pourHour - booking.startHour;
    const clock = clockFromHour(targetStartHour + prepHours);

    startSaving(async () => {
      moveBooking({
        id: booking.id,
        pumpId: targetPumpId,
        startHour: targetStartHour,
        ...(operatorChange ? { operator: operatorChange.to?.name ?? null } : {}),
      });
      const result = await updateOrder({
        id: booking.jobId!,
        version,
        date,
        pourTime: clock,
        equipmentId: targetPumpId,
        ...(operatorChange ? { employeeId: operatorChange.to?.id ?? null } : {}),
      });
      if (!reportAction(result, { entity: "order", refresh: () => router.refresh() })) return;
      const description = `${booking.customerName} on ${targetPump?.code || "Pump"} at ${clock}`;
      if (isUndo) {
        toast.success("Move undone", { description });
        return;
      }
      const clash = findOverlap(bookings, {
        pumpId: targetPumpId,
        startHour: targetStartHour,
        durationHours: booking.durationHours,
        ignoreId: booking.id,
      });
      const clashNote = clash ? ` Overlaps ${clash.customerName} on the same pump.` : "";
      const undo = {
        label: "Undo",
        onClick: () =>
          moveOrder(booking, result.data.version, booking.pumpId, booking.startHour, {
            isUndo: true,
            operatorChange: operatorChange ? { from: operatorChange.to, to: operatorChange.from } : undefined,
          }),
      };

      const range = (start: number) =>
        `${clockFromHour(start + prepHours)} - ${clockFromHour(start + prepHours + booking.pourHours)}`;
      const notes: string[] = [];
      if (operatorChange?.to && booking.dispatchStatus === "dispatched") {
        notes.push(`${operatorChange.from?.name ?? "The previous operator"} was told about this job. ${operatorChange.to.name} needs it dispatched again.`);
      }
      if (operatorChange && !operatorChange.to) {
        notes.push(`${operatorChange.from?.name ?? "The operator"} is no longer on this job. Pick an operator before dispatching.`);
      }
      if (clash) notes.push(`Overlaps ${clash.customerName} (${clash.orderNumber}) on the same pump.`);
      const details: MoveDetails = {
        title: operatorChange ? "Operator changed" : "Job rescheduled",
        customerName: booking.customerName,
        orderNumber: booking.orderNumber,
        pump: {
          from: pumps.find((p) => p.id === booking.pumpId)?.code ?? "Pump",
          to: targetPump?.code ?? "Pump",
        },
        time: { from: range(booking.startHour), to: range(targetStartHour) },
        operator: operatorChange
          ? { from: operatorChange.from?.name ?? "No operator", to: operatorChange.to?.name ?? "No operator" }
          : undefined,
        notes,
        onUndo: undo.onClick,
      };
      const detailsButton = { label: "Details", onClick: () => setMoveDetails(details) };

      if (operatorChange) {
        // A warning-style toast, so a changed operator stands out from an ordinary move.
        toast.warning("Operator changed", {
          description: (
            <span>
              <Bold>{operatorChange.from?.name ?? "No operator"}</Bold> to <Bold>{operatorChange.to?.name ?? "no operator"}</Bold>.{" "}
              {booking.customerName} on <span className="whitespace-nowrap">{targetPump?.code || "Pump"}</span> at{" "}
              <span className="whitespace-nowrap">{clock}</span>.{clashNote}
            </span>
          ),
          duration: 9000,
          action: undo,
          cancel: detailsButton,
        });
        return;
      }
      toast.success("Job rescheduled", {
        description: (
          <span>
            {booking.customerName} on <span className="whitespace-nowrap">{targetPump?.code || "Pump"}</span> at{" "}
            <span className="whitespace-nowrap">{clock}</span>.{clashNote}
          </span>
        ),
        action: undo,
        cancel: detailsButton,
      });
    });
  };

  // What the last drag changed, opened from the toast's Details button.
  const [moveDetails, setMoveDetails] = useState<MoveDetails | null>(null);

  // A dispatched job dragged to a pump with a different usual operator waits here for an answer.
  const [pendingSwap, setPendingSwap] = useState<{
    booking: ScheduleBooking;
    targetPumpId: string;
    targetStartHour: number;
    current: OperatorRef;
    usual: OperatorRef;
  } | null>(null);

  // A drag that leaves too little drive time between two jobs waits here for an answer.
  const [pendingTravel, setPendingTravel] = useState<{
    booking: ScheduleBooking;
    targetPumpId: string;
    targetStartHour: number;
    suggestedStartHour: number | null;
    clash: PendingTravelClash;
  } | null>(null);

  const handleRescheduleBooking = (
    bookingId: string,
    targetPumpId: string,
    targetStartHour: number
  ) => {
    const booking = bookings.find((b) => b.id === bookingId);
    if (!booking?.jobId || booking.version === undefined) return;
    if (booking.pumpId === targetPumpId && booking.startHour === targetStartHour) return;

    const prepHours = booking.pourHour - booking.startHour;
    const travel = findTravelClash(bookings, {
      pumpId: targetPumpId,
      startHour: targetStartHour,
      durationHours: booking.durationHours,
      prepHours,
      travelMinutes: booking.travelMinutes,
      ignoreId: booking.id,
    });
    if (travel) {
      setPendingTravel({
        booking,
        targetPumpId,
        targetStartHour,
        suggestedStartHour: travel.suggestedPourHour === null ? null : travel.suggestedPourHour - prepHours,
        clash: {
          kind: travel.kind,
          customerName: booking.customerName,
          otherCustomerName: travel.other.customerName,
          otherOrderNumber: travel.other.orderNumber,
          gapMinutes: travel.gapMinutes,
          travelMinutes: travel.travelMinutes,
          suggestedPourClock: travel.suggestedPourHour === null ? null : clockFromHour(travel.suggestedPourHour),
          chosenPourClock: clockFromHour(targetStartHour + prepHours),
        },
      });
      return;
    }
    continueReschedule(booking, targetPumpId, targetStartHour);
  };

  const answerTravel = (moveToSuggested: boolean) => {
    if (!pendingTravel) return;
    const { booking, targetPumpId, targetStartHour, suggestedStartHour } = pendingTravel;
    setPendingTravel(null);
    continueReschedule(booking, targetPumpId, moveToSuggested && suggestedStartHour !== null ? suggestedStartHour : targetStartHour);
  };

  const continueReschedule = (booking: ScheduleBooking, targetPumpId: string, targetStartHour: number) => {
    if (booking.version === undefined) return;

    // Moving to another pump brings that pump's usual operator, like choosing it in a form.
    if (booking.pumpId !== targetPumpId) {
      const current = operatorOf(booking);
      const usual = usualOperatorOf(targetPumpId);
      const sameOperator = current?.id === usual?.id;

      if (!sameOperator) {
        if (booking.dispatchStatus === "dispatched") {
          // Already sent to someone: ask, unless the new pump has no usual operator (then they stay).
          if (current && usual) {
            setPendingSwap({ booking, targetPumpId, targetStartHour, current, usual });
            return;
          }
        } else {
          moveOrder(booking, booking.version, targetPumpId, targetStartHour, {
            operatorChange: { from: current, to: usual },
          });
          return;
        }
      }
    }
    moveOrder(booking, booking.version, targetPumpId, targetStartHour);
  };

  const answerSwap = (switchOperator: boolean) => {
    if (!pendingSwap) return;
    const { booking, targetPumpId, targetStartHour, current, usual } = pendingSwap;
    setPendingSwap(null);
    if (booking.version === undefined) return;
    moveOrder(
      booking,
      booking.version,
      targetPumpId,
      targetStartHour,
      switchOperator ? { operatorChange: { from: current, to: usual } } : {},
    );
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
      {/* ── 1. Top Header (Title, the open day, + New booking) ── */}
      <ScheduleHeader
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        dayCounts={dayCounts}
        onNewBookingClick={() => handleOpenNewBooking()}
      />

      {/* ── 2. Toolbar (Date navigator, View toggle, Filter dropdowns, V2 Expand) ── */}
      <ScheduleToolbar
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        dayCounts={dayCounts}
        bookingCount={filteredBookings.length}
        dispatchedCount={dispatchedCount}
        draftCount={draftCount}
        needsOperatorCount={needsOperatorCount}
        viewMode={viewMode}
        onViewModeChange={setUserViewMode}
        pumps={pumps}
        operatorNames={orderOptions.operators.map((o) => o.name)}
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
      {filteredBookings.length === 0 && (
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
        bookings={bookings}
        date={date}
      />

      <MoveDetailsDialog details={moveDetails} onClose={() => setMoveDetails(null)} />

      <OperatorSwapDialog
        swap={
          pendingSwap
            ? {
                customerName: pendingSwap.booking.customerName,
                pumpCode: pumps.find((p) => p.id === pendingSwap.targetPumpId)?.code ?? "That pump",
                current: pendingSwap.current,
                usual: pendingSwap.usual,
              }
            : null
        }
        onKeep={() => answerSwap(false)}
        onSwitch={() => answerSwap(true)}
        onCancel={() => setPendingSwap(null)}
      />

      <TravelClashDialog
        clash={pendingTravel?.clash ?? null}
        onMove={() => answerTravel(true)}
        onKeep={() => answerTravel(false)}
        onCancel={() => setPendingTravel(null)}
      />

      {/* ── 8. Order Dossier Popover (Screenshot 3) ── */}
      <OrderDossierModal
        isOpen={isDossierOpen}
        onOpenChange={setIsDossierOpen}
        booking={selectedDossierBooking}
        pumps={pumps}
        operators={orderOptions.operators}
        onQuickEdit={handleQuickEditFromDossier}
        overlapWith={
          selectedDossierBooking && selectedDossierBooking.pumpId
            ? findOverlap(bookings, {
                pumpId: selectedDossierBooking.pumpId,
                startHour: selectedDossierBooking.startHour,
                durationHours: selectedDossierBooking.durationHours,
                ignoreId: selectedDossierBooking.id,
              })
            : null
        }
        onOpenOrder={(other) => setSelectedBookingId(other.id)}
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