"use client";

import { useEffect } from "react";
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
import { PumpLane, ScheduleBooking } from "./schedule-types";
import { toast } from "sonner";
import { Clock, HardHat, MapPin, Truck } from "lucide-react";

const bookingSchema = z.object({
  customerName: z.string().min(2, "Customer name is required"),
  jobSiteName: z.string().min(2, "Job site name is required"),
  pumpId: z.string().min(1, "Please select a pump"),
  startHour: z.number().min(5).max(17),
  durationHours: z.number().min(1).max(10),
  volumeYards: z.number().min(1, "Volume is required"),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

interface QuickBookingDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  pumps: PumpLane[];
  initialPumpId?: string;
  initialHour?: number;
  onAddBooking: (booking: ScheduleBooking) => void;
}

export function QuickBookingDrawer({
  isOpen,
  onOpenChange,
  pumps,
  initialPumpId,
  initialHour,
  onAddBooking,
}: QuickBookingDrawerProps) {
  const {
    register,
    handleSubmit,
    reset,
    setValue,
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
    },
  });

  useEffect(() => {
    if (isOpen) {
      if (initialPumpId) setValue("pumpId", initialPumpId);
      if (initialHour) setValue("startHour", initialHour);
    }
  }, [isOpen, initialPumpId, initialHour, setValue]);

  const onSubmit = (data: BookingFormValues) => {
    const selectedPump = pumps.find((p) => p.id === data.pumpId);
    const uniqueId = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : "booking-new";
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
      status: "onsite",
    };

    onAddBooking(newBooking);
    toast.success("Booking Created (15s Dispatch)", {
      description: `${data.customerName} on ${selectedPump?.code || "Pump"} at ${data.startHour}:00 AM`,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md p-6 bg-white flex flex-col justify-between">
        <div>
          <SheetHeader className="p-0 pb-4 border-b border-slate-200">
            <SheetTitle className="text-lg font-bold text-slate-900 tracking-tight">
              Quick Order Booking
            </SheetTitle>
            <SheetDescription className="text-xs text-slate-500">
              Book a pour order in under 15 seconds. Assign equipment and time slot.
            </SheetDescription>
          </SheetHeader>

          <form id="quick-booking-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-5">
            {/* Customer Name */}
            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                <HardHat className="h-3.5 w-3.5 text-slate-400" />
                <span>Customer / Contractor</span>
              </label>
              <input
                {...register("customerName")}
                placeholder="e.g. Turner Construction"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D7A7F]/20 focus:border-[#0D7A7F] transition-all"
              />
              {errors.customerName && (
                <p className="text-[11px] text-red-500 mt-1">{errors.customerName.message}</p>
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
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D7A7F]/20 focus:border-[#0D7A7F] transition-all"
              />
              {errors.jobSiteName && (
                <p className="text-[11px] text-red-500 mt-1">{errors.jobSiteName.message}</p>
              )}
            </div>

            {/* Equipment / Pump Selection */}
            <div>
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                <Truck className="h-3.5 w-3.5 text-slate-400" />
                <span>Assigned Rig</span>
              </label>
              <select
                {...register("pumpId")}
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D7A7F]/20 focus:border-[#0D7A7F] transition-all cursor-pointer"
              >
                {pumps.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.code} ({p.name}) &bull; {p.operator || "No Operator"}
                  </option>
                ))}
              </select>
              {errors.pumpId && (
                <p className="text-[11px] text-red-500 mt-1">{errors.pumpId.message}</p>
              )}
            </div>

            {/* Time & Duration Row */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5 mb-1">
                  <Clock className="h-3.5 w-3.5 text-slate-400" />
                  <span>Start Time</span>
                </label>
                <select
                  {...register("startHour", { valueAsNumber: true })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D7A7F]/20 focus:border-[#0D7A7F] transition-all cursor-pointer"
                >
                  {[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((h) => (
                    <option key={h} value={h}>
                      {h <= 12 ? `${h}:00 AM` : `${h - 12}:00 PM`}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 mb-1 block">
                  Est. Duration (Hours)
                </label>
                <select
                  {...register("durationHours", { valueAsNumber: true })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D7A7F]/20 focus:border-[#0D7A7F] transition-all cursor-pointer"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((d) => (
                    <option key={d} value={d}>
                      {d} {d === 1 ? "hour" : "hours"}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Estimated Yards */}
            <div>
              <label className="text-xs font-semibold text-slate-700 mb-1 block">
                Estimated Volume (Yards &bull; yd³)
              </label>
              <input
                type="number"
                {...register("volumeYards", { valueAsNumber: true })}
                placeholder="120"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#0D7A7F]/20 focus:border-[#0D7A7F] transition-all"
              />
              {errors.volumeYards && (
                <p className="text-[11px] text-red-500 mt-1">{errors.volumeYards.message}</p>
              )}
            </div>
          </form>
        </div>

        {/* Footer Actions */}
        <div className="pt-4 border-t border-slate-200 flex items-center gap-3">
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
            className="flex-1 h-9 rounded-lg bg-[#0D7A7F] hover:bg-[#0B6569] text-white text-xs font-semibold shadow-2xs"
          >
            Confirm Booking
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
