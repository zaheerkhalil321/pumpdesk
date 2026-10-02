"use client";

import { useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { AppSelect } from "@/components/ui/app-select";
import { BookingStatus, PumpLane, ScheduleBooking } from "./schedule-types";
import { toast } from "sonner";
import { Clock, HardHat, MapPin, Truck, Trash2, Activity } from "lucide-react";

const bookingSchema = z.object({
  customerName: z.string().min(2, "Customer name is required"),
  jobSiteName: z.string().min(2, "Job site name is required"),
  pumpId: z.string().min(1, "Please select a pump"),
  startHour: z.number().min(5).max(17),
  durationHours: z.number().min(1).max(12),
  volumeYards: z.number().min(1, "Volume is required"),
  status: z.enum(["travel", "onsite", "washout"]),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface QuickBookingDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  pumps: PumpLane[];
  initialPumpId?: string;
  initialHour?: number;
  editingBooking?: ScheduleBooking | null;
  onAddBooking: (booking: ScheduleBooking) => void;
  onUpdateBooking?: (booking: ScheduleBooking) => void;
  onDeleteBooking?: (bookingId: string) => void;
}

export function QuickBookingDrawer({
  isOpen,
  onOpenChange,
  pumps,
  initialPumpId,
  initialHour,
  editingBooking,
  onAddBooking,
  onUpdateBooking,
  onDeleteBooking,
}: QuickBookingDrawerProps) {
  const isEditMode = Boolean(editingBooking);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BookingFormValues>({
    resolver: zodResolver(bookingSchema),
    defaultValues: {
      customerName: "",
      jobSiteName: "",
      pumpId: initialPumpId || pumps[0]?.id || "",
      startHour: initialHour || 7,
      durationHours: 3,
      volumeYards: 120,
      status: "onsite",
    },
  });

  const pumpIdVal = watch("pumpId");
  const startHourVal = watch("startHour");
  const durationHoursVal = watch("durationHours");
  const statusVal = watch("status");

  const pumpOptions = useMemo(
    () =>
      pumps.map((p) => ({
        value: p.id,
        label: `${p.code} · ${p.name}`,
        description: p.operator || "No Operator",
      })),
    [pumps]
  );

  const startHourOptions = useMemo(
    () =>
      [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((h) => ({
        value: String(h),
        label: h <= 12 ? `${h}:00 AM` : `${h - 12}:00 PM`,
      })),
    []
  );

  const durationOptions = useMemo(
    () =>
      [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((d) => ({
        value: String(d),
        label: `${d} ${d === 1 ? "hour" : "hours"}`,
      })),
    []
  );

  const statusOptions = useMemo(
    () => [
      { value: "onsite", label: "On site (Active Pour)" },
      { value: "travel", label: "Travel (En Route)" },
      { value: "washout", label: "Washout & return" },
    ],
    []
  );

  useEffect(() => {
    if (isOpen) {
      if (editingBooking) {
        setValue("customerName", editingBooking.customerName);
        setValue("jobSiteName", editingBooking.jobSiteName);
        setValue("pumpId", editingBooking.pumpId);
        setValue("startHour", editingBooking.startHour);
        setValue("durationHours", editingBooking.durationHours);
        setValue("volumeYards", editingBooking.volumeYards);
        setValue("status", editingBooking.status);
      } else {
        setValue("customerName", "");
        setValue("jobSiteName", "");
        setValue("pumpId", initialPumpId || pumps[0]?.id || "");
        setValue("startHour", initialHour || 7);
        setValue("durationHours", 3);
        setValue("volumeYards", 120);
        setValue("status", "onsite");
      }
    }
  }, [isOpen, editingBooking, initialPumpId, initialHour, pumps, setValue]);

  const onSubmit = (data: BookingFormValues) => {
    const selectedPump = pumps.find((p) => p.id === data.pumpId);

    if (editingBooking && onUpdateBooking) {
      const updatedBooking: ScheduleBooking = {
        ...editingBooking,
        customerName: data.customerName,
        jobSiteName: data.jobSiteName,
        pumpId: data.pumpId,
        startHour: data.startHour,
        durationHours: data.durationHours,
        volumeYards: data.volumeYards,
        status: data.status as BookingStatus,
      };

      onUpdateBooking(updatedBooking);
      toast.success("Booking Updated", {
        description: `${data.customerName} on ${selectedPump?.code || "Pump"} (${data.durationHours}h)`,
      });
    } else {
      const uniqueId =
        typeof crypto !== "undefined" && crypto.randomUUID
          ? crypto.randomUUID()
          : "booking-new";
      const shortCode = uniqueId.slice(0, 4).toUpperCase();
      const newBooking: ScheduleBooking = {
        id: `ord-${uniqueId}`,
        orderNumber: `ORD-${shortCode}`,
        pumpId: data.pumpId,
        customerName: data.customerName,
        jobSiteName: data.jobSiteName,
        startHour: data.startHour,
        durationHours: data.durationHours,
        volumeYards: data.volumeYards,
        status: data.status as BookingStatus,
      };

      onAddBooking(newBooking);
      toast.success("Booking Created (15s Dispatch)", {
        description: `${data.customerName} on ${selectedPump?.code || "Pump"} at ${data.startHour}:00 AM`,
      });
    }

    reset();
    onOpenChange(false);
  };

  const handleDelete = () => {
    if (editingBooking && onDeleteBooking) {
      onDeleteBooking(editingBooking.id);
      toast.info("Booking Cancelled", {
        description: `Order ${editingBooking.orderNumber} was removed from the schedule.`,
      });
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-6 bg-white flex flex-col justify-between"
      >
        <div>
          <SheetHeader className="p-0 pb-4 border-b border-slate-200">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg font-bold text-slate-900 tracking-tight">
                {isEditMode ? `Edit Order • ${editingBooking?.orderNumber}` : "Quick Order Booking"}
              </SheetTitle>
              {isEditMode && (
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand bg-brand-light px-2 py-0.5 rounded-full">
                  Active Pour
                </span>
              )}
            </div>
            <SheetDescription className="text-xs text-slate-500">
              {isEditMode
                ? "Update rig assignment, duration, or volume for this pour order."
                : "Book a pour order in under 15 seconds. Assign equipment and time slot."}
            </SheetDescription>
          </SheetHeader>

          <form
            id="quick-booking-form"
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-4 pt-5"
          >
            {/* Customer Name */}
            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                <HardHat className="h-3.5 w-3.5 text-slate-400" />
                <span>Customer / Contractor</span>
              </label>
              <input
                {...register("customerName")}
                placeholder="e.g. Turner Construction"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand transition-all"
              />
              {errors.customerName && (
                <p className="text-[11px] text-red-500 mt-1">
                  {errors.customerName.message}
                </p>
              )}
            </div>

            {/* Job Site */}
            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                <MapPin className="h-3.5 w-3.5 text-slate-400" />
                <span>Job Site Location</span>
              </label>
              <input
                {...register("jobSiteName")}
                placeholder="e.g. Dallas Medical Tower Phase 2"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:border-brand transition-all"
              />
              {errors.jobSiteName && (
                <p className="text-[11px] text-red-500 mt-1">
                  {errors.jobSiteName.message}
                </p>
              )}
            </div>

            {/* Equipment / Pump Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                <Truck className="h-3.5 w-3.5 text-slate-400" />
                <span>Assigned Rig</span>
              </label>
              <AppSelect
                value={pumpIdVal}
                onChange={(val) => setValue("pumpId", val, { shouldValidate: true })}
                options={pumpOptions}
                placeholder="Select pump..."
                error={Boolean(errors.pumpId)}
              />
              {errors.pumpId && (
                <p className="text-[11px] text-red-500 mt-1">
                  {errors.pumpId.message}
                </p>
              )}
            </div>

            {/* Time & Duration Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>Start Time</span>
                </label>
                <AppSelect
                  value={String(startHourVal)}
                  onChange={(val) => setValue("startHour", parseInt(val, 10), { shouldValidate: true })}
                  options={startHourOptions}
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Duration (Hours)
                </label>
                <AppSelect
                  value={String(durationHoursVal)}
                  onChange={(val) => setValue("durationHours", parseInt(val, 10), { shouldValidate: true })}
                  options={durationOptions}
                />
              </div>
            </div>

            {/* Estimated Yards & Pour Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Volume (yd³)
                </label>
                <input
                  type="number"
                  {...register("volumeYards", { valueAsNumber: true })}
                  placeholder="120"
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:border-brand transition-all"
                />
                {errors.volumeYards && (
                  <p className="text-[11px] text-red-500 mt-1">
                    {errors.volumeYards.message}
                  </p>
                )}
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                  <Activity className="h-3.5 w-3.5 text-slate-400" />
                  <span>Status</span>
                </label>
                <AppSelect
                  value={statusVal}
                  onChange={(val) => setValue("status", val as BookingStatus, { shouldValidate: true })}
                  options={statusOptions}
                />
              </div>
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center justify-between gap-3">
          {isEditMode ? (
            <>
              <Button
                type="button"
                variant="ghost"
                onClick={handleDelete}
                className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-medium gap-1.5 rounded-lg"
              >
                <Trash2 className="h-4 w-4" />
                <span>Delete</span>
              </Button>

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  className="h-9 px-3 rounded-lg border-slate-200 text-xs text-slate-600 hover:text-slate-900"
                >
                  Cancel
                </Button>
                <Button
                  form="quick-booking-form"
                  type="submit"
                  disabled={isSubmitting}
                  className="h-9 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-2xs"
                >
                  Save Changes
                </Button>
              </div>
            </>
          ) : (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1 h-9 rounded-lg border-slate-200 text-xs text-slate-600 hover:text-slate-900"
              >
                Cancel
              </Button>
              <Button
                form="quick-booking-form"
                type="submit"
                disabled={isSubmitting}
                className="flex-1 h-9 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-2xs"
              >
                Confirm Booking
              </Button>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
