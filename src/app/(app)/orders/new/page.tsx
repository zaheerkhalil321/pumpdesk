"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ChevronRight,
  CheckCircle2,
  Calendar,
  Clock,
  MapPin,
  Plus,
  Info,
  Search,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppSelect } from "@/components/ui/app-select";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  generateNextOrderNumber,
  addOrUpdateOrder,
  addOrUpdateBooking,
  addOrUpdateUnassignedJob,
  OrderItem,
  FullOrderData,
} from "@/lib/orders-store";

const SAMPLE_CUSTOMERS = [
  "Concrete Services",
  "Turner Construction",
  "Harbor Builders",
  "Granite State Builders",
  "Pine Tree Concrete",
  "Coastal Foundations",
];

const SAMPLE_SUPPLIERS = [
  "Auburn Concrete",
  "Dragon Products",
  "S.T. Griswold",
  "Redi-Mix Maine",
  "Carroll Concrete",
];

const PUMP_SIZES = [
  "28 m",
  "34 m",
  "47 m",
  "Trailer Line pump",
];

const PUMPS = [
  { id: "unassigned", label: "Unassigned" },
  { id: "01-34m", label: "01 · 34M Putzmeister" },
  { id: "02-28m", label: "02 · 28M Putzmeister" },
  { id: "03-47m", label: "03 · 47M Schwing" },
  { id: "04-line", label: "04 · Line pump" },
];

const OPERATORS = [
  { id: "unassigned", label: "Unassigned" },
  { id: "rob", label: "Rob Black" },
  { id: "dave", label: "Dave Smith" },
  { id: "tony", label: "Tony Perez" },
];

const newOrderSchema = z.object({
  status: z.enum(["Pending", "Confirmed"]),
  customer: z.string().min(1, "Customer name is required"),
  jobContact: z.string().optional(),
  jobSite: z.string().min(5, "Job site address must be at least 5 characters"),
  jobName: z.string().optional(),

  date: z.string().min(1, "Pour date is required"),
  pourTime: z.string().min(1, "Pour start time is required"),
  arriveBy: z.string().min(1, "Arrival time is required"),
  estimatedFinish: z.string().min(1, "Estimated finish time is required"),
  prepDuration: z.string(),
  pumpingDuration: z.string(),
  cleanupDuration: z.string(),

  supplier: z.string().min(1, "Concrete supplier is required"),
  estimatedVolume: z.string().min(1, "Estimated volume (yd³) is required"),
  pourType: z.string().min(1, "Please select a pour type"),
  linesOnSite: z.boolean(),
  customerDetails: z.string().optional(),

  minPumpSize: z.string().min(1, "Minimum pump size is required"),
  billingService: z.string().min(1, "Billing service is required before invoicing"),
  assignedPump: z.string(),
  assignedOperator: z.string(),
  operatorInstructions: z.string().optional(),

  equipmentItem: z.string().optional(),
  equipmentQuantity: z.string(),
  internalNote: z.string().optional(),

  purchaseOrder: z.string().optional(),
  collectOnDelivery: z.boolean(),
  tags: z.string().optional(),
});

type NewOrderFormValues = z.infer<typeof newOrderSchema>;

export default function NewOrderPage() {
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<NewOrderFormValues>({
    resolver: zodResolver(newOrderSchema),
    defaultValues: {
      status: "Pending",
      customer: "Concrete Services",
      jobContact: "",
      jobSite: "54 Montgomery Ave, Warren, ME 04864",
      jobName: "",
      date: "Oct 5, 2026",
      pourTime: "2:00 PM",
      arriveBy: "1:30 PM",
      estimatedFinish: "4:30 PM",
      prepDuration: "30 min",
      pumpingDuration: "2 hr",
      cleanupDuration: "30 min",
      supplier: "Auburn Concrete",
      estimatedVolume: "",
      pourType: "",
      linesOnSite: false,
      customerDetails: "",
      minPumpSize: "34 m",
      billingService: "",
      assignedPump: "unassigned",
      assignedOperator: "unassigned",
      operatorInstructions: "",
      equipmentItem: "",
      equipmentQuantity: "1",
      internalNote: "",
      purchaseOrder: "",
      collectOnDelivery: false,
      tags: "",
    },
    mode: "onBlur",
  });

  const [linesOnSite, setLinesOnSite] = useState(false);
  const [collectOnDelivery, setCollectOnDelivery] = useState(false);

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

  const PUMP_DETAILS_MAP: Record<string, { code: string; model: string; defaultOp: string }> = {
    '01-34m': { code: '01 · 34M', model: '34M', defaultOp: 'Rob Black' },
    '02-28m': { code: '02 · 28M', model: '28M', defaultOp: 'Rob Black' },
    '03-47m': { code: '03 · 47M', model: '47M', defaultOp: 'Dave Smith' },
    '04-line': { code: '04 · Line pump', model: 'Line pump', defaultOp: 'Tony Perez' },
    '04-line-pump': { code: '04 · Line pump', model: 'Line pump', defaultOp: 'Tony Perez' },
  };

  const OPERATOR_NAMES: Record<string, string> = {
    rob: 'Rob Black',
    dave: 'Dave Smith',
    tony: 'Tony Perez',
  };

  const parseTimeToNumericHour = (timeStr: string): number => {
    if (!timeStr) return 8.0;
    const match = timeStr.match(/(\d+):(\d+)\s*(AM|PM)?/i);
    if (match) {
      let hour = parseInt(match[1], 10);
      const min = parseInt(match[2], 10) || 0;
      const ampm = match[3]?.toUpperCase();
      if (ampm === 'PM' && hour < 12) hour += 12;
      if (ampm === 'AM' && hour === 12) hour = 0;
      return hour + min / 60;
    }
    const floatVal = parseFloat(timeStr);
    return isNaN(floatVal) ? 8.0 : floatVal;
  };

  const handleCreateOrder = (data: NewOrderFormValues) => {
    const orderId = generateNextOrderNumber();
    const isPumpAssigned = Boolean(data.assignedPump && data.assignedPump !== 'unassigned');
    const pumpInfo = isPumpAssigned ? PUMP_DETAILS_MAP[data.assignedPump] : null;
    const operatorName = data.assignedOperator && data.assignedOperator !== 'unassigned'
      ? OPERATOR_NAMES[data.assignedOperator] || data.assignedOperator
      : pumpInfo?.defaultOp || 'Operator needed';

    const orderItem: OrderItem = {
      id: orderId,
      serviceDate: data.date || 'Sep 12, 2026',
      dateTimestamp: Date.parse(data.date) || 1789718400000,
      pourTime: data.pourTime || '8:00 AM',
      customer: data.customer,
      jobSite: data.jobSite,
      pump: pumpInfo ? pumpInfo.code : 'Unassigned',
      pumpModel: pumpInfo ? pumpInfo.model : 'Unassigned',
      operator: operatorName,
      isUnassigned: !isPumpAssigned,
      status: data.status,
      invoiceStatus: 'Not created',
    };

    const fullDetails: Partial<FullOrderData> = {
      id: orderId,
      customer: data.customer,
      customerContact: data.jobContact || 'Lead Superintendent',
      customerPhone: '(207) 555-0100',
      jobName: data.jobName || 'Concrete Pour',
      status: data.status,
      pourType: data.pourType,
      locationCity: data.jobSite.split(',')[1]?.trim() || 'Rockland',
      serviceDate: data.date || 'Sep 12, 2026',
      arriveBy: data.arriveBy || '7:30 AM',
      pourTime: data.pourTime || '8:00 AM',
      estimatedEnd: data.estimatedFinish || '12:00 PM',
      volumeYards: parseInt(data.estimatedVolume, 10) || 50,
      jobSiteAddress: data.jobSite,
      jobSiteCityZip: data.jobSite,
      directionsUrl: `https://maps.google.com/?q=${encodeURIComponent(data.jobSite)}`,
      pumpRequested: data.minPumpSize,
      purchaseOrder: data.purchaseOrder || 'PO-2026',
      siteInstructions: data.operatorInstructions || 'North gate entrance. Washout on site.',
      assignedPumpCode: pumpInfo ? pumpInfo.code : 'Unassigned',
      assignedPumpType: pumpInfo ? pumpInfo.model : 'Boom pump',
      assignedOperator: operatorName,
      operatorPhone: '(207) 555-0168',
      workTicketNumber: `TKT-${orderId.replace(/\D/g, '')}`,
      workTicketStatus: 'Not submitted',
      invoiceStatus: 'Not created',
      collectOnDelivery: data.collectOnDelivery,
      notifyOperator: true,
      adjustedYards: parseInt(data.estimatedVolume, 10) || 50,
      adjustedTravel: 1.0,
      adjustedPrep: 0.5,
      adjustedPour: 3.0,
      adjustedCleanup: 0.5,
    };

    addOrUpdateOrder(orderItem, fullDetails);

    const startHour = parseTimeToNumericHour(data.pourTime);
    const duration = parseFloat(data.pumpingDuration) || 4.0;

    if (isPumpAssigned) {
      addOrUpdateBooking({
        id: `booking-${orderId}`,
        orderNumber: orderId,
        pumpId: data.assignedPump,
        customerName: data.customer,
        jobSiteName: data.jobSite,
        address: data.jobSite,
        startHour,
        durationHours: duration,
        volumeYards: parseInt(data.estimatedVolume, 10) || 50,
        status: 'travel',
        notes: data.operatorInstructions || data.internalNote,
      });
    } else {
      addOrUpdateUnassignedJob({
        id: `unassigned-${orderId}`,
        orderNumber: orderId,
        pumpId: '',
        customerName: data.customer,
        jobSiteName: data.jobSite,
        address: data.jobSite,
        startHour,
        durationHours: duration,
        volumeYards: parseInt(data.estimatedVolume, 10) || 50,
        status: 'travel',
        notes: data.operatorInstructions || data.internalNote,
      });
    }

    toast.success("Order Created Successfully", {
      description: `${data.customer} • ${orderId} saved as ${data.status}.`,
    });
    router.push("/schedule");
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
        <span className="font-semibold text-slate-900">New order</span>
      </nav>

      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          New order
        </h1>

        <div className="flex items-center gap-3">
          {/* Status Dropdown */}
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-medium">Status:</span>
            <div className="w-32">
              <AppSelect
                size="sm"
                value={watch("status")}
                onChange={(val) => setValue("status", val as "Pending" | "Confirmed")}
                options={["Pending", "Confirmed"]}
              />
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/schedule")}
            className="h-9 px-4 rounded-lg border-slate-200 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Button>

          <Button
            form="full-order-form"
            type="submit"
            className="h-9 px-5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-98"
          >
            Create order
          </Button>
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

      {/* ── Quick Entry Info Banner ── */}
      <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-brand-light border border-brand/25 text-xs text-brand shadow-2xs">
        <CheckCircle2 className="h-4 w-4 text-brand shrink-0" />
        <span className="font-semibold">
          Details filled from your quick entry. Review before creating.
        </span>
      </div>

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
                    onChange={(val) => setValue("customer", val, { shouldValidate: true })}
                    options={SAMPLE_CUSTOMERS}
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
                    options={[
                      { value: "Mike Vance", label: "Mike Vance", description: "Superintendent" },
                      { value: "Rob Black", label: "Rob Black", description: "PM" },
                      { value: "Carlos Rodriguez", label: "Carlos Rodriguez", description: "Field Lead" },
                    ]}
                  />
                  <div className="flex items-center justify-between mt-1 text-[11px]">
                    <button
                      type="button"
                      className="text-brand hover:underline font-medium cursor-pointer inline-flex items-center gap-0.5"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Add contact</span>
                    </button>
                    <button
                      type="button"
                      className="text-brand hover:underline font-medium cursor-pointer inline-flex items-center gap-0.5"
                    >
                      <Plus className="h-3 w-3" />
                      <span>Additional contact</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Job site */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Job site <span className="text-red-500">*</span>
                </label>
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      {...register("jobSite")}
                      className={cn(
                        "w-full h-9 pl-3 pr-9 rounded-lg border bg-white text-xs font-medium outline-none transition-colors",
                        errors.jobSite
                          ? "border-red-500 focus:border-red-500 text-red-900 bg-red-50/20"
                          : "border-slate-200 text-slate-900 focus:border-brand"
                      )}
                      placeholder="Enter site address"
                    />
                    <MapPin className="h-4 w-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="h-9 px-3 text-xs font-medium text-slate-700 border-slate-200 hover:bg-slate-50 gap-1 shrink-0"
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                {/* Concrete supplier */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Concrete supplier <span className="text-red-500">*</span>
                  </label>
                  <AppSelect
                    value={watch("supplier")}
                    onChange={(val) => setValue("supplier", val, { shouldValidate: true })}
                    options={SAMPLE_SUPPLIERS}
                    placeholder="Select supplier *"
                    error={Boolean(errors.supplier)}
                  />
                  {errors.supplier && (
                    <p className="text-[11px] text-red-500 font-medium mt-1">
                      {errors.supplier.message}
                    </p>
                  )}
                </div>

                {/* Estimated volume */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Estimated volume <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    {...register("estimatedVolume")}
                    placeholder="e.g. 120 yd³"
                    className={cn(
                      "w-full h-9 px-3 rounded-lg border bg-white text-xs outline-none transition-colors",
                      errors.estimatedVolume
                        ? "border-red-500 focus:border-red-500 text-red-900 bg-red-50/20"
                        : "border-slate-200 text-slate-900 focus:border-brand placeholder:text-slate-400"
                    )}
                  />
                  {errors.estimatedVolume && (
                    <p className="text-[11px] text-red-500 font-medium mt-1">
                      {errors.estimatedVolume.message}
                    </p>
                  )}
                </div>

                {/* Pour type */}
                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Pour type <span className="text-red-500">*</span>
                  </label>
                  <AppSelect
                    value={watch("pourType")}
                    onChange={(val) => setValue("pourType", val, { shouldValidate: true })}
                    placeholder="Select type"
                    options={[
                      { value: "slab", label: "Slab on grade" },
                      { value: "footings", label: "Footings" },
                      { value: "walls", label: "Walls" },
                      { value: "columns", label: "Columns" },
                    ]}
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

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
                <div className="sm:col-span-2">
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Item
                  </label>
                  <AppSelect
                    value={watch("equipmentItem") || ""}
                    onChange={(val) => setValue("equipmentItem", val)}
                    placeholder="Select item"
                    options={[
                      { value: "primer", label: "Primer slurry pack" },
                      { value: "pipe-4in", label: "4-inch steel pipeline (10 ft)" },
                      { value: "hose-reductions", label: "Reduction hose 4 to 3 inch" },
                    ]}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Quantity
                  </label>
                  <input
                    type="text"
                    {...register("equipmentQuantity")}
                    className="w-full h-9 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-900 outline-none focus:border-brand"
                  />
                </div>
              </div>

              <button
                type="button"
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
                  <div className="relative">
                    <div
                      className={cn(
                        "w-full h-9 pl-3 pr-8 rounded-lg border bg-white flex items-center gap-2",
                        errors.date ? "border-red-500" : "border-slate-200"
                      )}
                    >
                      <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        {...register("date")}
                        className="text-xs font-semibold text-slate-900 bg-transparent outline-none w-full"
                      />
                    </div>
                  </div>
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
                    onChange={(val) => setValue("pourTime", val, { shouldValidate: true })}
                    icon={Clock}
                    options={[5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((h) => {
                      const label =
                        h === 12
                          ? "12:00 PM"
                          : h < 12
                          ? `${h}:00 AM`
                          : `${h - 12}:00 PM`;
                      return { value: label, label };
                    })}
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
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Arrive by
                  </label>
                  <div className="relative">
                    <div
                      className={cn(
                        "w-full h-9 pl-3 pr-8 rounded-lg border bg-white flex items-center gap-2",
                        errors.arriveBy ? "border-red-500" : "border-slate-200"
                      )}
                    >
                      <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        {...register("arriveBy")}
                        className="text-xs text-slate-900 bg-transparent outline-none w-full"
                      />
                    </div>
                  </div>
                  {errors.arriveBy && (
                    <p className="text-[11px] text-red-500 font-medium mt-1">
                      {errors.arriveBy.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Estimated finish
                  </label>
                  <div className="relative">
                    <div
                      className={cn(
                        "w-full h-9 pl-3 pr-8 rounded-lg border bg-white flex items-center gap-2",
                        errors.estimatedFinish ? "border-red-500" : "border-slate-200"
                      )}
                    >
                      <Clock className="h-4 w-4 text-slate-400 shrink-0" />
                      <input
                        type="text"
                        {...register("estimatedFinish")}
                        className="text-xs text-slate-900 bg-transparent outline-none w-full"
                      />
                    </div>
                  </div>
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
                    onChange={(val) => setValue("prepDuration", val)}
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
                    onChange={(val) => setValue("pumpingDuration", val)}
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
                    onChange={(val) => setValue("cleanupDuration", val)}
                    options={["15 min", "30 min", "45 min", "1 hr"]}
                  />
                </div>
              </div>

              <p className="text-[10.5px] text-slate-400 leading-tight">
                Arrival and finish calculated from durations.
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
                    className="text-[11px] text-brand hover:underline font-medium cursor-pointer inline-flex items-center gap-0.5"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Maximum size restriction</span>
                  </button>
                </div>
                <AppSelect
                  value={watch("minPumpSize")}
                  onChange={(val) => setValue("minPumpSize", val, { shouldValidate: true })}
                  options={PUMP_SIZES}
                  error={Boolean(errors.minPumpSize)}
                />
                {errors.minPumpSize && (
                  <p className="text-[11px] text-red-500 font-medium mt-1">
                    {errors.minPumpSize.message}
                  </p>
                )}
              </div>

              {/* Billing service */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Billing service <span className="text-red-500">*</span>
                </label>
                <AppSelect
                  value={watch("billingService")}
                  onChange={(val) => setValue("billingService", val, { shouldValidate: true })}
                  placeholder="Select billing service"
                  options={[
                    { value: "34m-standard", label: "34M Standard Pour Rate ($225/hr)" },
                    { value: "28m-standard", label: "28M Standard Pour Rate ($200/hr)" },
                    { value: "line-standard", label: "Line Pump Rate ($165/hr)" },
                  ]}
                  error={Boolean(errors.billingService)}
                />
                {errors.billingService ? (
                  <p className="text-[11px] text-red-500 font-medium mt-1">
                    {errors.billingService.message}
                  </p>
                ) : (
                  <p className="text-[10.5px] text-slate-400 mt-1 leading-tight">
                    Sets pricing; may differ from the assigned pump. Billing service required before invoicing.
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
                    onChange={(val) => setValue("assignedPump", val)}
                    options={PUMPS.map((p) => ({ value: p.id, label: p.label }))}
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 block mb-1">
                    Operator
                  </label>
                  <AppSelect
                    value={watch("assignedOperator")}
                    onChange={(val) => setValue("assignedOperator", val)}
                    options={OPERATORS.map((op) => ({ value: op.id, label: op.label }))}
                  />
                  <button
                    type="button"
                    className="text-[11px] text-brand hover:underline font-medium mt-1 inline-flex items-center gap-0.5 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Additional operator</span>
                  </button>
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

              {/* Tags */}
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Tags
                </label>
                <AppSelect
                  value={watch("tags") || ""}
                  onChange={(val) => setValue("tags", val)}
                  placeholder="Add tags"
                  options={[
                    { value: "commercial", label: "Commercial" },
                    { value: "residential", label: "Residential" },
                    { value: "high-priority", label: "High Priority" },
                  ]}
                />
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

        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push("/schedule")}
            className="h-9 px-4 rounded-lg border-slate-200 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
          >
            Cancel
          </Button>

          <Button
            form="full-order-form"
            type="submit"
            className="h-9 px-5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-98"
          >
            Create order
          </Button>
        </div>
      </div>
    </div>
  );
}
