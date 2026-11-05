'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { DndContext, DragOverlay, pointerWithin, type DragEndEvent, type DragMoveEvent } from '@dnd-kit/core';
import { Truck, Plus, GripVertical, Clock, Check, TriangleAlert } from 'lucide-react';
import { DraggableCard, DroppableLane, useTimelineSensors } from './timeline-dnd';
import { cn } from '@/lib/utils';
import { PumpLane, ScheduleBooking } from './schedule-types';
import { clockFromHour } from '@/features/orders/mappers';
import { findOverlap } from '@/features/orders/conflicts';
import { formatDuration } from '@/features/orders/duration';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

/** "7:00 - 10:00 AM": a span between two hours, shortened when both are in the same half of the day. */
function hourRangeLabel(startHour: number, endHour: number): string {
  const start = clockFromHour(startHour);
  const end = clockFromHour(endHour);
  const samePeriod = start.slice(-2) === end.slice(-2);
  return `${samePeriod ? start.slice(0, -3) : start} - ${end}`;
}

/** When the pour starts and ends, so the card never has to be read off the hour columns. */
function timeRangeLabel(booking: ScheduleBooking): string {
  return hourRangeLabel(booking.pourHour, booking.pourHour + booking.pourHours);
}

/** The board covers the full day; jobs can start as early as 12 AM or as late as 11 PM. */
const TIMELINE_HOURS = Array.from({ length: 24 }, (_, hour) => ({
  hour,
  label: `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`,
}));

/** The screen opens scrolled to this hour, since most days run 5 AM to 5 PM. */
const FIRST_VISIBLE_HOUR = 5;

// Tailwind needs the full class names in the source, so the grid positions are spelled out.
// Column 1 is 12 AM, column 24 is 11 PM.
const COL_STARTS = [
  'col-start-1',
  'col-start-2',
  'col-start-3',
  'col-start-4',
  'col-start-5',
  'col-start-6',
  'col-start-7',
  'col-start-8',
  'col-start-9',
  'col-start-10',
  'col-start-11',
  'col-start-12',
  'col-start-13',
  'col-start-14',
  'col-start-15',
  'col-start-16',
  'col-start-17',
  'col-start-18',
  'col-start-19',
  'col-start-20',
  'col-start-21',
  'col-start-22',
  'col-start-23',
  'col-start-24',
];

// Column spans, 1 to 24 hours.
const COL_SPANS = [
  'col-span-1',
  'col-span-2',
  'col-span-3',
  'col-span-4',
  'col-span-5',
  'col-span-6',
  'col-span-7',
  'col-span-8',
  'col-span-9',
  'col-span-10',
  'col-span-11',
  'col-span-12',
  'col-span-13',
  'col-span-14',
  'col-span-15',
  'col-span-16',
  'col-span-17',
  'col-span-18',
  'col-span-19',
  'col-span-20',
  'col-span-21',
  'col-span-22',
  'col-span-23',
  'col-span-24',
];

// Width of the prep and clean-up strips as a share of the card, 0 to 45%.
const STRIP_BASIS = [
  'basis-[0%]',
  'basis-[1%]',
  'basis-[2%]',
  'basis-[3%]',
  'basis-[4%]',
  'basis-[5%]',
  'basis-[6%]',
  'basis-[7%]',
  'basis-[8%]',
  'basis-[9%]',
  'basis-[10%]',
  'basis-[11%]',
  'basis-[12%]',
  'basis-[13%]',
  'basis-[14%]',
  'basis-[15%]',
  'basis-[16%]',
  'basis-[17%]',
  'basis-[18%]',
  'basis-[19%]',
  'basis-[20%]',
  'basis-[21%]',
  'basis-[22%]',
  'basis-[23%]',
  'basis-[24%]',
  'basis-[25%]',
  'basis-[26%]',
  'basis-[27%]',
  'basis-[28%]',
  'basis-[29%]',
  'basis-[30%]',
  'basis-[31%]',
  'basis-[32%]',
  'basis-[33%]',
  'basis-[34%]',
  'basis-[35%]',
  'basis-[36%]',
  'basis-[37%]',
  'basis-[38%]',
  'basis-[39%]',
  'basis-[40%]',
  'basis-[41%]',
  'basis-[42%]',
  'basis-[43%]',
  'basis-[44%]',
  'basis-[45%]',
];

/** Diagonal hatching for the prep and clean-up strips on either side of a pour. */
const HATCH = 'bg-slate-50 bg-[repeating-linear-gradient(135deg,transparent_0_5px,var(--color-slate-200)_5px_6px)]';

/** A hatched strip beside a pour, for prep before it or clean-up after it. The label shows once the strip is wide enough. */
function StripLabel({ kind, range, percent, className }: { kind: string; range: string; percent: number; className?: string }) {
  return (
    <div
      className={cn('flex shrink-0 flex-col items-center justify-center overflow-hidden px-0.5 text-center', HATCH, STRIP_BASIS[percent], className)}
      title={`${kind} ${range}`}
    >
      {percent >= 12 && <span className="text-[9px] font-bold leading-tight text-slate-600">{kind}</span>}
      {percent >= 14 && <span className="text-[8px] font-medium leading-tight text-slate-500">{range.replace(' - ', '–').replace(/ (AM|PM)$/, '')}</span>}
    </div>
  );
}

// Pours that overlap on one pump are stacked in tracks so none is hidden. Three tracks is the cap.
const MAX_TRACKS = 3;
const LANE_MIN_HEIGHT = ['min-h-[96px]', 'min-h-[192px]', 'min-h-[288px]'];
const OVERLAY_ROWS = ['grid-rows-1', 'grid-rows-2', 'grid-rows-3'];
const ROW_STARTS = ['row-start-1 row-end-2', 'row-start-2 row-end-3', 'row-start-3 row-end-4'];

/** Gives each booking a track (0, 1, 2) so bookings that overlap in time sit on different tracks. */
function assignTracks(bookings: ScheduleBooking[]): { ordered: ScheduleBooking[]; trackOf: Map<string, number>; tracks: number } {
  const ordered = [...bookings].sort((a, b) => a.startHour - b.startHour);
  const trackEnds: number[] = [];
  const trackOf = new Map<string, number>();
  for (const booking of ordered) {
    let track = trackEnds.findIndex((end) => end <= booking.startHour);
    if (track === -1) track = Math.min(trackEnds.length, MAX_TRACKS - 1);
    trackEnds[track] = Math.max(trackEnds[track] ?? 0, booking.startHour + booking.durationHours);
    trackOf.set(booking.id, track);
  }
  return { ordered, trackOf, tracks: Math.max(1, Math.min(trackEnds.length, MAX_TRACKS)) };
}

const colIndex = (hour: number) => Math.max(0, Math.min(23, Math.floor(hour)));
const colSpan = (durationHours: number) => Math.max(1, Math.min(24, Math.round(durationHours)));

/**
 * The route of one pump through the day: from the shop to the first job, between jobs, and back to the shop.
 * A line between two jobs shows the drive time; it turns red when the gap is shorter than the drive.
 */
function TravelConnectors({ ordered, trackOf }: { ordered: ScheduleBooking[]; trackOf: Map<string, number> }) {
  if (ordered.length === 0) return null;
  const items: React.ReactNode[] = [];

  const endCol = (b: ScheduleBooking) => {
    const start = colIndex(b.startHour);
    return start + Math.min(colSpan(b.durationHours), 24 - start);
  };

  const first = ordered[0];
  const firstCol = colIndex(first.startHour);
  if (firstCol >= 1) {
    items.push(
      <div
        key="shop-out"
        title="From the shop"
        className={cn('flex items-center self-center', ROW_STARTS[trackOf.get(first.id) ?? 0], COL_STARTS[firstCol - 1], COL_SPANS[0])}
      >
        <span className="h-2 w-2 shrink-0 rounded-full bg-slate-400" />
        <span className="h-px flex-1 bg-slate-400" />
      </div>,
    );
  }

  ordered.forEach((current, i) => {
    const next = ordered[i + 1];
    if (!next) return;
    const track = trackOf.get(current.id) ?? 0;
    if (!next.linkedToPrevious || trackOf.get(next.id) !== track) return;
    const from = endCol(current);
    const to = colIndex(next.startHour);
    if (to - from < 1) return;
    const gapMinutes = Math.round((next.startHour - (current.startHour + current.durationHours)) * 60);
    const short = gapMinutes < next.travelMinutes;
    items.push(
      <div
        key={`${current.id}-${next.id}`}
        title={`${next.travelMinutes > 0 ? `${formatDuration(next.travelMinutes)} drive` : 'No drive time set'}${short ? ` - only ${formatDuration(Math.max(0, gapMinutes))} between jobs` : ''}`}
        className={cn('relative flex items-center self-center', ROW_STARTS[track], COL_STARTS[from], COL_SPANS[to - from - 1])}
      >
        <span className={cn('h-0.5 flex-1', short ? 'bg-rose-500' : 'bg-slate-400')} />
        {next.travelMinutes > 0 && (
          <span
            className={cn(
              'absolute bottom-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-[9px] font-bold leading-none',
              short ? 'text-rose-600' : 'text-slate-500',
            )}
          >
            {formatDuration(next.travelMinutes)}
          </span>
        )}
      </div>,
    );
  });

  const last = ordered[ordered.length - 1];
  const lastEnd = endCol(last);
  if (lastEnd <= 23) {
    items.push(
      <div
        key="shop-back"
        title="Back to the shop"
        className={cn('flex items-center self-center', ROW_STARTS[trackOf.get(last.id) ?? 0], COL_STARTS[lastEnd], COL_SPANS[0])}
      >
        <span className="h-px flex-1 bg-slate-400" />
        <span className="h-2 w-2 shrink-0 rounded-full bg-slate-400" />
      </div>,
    );
  }

  return <>{items}</>;
}

interface TimelineGridProps {
  pumps: PumpLane[];
  bookings: ScheduleBooking[];
  onSlotClick: (pumpId: string, hour: number) => void;
  onBookingClick: (booking: ScheduleBooking) => void;
  onRescheduleBooking: (
    bookingId: string,
    targetPumpId: string,
    targetStartHour: number,
  ) => void;
}

export function TimelineGrid({
  pumps,
  bookings,
  onSlotClick,
  onBookingClick,
  onRescheduleBooking,
}: TimelineGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Open on the working day (5 AM) instead of midnight; the rest is one scroll away.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const labelWidth = el.querySelector<HTMLElement>('[data-lane-label]')?.offsetWidth ?? 0;
    el.scrollLeft = ((el.scrollWidth - labelWidth) / TIMELINE_HOURS.length) * FIRST_VISIBLE_HOUR;
  }, []);

  // ── Dragging a card (mouse, or hold-then-drag on a tablet) ──
  const dndId = useId();
  const sensors = useTimelineSensors();
  const [draggedBookingId, setDraggedBookingId] = useState<string | null>(null);
  // Where the card would land: shown as a dashed box on that pump's row.
  const [dropTarget, setDropTarget] = useState<{ pumpId: string; startHour: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const lastOverPumpId = useRef<string | null>(null);
  // A drag that ends with the mouse over a card should not also open it.
  const justDragged = useRef(false);
  const draggedBooking = bookings.find((b) => b.id === draggedBookingId) ?? null;

  /**
   * The pump under the pointer, and a start time moved by whole hours from the card's own,
   * so a 7:30 pour stays on the half hour. Measured from the screen, so it is right after the board scrolls.
   */
  const measureTarget = (bookingId: string, pumpId: string | null, fallbackDeltaX = 0) => {
    const scroller = scrollRef.current;
    const booking = bookings.find((b) => b.id === bookingId);
    if (!scroller || !booking || !pumpId) return null;
    const card = scroller.querySelector<HTMLElement>(`[data-booking-id="${bookingId}"]`);
    const lane = scroller.querySelector<HTMLElement>(`[data-lane-id="${pumpId}"]`);
    if (!card || !lane) return null;
    const hourWidth = lane.getBoundingClientRect().width / TIMELINE_HOURS.length;
    const overlay = overlayRef.current;
    const deltaX = overlay
      ? overlay.getBoundingClientRect().left - card.getBoundingClientRect().left
      : fallbackDeltaX;
    const minutes = booking.startHour % 1;
    const startHour = Math.min(23 + minutes, Math.max(minutes, booking.startHour + Math.round(deltaX / hourWidth)));
    return { pumpId, startHour };
  };

  const showTarget = (target: { pumpId: string; startHour: number } | null) =>
    setDropTarget((prev) =>
      prev?.pumpId === target?.pumpId && prev?.startHour === target?.startHour ? prev : target,
    );

  const handleDragMove = ({ active, over }: DragMoveEvent) => {
    lastOverPumpId.current = over ? String(over.id) : null;
    showTarget(measureTarget(String(active.id), lastOverPumpId.current));
  };

  const endDrag = () => {
    setDraggedBookingId(null);
    setDropTarget(null);
    lastOverPumpId.current = null;
    justDragged.current = true;
    setTimeout(() => {
      justDragged.current = false;
    }, 0);
  };

  const handleDragEnd = ({ active, over, delta }: DragEndEvent) => {
    const target = measureTarget(String(active.id), over ? String(over.id) : null, delta.x);
    endDrag();
    if (target) onRescheduleBooking(String(active.id), target.pumpId, target.startHour);
  };

  return (
    <TooltipProvider>
    <DndContext
      id={dndId}
      sensors={sensors}
      collisionDetection={pointerWithin}
      // Scroll the board only when the pointer is right at its edge, so a short drag stays put.
      autoScroll={{ threshold: { x: 0.08, y: 0.1 } }}
      onDragStart={({ active }) => setDraggedBookingId(String(active.id))}
      onDragMove={handleDragMove}
      onDragEnd={handleDragEnd}
      onDragCancel={endDrag}
    >
    <div className="w-full rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs">
      <div
        ref={scrollRef}
        // The board scrolls itself near the edges while dragging; keep the landing box in step.
        onScroll={() => {
          if (draggedBookingId) showTarget(measureTarget(draggedBookingId, lastOverPumpId.current));
        }}
        className="overflow-x-auto min-w-full"
      >
        <div className="min-w-[2800px]">
          {/* ── 1. HEADER ROW ── */}
          <div className="flex border-b border-slate-200 bg-slate-50/80 text-slate-600 font-semibold text-xs sticky top-0 z-30">
            {/* Frozen Left Header */}
            <div data-lane-label className="w-[110px] sm:w-[180px] shrink-0 px-2.5 sm:px-3 py-2.5 border-r border-slate-200 bg-slate-50 sticky left-0 z-40 flex items-center gap-2">
              <span className="text-slate-700">Pumps</span>
            </div>

            {/* 24 Time Header Slots */}
            <div className="flex-1 grid grid-cols-[repeat(24,minmax(0,1fr))] min-w-[2600px]">
              {TIMELINE_HOURS.map((slot) => (
                <div
                  key={slot.hour}
                  className="py-2.5 text-center border-r border-slate-200/80 last:border-r-0 tracking-tight"
                >
                  {slot.label}
                </div>
              ))}
            </div>
          </div>

          {/* ── 2. PUMP TIMELINE LANES ── */}
          <div className="divide-y divide-slate-200/80">
            {pumps.map((pump) => {
              const pumpBookings = bookings.filter((b) => b.pumpId === pump.id);
              const { ordered, trackOf, tracks } = assignTracks(pumpBookings);

              return (
                <div
                  key={pump.id}
                  className={cn(
                    'flex group hover:bg-slate-50/30 transition-colors relative',
                    LANE_MIN_HEIGHT[tracks - 1],
                  )}
                >
                  {/* Left Column: Pump Specs (Frozen Left) */}
                  <div className="w-[110px] sm:w-[180px] shrink-0 px-2 sm:px-3 py-3 border-r border-slate-200 bg-white group-hover:bg-slate-50/60 sticky left-0 z-20 flex items-center gap-1.5 sm:gap-2.5 transition-colors shadow-[2px_0_4px_-2px_rgba(0,0,0,0.03)]">
                    <Truck className="h-4 w-4 sm:h-5 sm:w-5 text-slate-500 shrink-0" />

                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-slate-900 truncate tracking-tight">
                        {pump.code}
                      </p>
                      <p
                        className="text-[11px] text-slate-500 font-medium truncate mt-0.5 hidden sm:block"
                        title={pump.name}
                      >
                        {pump.name}
                      </p>
                    </div>
                  </div>

                  {/* Right Timeline Area: 24-Column Grid */}
                  <DroppableLane pumpId={pump.id} className="flex-1 relative min-w-[2600px]">
                    {/* Layer A: 24 hourly cells; an empty one starts a booking */}
                    <div className="grid grid-cols-[repeat(24,minmax(0,1fr))] h-full">
                      {TIMELINE_HOURS.map((slot) => {
                        const isBooked = pumpBookings.some(
                          (b) =>
                            slot.hour >= b.startHour &&
                            slot.hour < b.startHour + b.durationHours,
                        );

                        return (
                          <div
                            key={slot.hour}
                            onClick={() =>
                              !isBooked && !justDragged.current && onSlotClick(pump.id, slot.hour)
                            }
                            className={cn(
                              'border-r border-slate-100 last:border-r-0 relative flex items-center justify-center p-1.5 transition-all cursor-pointer select-none',
                              !isBooked && 'hover:bg-slate-100/50',
                            )}
                          >
                            {/* Interactive dynamic hover slot for other empty cells */}
                            {!isBooked && !draggedBookingId && (
                              <div className="w-full h-full rounded-lg border border-dashed border-slate-200 opacity-0 hover:opacity-100 hover:border-brand/40 hover:bg-brand-light/40 text-brand flex items-center justify-center gap-1 text-[11px] font-medium transition-all">
                                <Plus className="h-3 w-3" />
                                <span>Add</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    {/* Layer B: Bookings Overlay Grid (Spans across all booked hours) */}
                    <div className={cn('grid grid-cols-[repeat(24,minmax(0,1fr))] h-full absolute inset-0 p-1.5 gap-y-1.5 pointer-events-none z-10', OVERLAY_ROWS[tracks - 1])}>
                      {ordered.map((booking) => {
                        const startHourClamped = Math.max(
                          0,
                          Math.min(23, Math.floor(booking.startHour)),
                        );
                        const colStartIdx = startHourClamped + 1; // 12 AM -> 1, 1 AM -> 2, etc.
                        const startColClass = COL_STARTS[startHourClamped];

                        // A card that runs past midnight stops at the end of the day.
                        const maxAllowedSpan = 25 - colStartIdx;
                        const durationInt = Math.max(
                          1,
                          Math.min(24, Math.round(booking.durationHours)),
                        );
                        const actualSpan = Math.min(
                          durationInt,
                          maxAllowedSpan,
                        );
                        const spanColClass = COL_SPANS[actualSpan - 1];

                        const isBeingDragged = draggedBookingId === booking.id;

                        // Prep and clean-up sit beside the pour as hatched strips, sized to their share of the card.
                        const stripPercent = (hours: number) =>
                          Math.min(STRIP_BASIS.length - 1, Math.round((Math.max(0, hours) / actualSpan) * 100));
                        const prepPercent = stripPercent(booking.pourHour - booking.startHour);
                        const cleanupPercent = stripPercent(
                          booking.durationHours - (booking.pourHour - booking.startHour) - booking.pourHours,
                        );
                        // The pour card itself is what is left after the strips. Under a column and a half it gets the compact layout.
                        const isNarrow = (actualSpan * (100 - prepPercent - cleanupPercent)) / 100 < 1.5;

                        // Another pour on this pump at the same time. Allowed, but worth a second look.
                        const overlap = findOverlap(pumpBookings, {
                          pumpId: pump.id,
                          startHour: booking.startHour,
                          durationHours: booking.durationHours,
                          ignoreId: booking.id,
                        });

                        // Descriptive tooltip with full un-truncated details
                        const cardTooltip = `${booking.customerName}${booking.volumeYards > 0 ? ` • ${booking.volumeYards} yd³` : ''}\nSite: ${booking.jobSiteName}\nOperator: ${booking.operator || "Needs operator"} (${booking.dispatchStatus || "draft"})\nTime: ${timeRangeLabel(booking)} (${booking.durationHours}h)${overlap ? `\nOverlaps ${overlap.customerName} (${overlap.orderNumber}) at ${timeRangeLabel(overlap)}` : ""}\nDrag to reschedule (on a tablet, hold then drag) • Click to view details`;

                        return (
                          <DraggableCard
                            key={booking.id}
                            bookingId={booking.id}
                            onClick={() => {
                              if (!justDragged.current) onBookingClick(booking);
                            }}
                            className={cn(
                              'pointer-events-auto group',
                              'h-full flex items-stretch transition-all cursor-grab active:cursor-grabbing select-none max-w-full min-w-0',
                              ROW_STARTS[trackOf.get(booking.id) ?? 0],
                              startColClass,
                              spanColClass,
                              isBeingDragged && 'opacity-40 scale-98',
                            )}
                            title={cardTooltip}
                          >
                            {prepPercent > 0 && (
                              <StripLabel
                                kind="Prep"
                                range={hourRangeLabel(booking.startHour, booking.pourHour)}
                                percent={prepPercent}
                                className="rounded-l-lg"
                              />
                            )}
                            <div
                              className={cn(
                                'flex min-w-0 flex-1 flex-col justify-between overflow-hidden rounded-lg border border-l-[3.5px] shadow-2xs group-hover:shadow-md',
                                isNarrow ? 'p-1.5' : 'p-2.5',
                                isBeingDragged && 'border-2 border-brand',
                              // Left border status stripe for instantaneous visual scanning
                              !booking.operator && 'border-l-rose-500',
                              booking.operator && booking.dispatchStatus === 'dispatched' && 'border-l-emerald-500',
                              booking.operator && booking.dispatchStatus !== 'dispatched' && 'border-l-amber-500',
                              booking.status === 'onsite' &&
                                'bg-brand-light border-brand/40 text-brand hover:border-brand',
                              booking.status === 'travel' &&
                                'bg-slate-100 border-slate-300 text-slate-700 hover:border-slate-400',
                              booking.status === 'washout' &&
                                'bg-amber-50 border-amber-300 text-amber-900 hover:border-amber-400',
                              )}
                            >
                            {/* Row 1: Customer Name & Yards */}
                            <div className="flex items-center justify-between gap-1 min-w-0">
                              <div className="flex items-center gap-1 min-w-0 flex-1">
                                {!isNarrow && (
                                  <GripVertical className="h-3.5 w-3.5 shrink-0 opacity-60 hover:opacity-100" />
                                )}
                                <span
                                  className={cn(
                                    'font-bold truncate min-w-0 leading-tight',
                                    isNarrow ? 'text-[11px]' : 'text-xs'
                                  )}
                                >
                                  {booking.customerName}
                                </span>
                              </div>
                              {overlap && (
                                <Tooltip>
                                  <TooltipTrigger
                                    render={<span aria-label={`Overlaps ${overlap.customerName}`} className="shrink-0" />}
                                  >
                                    <TriangleAlert className="h-3.5 w-3.5 text-amber-600" />
                                  </TooltipTrigger>
                                  <TooltipContent side="top">
                                    Overlaps {overlap.customerName} ({overlap.orderNumber}) at {timeRangeLabel(overlap)}
                                  </TooltipContent>
                                </Tooltip>
                              )}
                              {booking.volumeYards > 0 && (
                                <span
                                  className={cn(
                                    'font-bold uppercase tracking-wider rounded bg-white/90 shrink-0 shadow-2xs text-slate-800',
                                    isNarrow ? 'text-[9px] px-1 py-0.2' : 'text-[10px] px-1.5 py-0.5',
                                  )}
                                >
                                  {isNarrow ? `${booking.volumeYards}y` : `${booking.volumeYards} yd³`}
                                </span>
                              )}
                            </div>

                            {/* Row 2: Operator • Job Site • Duration */}
                            {isNarrow ? (
                              /* Clean, un-crowded row for 1-slot cards */
                              <div className="flex items-center justify-between gap-1 text-[9.5px] mt-0.5 min-w-0">
                                <div className="flex items-center gap-1 min-w-0 flex-1">
                                  <span
                                    className={cn(
                                      'h-1.5 w-1.5 rounded-full shrink-0',
                                      !booking.operator && 'bg-rose-500',
                                      booking.operator && booking.dispatchStatus === 'dispatched' && 'bg-emerald-500',
                                      booking.operator && booking.dispatchStatus !== 'dispatched' && 'bg-amber-500 animate-pulse'
                                    )}
                                  />
                                  <span className="truncate text-slate-700 font-semibold min-w-0">
                                    {booking.operator
                                      ? booking.operator.split(' ')[0] + (booking.operator.split(' ')[1] ? ` ${booking.operator.split(' ')[1][0]}.` : '')
                                      : 'No op'}
                                  </span>
                                </div>
                                <span className="text-[9px] font-bold text-slate-600 bg-white/80 px-1 py-0.2 rounded shrink-0">
                                  {timeRangeLabel(booking).replace(' - ', '–')}
                                </span>
                              </div>
                            ) : (
                              /* Standard wide card row */
                              <div className="flex items-center justify-between gap-1.5 text-[10.5px] opacity-90 mt-1 min-w-0">
                                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                                  {/* Driver Status Micro Pill */}
                                  {!booking.operator ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-rose-50 border border-rose-200 text-rose-700 shrink-0 shadow-2xs">
                                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500 shrink-0" />
                                      <span>No Operator</span>
                                    </span>
                                  ) : booking.dispatchStatus === 'dispatched' ? (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-emerald-50 border border-emerald-300 text-emerald-800 shrink-0 shadow-2xs">
                                      <Check className="h-2.5 w-2.5 text-emerald-600 shrink-0" />
                                      <span className="truncate max-w-[85px]">{booking.operator}</span>
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[9.5px] font-bold bg-amber-50 border border-amber-300 border-dashed text-amber-900 shrink-0 shadow-2xs">
                                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse shrink-0" />
                                      <span className="truncate max-w-[75px]">{booking.operator}</span>
                                      <span className="text-[8px] opacity-75 font-normal">Draft</span>
                                    </span>
                                  )}
                                </div>

                                <span className="shrink-0 flex items-center gap-0.5 text-[9.5px] font-semibold text-slate-600 bg-white/70 px-1 rounded">
                                  <Clock className="h-2.5 w-2.5 inline" />
                                  {timeRangeLabel(booking)}
                                </span>
                              </div>
                            )}
                            {!isNarrow && (
                              <span className="mt-0.5 truncate text-[10.5px] font-medium text-slate-600">{booking.jobSiteName}</span>
                            )}
                            </div>
                            {cleanupPercent > 0 && (
                              <StripLabel
                                kind="Clean-up"
                                range={hourRangeLabel(booking.pourHour + booking.pourHours, booking.startHour + booking.durationHours)}
                                percent={cleanupPercent}
                                className="rounded-r-lg"
                              />
                            )}
                          </DraggableCard>
                        );
                      })}
                      <TravelConnectors ordered={ordered} trackOf={trackOf} />
                    </div>

                    {/* Layer C: where the dragged card would land, over everything on this row */}
                    {draggedBooking && dropTarget?.pumpId === pump.id && (
                      <div className="grid grid-cols-[repeat(24,minmax(0,1fr))] absolute inset-0 p-1.5 pointer-events-none z-20">
                        <div
                          className={cn(
                            'flex items-end rounded-lg border-2 border-dashed border-brand bg-brand-light/60 p-1.5',
                            COL_STARTS[Math.max(0, Math.min(23, Math.floor(dropTarget.startHour)))],
                            COL_SPANS[
                              Math.min(
                                Math.max(1, Math.round(draggedBooking.durationHours)),
                                24 - Math.max(0, Math.min(23, Math.floor(dropTarget.startHour))),
                              ) - 1
                            ],
                          )}
                        >
                          <span className="truncate rounded bg-white/90 px-1.5 py-0.5 text-[10px] font-bold text-brand shadow-2xs">
                            {clockFromHour(dropTarget.startHour)}
                          </span>
                        </div>
                      </div>
                    )}
                  </DroppableLane>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>

    {/* The card that follows the pointer or finger. No fly-back: the card is moved at once on drop. */}
    <DragOverlay dropAnimation={null}>
      {draggedBooking && (
        <div
          ref={overlayRef}
          className="flex h-full cursor-grabbing flex-col justify-between overflow-hidden rounded-lg border border-brand/50 border-l-[3.5px] border-l-brand bg-white p-2 shadow-xl ring-2 ring-brand/20"
        >
          <span className="truncate text-xs font-bold text-slate-900">{draggedBooking.customerName}</span>
          <span className="truncate text-[10px] font-semibold text-slate-500">
            {dropTarget ? `Drop at ${clockFromHour(dropTarget.startHour)}` : timeRangeLabel(draggedBooking)}
          </span>
        </div>
      )}
    </DragOverlay>
    </DndContext>
    </TooltipProvider>
  );
}
