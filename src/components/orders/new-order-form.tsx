"use client";
/* eslint-disable react-hooks/incompatible-library */

import { useEffect, useState, useMemo, useTransition } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ChevronRight,
  Clock,
  Plus,
  X,
  Info,
  Search,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppSelect } from "@/components/ui/app-select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { createOrder, getDayBlocks } from "@/features/orders/server/actions";
import { findOverlap } from "@/features/orders/conflicts";
import { reportAction } from "@/lib/action-feedback";
import { DatePicker } from "@/components/ui/date-picker";
import type { DayBlock, OrderFormContact, OrderFormOptions, OrderFormSite } from "@/features/orders/types";
import { AddSiteModal } from "@/components/customers/add-site-modal";
import { SiteCombobox } from "@/components/orders/site-combobox";
import { SupplierCombobox } from "@/components/orders/supplier-combobox";
import { ensureSupplier } from "@/features/suppliers/ensure";
import { NewContactModal } from "@/components/contacts/new-contact-modal";

// Common pour types. These move to Settings > Lists once that is saved in the database.
const POUR_TYPE_OPTIONS = [
  { value: "slab", label: "Slab on grade" },
  { value: "footings", label: "Footings" },
  { value: "walls", label: "Walls" },
  { value: "columns", label: "Columns" },
];

const newOrderSchema = z.object({
  status: z.enum(["Pending", "Confirmed"]),
  customer: z.string().min(1, "Customer name is required"),
  jobContact: z.string().optional(),
  jobSite: z.string().min(2, "Town or site address is required"),
  jobName: z.string().optional(),

  date: z.string().min(1, "Pour date is required"),
  pourTime: z.string().min(1, "Pour start time is required"),
  arriveBy: z.string().min(1, "Arrival time is required"),
  estimatedFinish: z.string().min(1, "Estimated finish time is required"),
  prepDuration: z.string(),
  pumpingDuration: z.string(),
  cleanupDuration: z.string(),

  supplier: z.string().optional(),
  estimatedVolume: z
    .string()
    .min(1, "Estimated volume (yd³) is required")
    .refine(
      (val) => {
        const n = Number(val);
        return !isNaN(n) && n >= 1 && n <= 10000;
      },
      { message: "Volume must be between 1 and 10,000 yd³" }
    ),
  pourType: z.string().min(1, "Please select a pour type"),
  linesOnSite: z.boolean(),
  customerDetails: z.string().optional(),

  minPumpSize: z.string().min(1, "Minimum pump size is required"),
  billingService: z.string().optional(),
  assignedPump: z.string(),
  assignedOperator: z.string(),
  operatorInstructions: z.string().optional(),

  internalNote: z.string().optional(),

  purchaseOrder: z.string().optional(),
  collectOnDelivery: z.boolean(),
});

function parseMinutes(durationStr: string): number {
  if (!durationStr) return 0;
  const hrMatch = durationStr.match(/(\d+(?:\.\d+)?)\s*hr/i);
  if (hrMatch) return Math.round(parseFloat(hrMatch[1]) * 60);
  const minMatch = durationStr.match(/(\d+)\s*min/i);
  if (minMatch) return parseInt(minMatch[1], 10);
  return 0;
}

function parseTimeToMinutes(timeStr: string): number {
  if (!timeStr) return 14 * 60;
  const match = timeStr.match(/(\d+):?(\d*)\s*(AM|PM)?/i);
  if (!match) return 14 * 60;
  let hour = parseInt(match[1], 10);
  const min = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3]?.toUpperCase();
  if (period === 'PM' && hour < 12) hour += 12;
  if (period === 'AM' && hour === 12) hour = 0;
  return hour * 60 + min;
}

function formatMinutesToTime(totalMinutes: number): string {
  const mins = ((totalMinutes % 1440) + 1440) % 1440;
  const hour24 = Math.floor(mins / 60);
  const minutes = mins % 60;
  const period = hour24 >= 12 ? 'PM' : 'AM';
  const hour12 = hour24 % 12 === 0 ? 12 : hour24 % 12;
  const minStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hour12}:${minStr} ${period}`;
}

/** Every step from startHour up to, but not including, endHour. */
function generateTimeOptions(startHour = 0, endHour = 24, stepMinutes = 15): { value: string; label: string }[] {
  const options: { value: string; label: string }[] = [];
  for (let h = startHour; h < endHour; h++) {
    for (let m = 0; m < 60; m += stepMinutes) {
      const period = h >= 12 ? 'PM' : 'AM';
      const displayHour = h % 12 === 0 ? 12 : h % 12;
      const displayMin = m < 10 ? `0${m}` : `${m}`;
      const label = `${displayHour}:${displayMin} ${period}`;
      options.push({ value: label, label });
    }
  }
  return options;
}

const ALL_TIME_OPTIONS = generateTimeOptions(0, 24, 15);

type NewOrderFormValues = z.infer<typeof newOrderSchema>;

interface NewOrderFormProps {
  options: OrderFormOptions;
  /** Today in the company timezone (yyyy-MM-dd): the default pour date. */
  todayIso: string;
}

export function NewOrderForm({ options, todayIso }: NewOrderFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read search parameters passed from schedule slot or quick order modal
  const paramStatus = searchParams.get("status") as "Pending" | "Confirmed" | null;
  const paramVolume = searchParams.get("volume");
  const paramPourTime = searchParams.get("pourTime");
  const paramHour = searchParams.get("hour");
  const paramDate = searchParams.get("date");
  const paramPump = searchParams.get("pumpId");
  const paramCustomer = searchParams.get("customer");
  const paramSite = searchParams.get("site");
  const paramTown = searchParams.get("town");
  const paramOperator = searchParams.get("operator");

  // Determine initial pour time based on clicked time slot
  const initialPourTime = useMemo(() => {
    if (paramPourTime) return paramPourTime;
    if (paramHour) {
      const h = parseInt(paramHour, 10);
      if (!isNaN(h)) {
        return h === 12 ? "12:00 PM" : h < 12 ? `${h}:00 AM` : `${h - 12}:00 PM`;
      }
    }
    return "7:00 AM";
  }, [paramPourTime, paramHour]);

  // Dynamically calculate initial arrival (pour - 30m) & finish (pour + 2h + 30m)
  const initialCalculatedTimes = useMemo(() => {
    const pourMins = parseTimeToMinutes(initialPourTime);
    const arriveMins = pourMins - 30;
    const finishMins = pourMins + 120 + 30;
    return {
      arriveBy: formatMinutesToTime(arriveMins),
      estimatedFinish: formatMinutesToTime(finishMins),
    };
  }, [initialPourTime]);

  const initialJobSite = useMemo(() => {
    if (paramSite && paramTown) return `${paramSite}, ${paramTown}`;
    if (paramSite) return paramSite;
    if (paramTown) return paramTown;
    return "";
  }, [paramSite, paramTown]);

  const {
    register,
    handleSubmit,
    setValue,
    getValues,
    watch,
    formState: { errors },
  } = useForm<NewOrderFormValues>({
    resolver: zodResolver(newOrderSchema),
    defaultValues: {
      status: paramStatus || "Pending",
      customer: paramCustomer || "",
      jobContact: "",
      jobSite: initialJobSite,
      jobName: "",
      date: paramDate && /^\d{4}-\d{2}-\d{2}$/.test(paramDate) ? paramDate : todayIso,
      pourTime: initialPourTime,
      arriveBy: initialCalculatedTimes.arriveBy,
      estimatedFinish: initialCalculatedTimes.estimatedFinish,
      prepDuration: "30 min",
      pumpingDuration: "2 hr",
      cleanupDuration: "30 min",
      supplier: "",
      estimatedVolume: paramVolume || "60",
      pourType: "",
      linesOnSite: false,
      customerDetails: "",
      minPumpSize: "",
      billingService: "",
      assignedPump: paramPump || "unassigned",
      // A pump chosen before the form opened brings its default operator, unless one was named too.
      assignedOperator:
        options.operators.find((o) => o.name === paramOperator)?.id ??
        options.operators.find((o) => o.id === options.pumps.find((p) => p.id === paramPump)?.defaultOperatorId)?.id ??
        "unassigned",
      operatorInstructions: "",
      internalNote: "",
      purchaseOrder: "",
      collectOnDelivery: false,
    },
    mode: "onBlur",
  });

  const [linesOnSite, setLinesOnSite] = useState(false);
  const [collectOnDelivery, setCollectOnDelivery] = useState(false);

  const updateCalculatedTimes = (
    pourTimeVal: string,
    prepVal: string,
    pumpingVal: string,
    cleanupVal: string
  ) => {
    const pourMins = parseTimeToMinutes(pourTimeVal || "2:00 PM");
    const prepMins = parseMinutes(prepVal || "30 min");
    const pumpingMins = parseMinutes(pumpingVal || "2 hr");
    const cleanupMins = parseMinutes(cleanupVal || "30 min");

    const arriveMins = pourMins - prepMins;
    const finishMins = pourMins + pumpingMins + cleanupMins;

    setValue("arriveBy", formatMinutesToTime(arriveMins), { shouldValidate: true });
    setValue("estimatedFinish", formatMinutesToTime(finishMins), { shouldValidate: true });
  };

  const toggleLinesOnSite = () => {
    const next = !linesOnSite;
    setLinesOnSite(next);
    setValue("linesOnSite", next);
  };

  const toggleCollectOnDelivery = () => {
    const next = !collectOnDelivery;
    setCollectOnDelivery(next);
    setValue("collectOnDelivery", next);
  };

  // Real records for the dropdowns, from the database.
  const selectedCustomer = options.customers.find((c) => c.name === watch("customer"));

  // Sites and contacts added from this form show up at once, before the page data reloads.
  // Extra equipment or supplies, one row each.
  const [extraItems, setExtraItems] = useState<{ name: string; quantity: string }[]>([{ name: "", quantity: "1" }]);
  const updateExtraItem = (index: number, change: Partial<{ name: string; quantity: string }>) =>
    setExtraItems((rows) => rows.map((row, i) => (i === index ? { ...row, ...change } : row)));
  // Optional extras on the pump section.
  const [showMaxSize, setShowMaxSize] = useState(false);
  const [maxPumpSize, setMaxPumpSize] = useState("");
  const [showSecondOperator, setShowSecondOperator] = useState(false);
  const [secondOperatorId, setSecondOperatorId] = useState("unassigned");

  const [isAddSiteOpen, setIsAddSiteOpen] = useState(false);
  const [addedSites, setAddedSites] = useState<{ customerId: string; site: OrderFormSite }[]>([]);
  const siteChoices = [
    ...(selectedCustomer?.sites ?? []),
    ...addedSites
      .filter(
        (added) =>
          added.customerId === selectedCustomer?.id &&
          !selectedCustomer.sites.some((site) => site.id === added.site.id),
      )
      .map((added) => added.site),
  ];
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const [addedContacts, setAddedContacts] = useState<{ customerId: string; contact: OrderFormContact }[]>([]);
  const contactChoices = [
    ...(selectedCustomer?.contacts ?? []),
    ...addedContacts
      .filter(
        (added) =>
          added.customerId === selectedCustomer?.id &&
          !selectedCustomer.contacts.some((c) => c.id === added.contact.id),
      )
      .map((added) => added.contact),
  ];
  const pumpSizeOptions = useMemo(
    () => [...new Set(options.pumps.map((p) => p.sizeLabel).filter(Boolean))],
    [options.pumps],
  );

  const billingServiceOptions = useMemo(
    () =>
      options.pumps
        .filter((p) => p.hourlyRate)
        .map((p) => ({ value: p.id, label: `${p.code} · ${p.hourlyRate}` })),
    [options.pumps],
  );

  const handleCustomerChange = (name: string) => {
    setValue("customer", name, { shouldValidate: true });
    const customer = options.customers.find((c) => c.name === name);
    // A new customer means a new contact; offer the customer's first contact and site.
    setValue("jobContact", customer?.contacts[0]?.name ?? "");
    setValue("jobSite", customer?.sites[0]?.address ?? "", { shouldValidate: Boolean(customer?.sites[0]) });
  };

  const [isSaving, startSaving] = useTransition();

  // Pours already on pumps for the chosen day, fetched once per day, to warn about an overlap.
  const [dayBlocks, setDayBlocks] = useState<Record<string, DayBlock[]>>({});
  const chosenDate = watch("date");
  useEffect(() => {
    if (!chosenDate || dayBlocks[chosenDate]) return;
    let cancelled = false;
    getDayBlocks({ date: chosenDate }).then((result) => {
      if (!cancelled && result.ok) setDayBlocks((prev) => ({ ...prev, [chosenDate]: result.data }));
    });
    return () => {
      cancelled = true;
    };
  }, [chosenDate, dayBlocks]);

  // Only a warning: a dispatcher can still save a time that overlaps another pour.
  const chosenPump = watch("assignedPump");
  const startMinutes = parseTimeToMinutes(watch("pourTime"));
  let endMinutes = parseTimeToMinutes(watch("estimatedFinish") || "");
  if (endMinutes <= startMinutes) endMinutes += 1440;
  const clash =
    chosenPump && chosenPump !== "unassigned"
      ? findOverlap(dayBlocks[chosenDate] ?? [], {
          pumpId: chosenPump,
          startHour: startMinutes / 60,
          durationHours: Math.max(0.25, (endMinutes - startMinutes) / 60),
        })
      : null;
  const clashPump = options.pumps.find((p) => p.id === chosenPump);

  const handleCreateOrder = (data: NewOrderFormValues) => {
    const pumpId = data.assignedPump !== "unassigned" ? data.assignedPump : null;
    const operatorId = data.assignedOperator !== "unassigned" ? data.assignedOperator : null;
    const contact = contactChoices.find((c) => c.name === data.jobContact);
    const savedSite = siteChoices.find((site) => site.address === data.jobSite);
    const pourTypeLabel =
      POUR_TYPE_OPTIONS.find((o) => o.value === data.pourType)?.label ?? data.pourType;

    const payload = {
      customerId: selectedCustomer?.id ?? "",
      jobSiteId: savedSite?.id ?? null,
      siteLabel: data.jobSite,
      jobName: data.jobName ?? "",
      pourType: pourTypeLabel,
      supplierName: data.supplier ?? "",
      date: data.date,
      pourTime: data.pourTime,
      arriveBy: data.arriveBy,
      estimatedFinish: data.estimatedFinish,
      prepMinutes: parseMinutes(data.prepDuration),
      pumpMinutes: parseMinutes(data.pumpingDuration),
      cleanupMinutes: parseMinutes(data.cleanupDuration),
      travelMinutes: 0,
      estimatedYards: Number(data.estimatedVolume),
      minPumpSize: data.minPumpSize,
      linesOnSite: data.linesOnSite,
      purchaseOrder: data.purchaseOrder ?? "",
      collectOnDelivery: data.collectOnDelivery,
      customerNotes: data.customerDetails ?? "",
      siteInstructions: data.operatorInstructions ?? "",
      internalNote: data.internalNote ?? "",
      billingService: billingServiceOptions.find((o) => o.value === data.billingService)?.label ?? "",
      bookingStatus: data.status === "Confirmed" ? ("confirmed" as const) : ("pending" as const),
      contactId: contact?.id ?? null,
      equipmentId: pumpId,
      employeeId: operatorId,
      maxPumpSize: showMaxSize ? maxPumpSize : "",
      extraItems: extraItems
        .filter((row) => row.name.trim())
        .map((row) => ({ name: row.name.trim(), quantity: Number(row.quantity) || 1 })),
      secondEmployeeId: showSecondOperator && secondOperatorId !== "unassigned" ? secondOperatorId : null,
    };

    startSaving(async () => {
      await ensureSupplier(data.supplier ?? "", options.suppliers);
      const result = await createOrder(payload);
      if (!reportAction(result, { entity: "order", refresh: () => router.refresh() })) return;
      toast.success("Order created", {
        description: `${data.customer} • ${result.data.job_number} saved as ${data.status}.`,
      });
      router.push("/schedule");
    });
  };

  const onError = () => {
    toast.error("Form Validation Error", {
      description: "Please fix all required fields highlighted in red below.",
    });
  };

  const hasErrors = Object.keys(errors).length > 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-5">
      {/* ── Breadcrumb ── */}
      <nav className="flex items-center gap-1.5 text-xs text-slate-500">
        <Link
          href="/schedule"
          className="hover:text-slate-900 transition-colors font-medium"
        >
          Schedule
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
        <span className="font-semibold text-slate-900">
          New order
        </span>
      </nav>

      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 truncate">
          New order
        </h1>

        <div className="flex flex-wrap items-center justify-between sm:justify-end gap-2.5 sm:gap-3 w-full sm:w-auto">
          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600 shrink-0">
            <span className="font-medium">Status:</span>
            <div className="w-28 sm:w-32">
              <AppSelect
                size="sm"
                value={watch("status")}
                onChange={(val) => setValue("status", val as "Pending" | "Confirmed")}
                options={["Pending", "Confirmed"]}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/schedule")}
              className="h-9 px-3 sm:px-4 rounded-lg border-slate-200 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
            >
              Cancel
            </Button>

            <Button
              form="full-order-form"
              type="submit"
              disabled={isSaving}
              className="h-9 px-4 sm:px-5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-semibold shadow-2xs transition-all cursor-pointer active:scale-98 shrink-0 whitespace-nowrap"
            >
              {isSaving ? "Saving..." : "Create order"}
            </Button>
          </div>
        </div>
      </div>

      {/* ── Validation Warning Alert (if errors exist) ── */}
      {hasErrors && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-900 shadow-2xs">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0" />
          <span className="font-semibold">
            Please fill in the required fields highlighted in red below before creating your order.
          </span>
        </div>
      )}

      {/* ── Main Form Form Element ── */}
      <form
        id="full-order-form"
        onSubmit={handleSubmit(handleCreateOrder, onError)}
        noValidate
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* ════ LEFT COLUMN ════ */}
          <div className="space-y-5">
            {/* 1. Customer & site Card */}
            <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Customer & site
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Customer */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Customer <span className="text-red-500">*</span>
                  </label>
                  <AppSelect
                    value={watch("customer")}
                    onChange={handleCustomerChange}
                    options={options.customers.map((c) => c.name)}
                    placeholder="Select customer *"
                    icon={Search}
                    error={Boolean(errors.customer)}
                  />
                  {errors.customer && (
                    <p className="text-[11px] text-red-500 font-medium mt-1">
                      {errors.customer.message}
                    </p>
                  )}
                </div>

                {/* Job contact */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Job contact
                  </label>
                  <AppSelect
                    value={watch("jobContact") || ""}
                    onChange={(val) => setValue("jobContact", val)}
                    placeholder="Select contact"
                    options={contactChoices.map((c) => ({
                      value: c.name,
                      label: c.name,
                      description: c.role || undefined,
                    }))}
                  />
                  <div className="mt-1 text-[11px]">
                    <button
                      type="button"
                      onClick={() => {
                        if (!selectedCustomer) {
                          toast.info("Pick a customer first");
                          return;
                        }
                        setIsAddContactOpen(true);
                      }}
                      className="text-brand hover:underline font-medium cursor-pointer inline-flex items-center gap-0.5"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add contact</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Job site */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Town or site address <span className="text-red-500">*</span>
                  </label>
                  <span className="text-[10.5px] text-amber-700 font-medium">Town required for dispatch</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 min-w-0">
                    <SiteCombobox
                      value={watch("jobSite")}
                      onChange={(value) => setValue("jobSite", value, { shouldValidate: true })}
                      sites={siteChoices}
                      error={Boolean(errors.jobSite)}
                      placeholder="Enter town, cross streets, or street address"
                    />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      if (!selectedCustomer) {
                        toast.info("Pick a customer first");
                        return;
                      }
                      setIsAddSiteOpen(true);
                    }}
                    className="h-9 px-3 text-xs font-medium text-slate-700 border-slate-200 hover:bg-slate-50 gap-1 shrink-0 cursor-pointer"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>New site</span>
                  </Button>
                </div>
                {errors.jobSite && (
                  <p className="text-[11px] text-red-500 font-medium mt-1">
                    {errors.jobSite.message}
                  </p>
                )}
              </div>

              {/* Job name / lot */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Job name / lot
                </label>
                <input
                  type="text"
                  {...register("jobName")}
                  placeholder="Optional"
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 outline-none focus:border-brand placeholder:text-slate-400"
                />
              </div>
            </div>

            {/* 2. Pour details Card */}
            <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Pour details
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3.5">
                {/* Concrete supplier (Optional) */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                    Concrete supplier
                  </label>
                  <SupplierCombobox
                    value={watch("supplier") ?? ""}
                    onChange={(value) => setValue("supplier", value)}
                    suppliers={options.suppliers}
                    placeholder="Search or type a supplier"
                    className="h-9"
                  />
                  {errors.supplier && (
                    <p className="text-[11px] text-red-500 font-medium mt-1">
                      {errors.supplier.message}
                    </p>
                  )}
                </div>

                {/* Estimated volume */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                    Estimated volume <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      min={1}
                      max={10000}
                      step={5}
                      {...register("estimatedVolume")}
                      placeholder="120"
                      className={cn(
                        "w-full h-9 pl-3 pr-10 rounded-lg border bg-white text-xs outline-none transition-colors [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none",
                        errors.estimatedVolume
                          ? "border-red-500 focus:border-red-500 text-red-900 bg-red-50/20"
                          : "border-slate-200 text-slate-900 focus:border-brand placeholder:text-slate-400"
                      )}
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 pointer-events-none select-none">
                      yd³
                    </span>
                  </div>
                  {errors.estimatedVolume && (
                    <p className="text-[11px] text-red-500 font-medium mt-1">
                      {errors.estimatedVolume.message}
                    </p>
                  )}
                </div>

                {/* Pour type */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1 whitespace-nowrap">
                    Pour type <span className="text-red-500">*</span>
                  </label>
                  <AppSelect
                    value={watch("pourType")}
                    onChange={(val) => setValue("pourType", val, { shouldValidate: true })}
                    placeholder="Select type"
                    options={POUR_TYPE_OPTIONS}
                    error={Boolean(errors.pourType)}
                  />
                  {errors.pourType && (
                    <p className="text-[11px] text-red-500 font-medium mt-1">
                      {errors.pourType.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Lines on site toggle */}
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  role="switch"
                  aria-checked={linesOnSite}
                  onClick={toggleLinesOnSite}
                  className={cn(
                    "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none",
                    linesOnSite ? "bg-brand" : "bg-slate-200"
                  )}
                >
                  <span
                    className={cn(
                      "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out",
                      linesOnSite ? "translate-x-4" : "translate-x-0"
                    )}
                  />
                </button>
                <span className="text-xs font-medium text-slate-700">
                  Lines on site
                </span>
              </div>

              {/* Customer-visible details */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Customer-visible details
                </label>
                <textarea
                  {...register("customerDetails")}
                  placeholder="Details shared with the customer"
                  rows={3}
                  className="w-full p-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 outline-none focus:border-brand placeholder:text-slate-400 resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* 3. Equipment & supplies Card */}
            <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Equipment & supplies
              </h2>

              <div className="space-y-2.5">
                {extraItems.map((row, index) => (
                  <div key={index} className="grid grid-cols-[1fr_5.5rem_auto] gap-3 items-end">
                    <div>
                      {index === 0 && (
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Item</label>
                      )}
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => updateExtraItem(index, { name: e.target.value })}
                        placeholder="e.g. Extra 10 ft hose"
                        aria-label={`Item ${index + 1}`}
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 outline-none focus:border-brand placeholder:text-slate-400"
                      />
                    </div>
                    <div>
                      {index === 0 && (
                        <label className="text-xs font-semibold text-slate-700 block mb-1">Quantity</label>
                      )}
                      <input
                        type="number"
                        min={1}
                        max={100}
                        step={1}
                        value={row.quantity}
                        onChange={(e) => updateExtraItem(index, { quantity: e.target.value })}
                        aria-label={`Quantity ${index + 1}`}
                        className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 outline-none focus:border-brand"
                      />
                    </div>
                    <button
                      type="button"
                      aria-label={`Remove item ${index + 1}`}
                      onClick={() =>
                        setExtraItems((rows) => (rows.length > 1 ? rows.filter((_, i) => i !== index) : [{ name: "", quantity: "1" }]))
                      }
                      className="h-9 w-9 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setExtraItems((rows) => (rows.length >= 20 ? rows : [...rows, { name: "", quantity: "1" }]))}
                className="text-xs text-brand font-semibold hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add item</span>
              </button>

              {/* Internal note */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Internal note
                </label>
                <textarea
                  {...register("internalNote")}
                  placeholder="Visible to your team only"
                  rows={2}
                  className="w-full p-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 outline-none focus:border-brand placeholder:text-slate-400 resize-none leading-relaxed"
                />
              </div>
            </div>
          </div>

          {/* ════ RIGHT COLUMN ════ */}
          <div className="space-y-5">
            {/* 1. Date & timing Card */}
            <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Date & timing
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {/* Date */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <DatePicker
                    ariaLabel="Pour date"
                    size="sm"
                    value={watch("date")}
                    onChange={(value) => setValue("date", value, { shouldValidate: true })}
                  />
                  {errors.date && (
                    <p className="text-[11px] text-red-500 font-medium mt-1">
                      {errors.date.message}
                    </p>
                  )}
                </div>

                {/* Pour time */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Pour time <span className="text-red-500">*</span>
                  </label>
                  <AppSelect
                    value={watch("pourTime")}
                    onChange={(val) => {
                      setValue("pourTime", val, { shouldValidate: true });
                      updateCalculatedTimes(val, getValues("prepDuration"), getValues("pumpingDuration"), getValues("cleanupDuration"));
                    }}
                    icon={Clock}
                    options={ALL_TIME_OPTIONS}
                    error={Boolean(errors.pourTime)}
                  />
                  {errors.pourTime && (
                    <p className="text-[11px] text-red-500 font-medium mt-1">
                      {errors.pourTime.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Arrive by & Estimated finish */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Arrive by
                    </label>
                    <span className="text-[10px] font-semibold text-brand bg-brand-light px-1.5 py-0.2 rounded">
                      Auto
                    </span>
                  </div>
                  <AppSelect
                    value={watch("arriveBy") || "8:30 AM"}
                    onChange={(val) => setValue("arriveBy", val, { shouldValidate: true })}
                    icon={Clock}
                    options={ALL_TIME_OPTIONS}
                    error={Boolean(errors.arriveBy)}
                  />
                  {errors.arriveBy && (
                    <p className="text-[11px] text-red-500 font-medium mt-1">
                      {errors.arriveBy.message}
                    </p>
                  )}
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-700 block">
                      Estimated finish
                    </label>
                    <span className="text-[10px] font-semibold text-brand bg-brand-light px-1.5 py-0.2 rounded">
                      Auto
                    </span>
                  </div>
                  <AppSelect
                    value={watch("estimatedFinish") || "11:30 AM"}
                    onChange={(val) => setValue("estimatedFinish", val, { shouldValidate: true })}
                    icon={Clock}
                    options={ALL_TIME_OPTIONS}
                    error={Boolean(errors.estimatedFinish)}
                  />
                  {errors.estimatedFinish && (
                    <p className="text-[11px] text-red-500 font-medium mt-1">
                      {errors.estimatedFinish.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Durations Row: Prep, Pumping, Cleanup */}
              <div className="grid grid-cols-3 gap-2.5">
                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Prep
                  </label>
                  <AppSelect
                    size="sm"
                    value={watch("prepDuration")}
                    onChange={(val) => {
                      setValue("prepDuration", val);
                      updateCalculatedTimes(getValues("pourTime"), val, getValues("pumpingDuration"), getValues("cleanupDuration"));
                    }}
                    options={["15 min", "30 min", "45 min", "1 hr"]}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Pumping
                  </label>
                  <AppSelect
                    size="sm"
                    value={watch("pumpingDuration")}
                    onChange={(val) => {
                      setValue("pumpingDuration", val);
                      updateCalculatedTimes(getValues("pourTime"), getValues("prepDuration"), val, getValues("cleanupDuration"));
                    }}
                    options={["1 hr", "2 hr", "3 hr", "4 hr", "5 hr"]}
                  />
                </div>

                <div>
                  <label className="text-[11px] font-medium text-slate-600 block mb-1">
                    Cleanup
                  </label>
                  <AppSelect
                    size="sm"
                    value={watch("cleanupDuration")}
                    onChange={(val) => {
                      setValue("cleanupDuration", val);
                      updateCalculatedTimes(getValues("pourTime"), getValues("prepDuration"), getValues("pumpingDuration"), val);
                    }}
                    options={["15 min", "30 min", "45 min", "1 hr"]}
                  />
                </div>
              </div>

              <p className="text-[10.5px] text-slate-400 leading-tight">
                Arrival and finish automatically calculated from durations.
              </p>
            </div>

            {/* 2. Pump & crew Card */}
            <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Pump & crew
              </h2>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-slate-700">
                    Minimum pump size <span className="text-red-500">*</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setShowMaxSize((on) => !on);
                      setMaxPumpSize("");
                    }}
                    className="text-[11px] text-brand hover:underline font-medium cursor-pointer inline-flex items-center gap-0.5"
                  >
                    {showMaxSize ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    <span>{showMaxSize ? "Remove size restriction" : "Maximum size restriction"}</span>
                  </button>
                </div>
                <AppSelect
                  value={watch("minPumpSize")}
                  onChange={(val) => setValue("minPumpSize", val, { shouldValidate: true })}
                  options={pumpSizeOptions}
                  placeholder="Select minimum pump size"
                  error={Boolean(errors.minPumpSize)}
                />
                {errors.minPumpSize && (
                  <p className="text-[11px] text-red-500 font-medium mt-1">
                    {errors.minPumpSize.message}
                  </p>
                )}
                {showMaxSize && (
                  <div className="mt-2.5">
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Maximum pump size <span className="text-slate-400 font-normal">(the site cannot take a bigger pump)</span>
                    </label>
                    <AppSelect
                      value={maxPumpSize}
                      onChange={setMaxPumpSize}
                      options={pumpSizeOptions}
                      placeholder="Select maximum pump size"
                    />
                  </div>
                )}
              </div>

              {/* Billing service */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Billing service <span className="text-slate-400 font-normal">(optional)</span>
                </label>
                <AppSelect
                  value={watch("billingService")}
                  onChange={(val) => setValue("billingService", val, { shouldValidate: true })}
                  placeholder="Select billing service"
                  options={billingServiceOptions}
                  error={Boolean(errors.billingService)}
                />
                {errors.billingService ? (
                  <p className="text-[11px] text-red-500 font-medium mt-1">
                    {errors.billingService.message}
                  </p>
                ) : (
                  <p className="text-[10.5px] text-slate-400 mt-1 leading-tight">
                    Rate taken from the pump. Invoicing and rate cards come in a later release.
                  </p>
                )}
              </div>

              {/* Assigned pump & Operator */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Assigned pump
                  </label>
                  <AppSelect
                    value={watch("assignedPump")}
                    onChange={(val) => {
                      setValue("assignedPump", val);
                      // Swap in the pump's default operator, or clear it when it has none.
                      const defaultId = options.pumps.find((p) => p.id === val)?.defaultOperatorId;
                      setValue(
                        "assignedOperator",
                        options.operators.find((o) => o.id === defaultId)?.id ?? "unassigned",
                      );
                    }}
                    options={[{ value: "unassigned", label: "Unassigned" }, ...options.pumps.map((p) => ({ value: p.id, label: p.label }))]}
                  />
                </div>

                {clash && (
                  <p className="sm:col-span-2 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">
                    <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
                    <span>
                      {clashPump?.code ?? "This pump"} already has {clash.customerName} ({clash.orderNumber}) from{" "}
                      {formatMinutesToTime(clash.startHour * 60)} to{" "}
                      {formatMinutesToTime((clash.startHour + clash.durationHours) * 60)}. You can still save this order.
                    </span>
                  </p>
                )}

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Operator
                  </label>
                  <AppSelect
                    value={watch("assignedOperator")}
                    onChange={(val) => setValue("assignedOperator", val)}
                    options={[{ value: "unassigned", label: "Unassigned" }, ...options.operators.map((o) => ({ value: o.id, label: o.name }))]}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setShowSecondOperator((on) => !on);
                      setSecondOperatorId("unassigned");
                    }}
                    className="text-[11px] text-brand hover:underline font-medium mt-1 inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    {showSecondOperator ? <X className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
                    <span>{showSecondOperator ? "Remove additional operator" : "Additional operator"}</span>
                  </button>
                  {showSecondOperator && (
                    <div className="mt-2">
                      <label className="text-xs font-semibold text-slate-700 block mb-1">Additional operator</label>
                      <AppSelect
                        value={secondOperatorId}
                        onChange={setSecondOperatorId}
                        options={[
                          { value: "unassigned", label: "None" },
                          ...options.operators
                            .filter((o) => o.id !== watch("assignedOperator"))
                            .map((o) => ({ value: o.id, label: o.name })),
                        ]}
                      />
                    </div>
                  )}
                </div>
              </div>

              {/* Operator instructions */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Operator instructions
                </label>
                <textarea
                  {...register("operatorInstructions")}
                  placeholder="Access, setup or washout instructions"
                  rows={2}
                  className="w-full p-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 outline-none focus:border-brand placeholder:text-slate-400 resize-none leading-relaxed"
                />
              </div>
            </div>

            {/* 3. Billing & labels Card */}
            <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-2xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Billing & labels
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 items-center">
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Purchase order
                  </label>
                  <input
                    type="text"
                    {...register("purchaseOrder")}
                    placeholder="Optional"
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 outline-none focus:border-brand placeholder:text-slate-400"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Collect on delivery
                  </label>
                  <div className="pt-1">
                    <button
                      type="button"
                      role="switch"
                      aria-checked={collectOnDelivery}
                      onClick={toggleCollectOnDelivery}
                      className={cn(
                        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out outline-none",
                        collectOnDelivery ? "bg-brand" : "bg-slate-200"
                      )}
                    >
                      <span
                        className={cn(
                          "pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition duration-200 ease-in-out",
                          collectOnDelivery ? "translate-x-4" : "translate-x-0"
                        )}
                      />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </form>

      {/* ── Bottom Bar ── */}
      <div className="p-4 rounded-xl border border-slate-200/90 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <Info className="h-4 w-4 text-slate-400 shrink-0" />
          <span>Save as pending now. Assign a pump and operator before dispatch.</span>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/schedule")}
            className="flex-1 sm:flex-none h-9 px-4 rounded-lg border-slate-200 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer shrink-0"
          >
            Cancel
          </Button>

          <Button
            form="full-order-form"
            type="submit"
            disabled={isSaving}
            className="flex-1 sm:flex-none h-9 px-5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-semibold shadow-2xs transition-all cursor-pointer active:scale-98 shrink-0 whitespace-nowrap"
          >
            {isSaving ? "Saving..." : "Create order"}
          </Button>
        </div>
      </div>

      {/* Add a job site for the chosen customer without leaving the order form */}
      {isAddSiteOpen && selectedCustomer && (
        <AddSiteModal
          open
          onOpenChange={setIsAddSiteOpen}
          customerId={selectedCustomer.id}
          customerName={selectedCustomer.name}
          onCreated={(site) => {
            setAddedSites((prev) => [...prev, { customerId: selectedCustomer.id, site }]);
            setValue("jobSite", site.address, { shouldValidate: true });
          }}
        />
      )}

      {/* Add a contact for the chosen customer without leaving the order form */}
      {isAddContactOpen && selectedCustomer && (
        <NewContactModal
          open
          onOpenChange={setIsAddContactOpen}
          customerOptions={[{ value: selectedCustomer.id, label: selectedCustomer.name }]}
          defaultRoles={["Site contact"]}
          onCreated={(created) => {
            setAddedContacts((prev) => [
              ...prev,
              {
                customerId: selectedCustomer.id,
                contact: { id: created.id, name: created.name, role: created.role, phone: created.phone },
              },
            ]);
            setValue("jobContact", created.name);
          }}
        />
      )}
    </div>
  );
}
