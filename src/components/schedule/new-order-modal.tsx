'use client';

import { useState, useMemo, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { format, parse } from 'date-fns';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { AppSelect } from '@/components/ui/app-select';
import {
  Calendar as CalendarIcon,
  Clock,
  User,
  Truck,
  Info,
  ExternalLink,
  Trash2,
  Pencil,
  AlertCircle,
} from 'lucide-react';
import { PumpLane, ScheduleBooking } from './schedule-types';
import { toast } from 'sonner';
import Link from 'next/link';
import type { OrderFormOptions } from '@/features/orders/types';
import { cn } from '@/lib/utils';
import { DeleteOrderDialog } from './delete-order-dialog';
import { cancelOrder, createOrder, updateOrder } from '@/features/orders/server/actions';
import { clockFromHour, parseClock, shiftClock } from '@/features/orders/mappers';
import { findOverlap } from '@/features/orders/conflicts';
import { reportAction } from '@/lib/action-feedback';
import { SiteCombobox } from '@/components/orders/site-combobox';
import { SupplierCombobox } from '@/components/orders/supplier-combobox';
import { ensureSupplier } from '@/features/suppliers/ensure';

interface NewOrderModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  pumps: PumpLane[];
  /** Real customers, pumps and operators from the database. */
  options: OrderFormOptions;
  initialPumpId?: string;
  initialHour?: number;
  editingBooking?: ScheduleBooking | null;
  /** Orders already on the board for `date`, used to warn about a busy pump. */
  bookings: ScheduleBooking[];
  /** The day the schedule is showing (yyyy-MM-dd): the default pour date. */
  date: string;
}

interface FormContentProps {
  pumps: PumpLane[];
  options: OrderFormOptions;
  initialPumpId?: string;
  initialHour?: number;
  editingBooking?: ScheduleBooking | null;
  bookings: ScheduleBooking[];
  date: string;
  onOpenChange: (open: boolean) => void;
}

function NewOrderModalForm({
  pumps,
  options,
  initialPumpId,
  initialHour = 7,
  editingBooking,
  bookings,
  date,
  onOpenChange,
}: FormContentProps) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const isEditMode = Boolean(editingBooking);

  // Date State with Calendar Popover
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    parse(editingBooking?.serviceDate ?? date, 'yyyy-MM-dd', new Date()),
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Pour Time State
  const [pourTime, setPourTime] = useState(() =>
    clockFromHour(editingBooking ? editingBooking.startHour : initialHour || 14),
  );

  // Customer & Supplier States
  const [customer, setCustomer] = useState(
    () => editingBooking?.customerName || '',
  );
  const [supplier, setSupplier] = useState(() => editingBooking?.supplierName ?? '');

  // Single Unified Address State (accepts full address, street + city, or city/state)
  const [address, setAddress] = useState(() => {
    if (!editingBooking) return '';
    if (editingBooking.jobSiteName && editingBooking.address) {
      if (editingBooking.jobSiteName === editingBooking.address) {
        return editingBooking.jobSiteName;
      }
      if (editingBooking.address.includes(editingBooking.jobSiteName)) {
        return editingBooking.address;
      }
      return `${editingBooking.jobSiteName}, ${editingBooking.address}`;
    }
    return editingBooking.jobSiteName || editingBooking.address || '';
  });

  // Pour Type & Estimated Volume States
  const [pourType, setPourType] = useState(
    () => editingBooking?.pourType || 'Foundation',
  );
  const [volumeYards, setVolumeYards] = useState<number | string>(
    () => editingBooking?.volumeYards ?? '',
  );

  // Pump & Operator States
  const [minPumpSize, setMinPumpSize] = useState(() => editingBooking?.minPumpSize ?? '');
  const [assignedPumpId, setAssignedPumpId] = useState<string>(
    () => editingBooking?.pumpId || initialPumpId || 'assign-later',
  );
  const operatorNameForPump = (pumpId: string): string =>
    options.operators.find(
      (o) => o.id === options.pumps.find((p) => p.id === pumpId)?.defaultOperatorId,
    )?.name ?? 'unassigned';
  const [assignedOperator, setAssignedOperator] = useState<string>(() =>
    editingBooking
      ? editingBooking.operator || 'unassigned'
      : initialPumpId
        ? operatorNameForPump(initialPumpId)
        : 'unassigned',
  );

  // Choosing a pump swaps in its default operator, or clears the operator when it has none.
  const handlePumpChange = (pumpId: string) => {
    setAssignedPumpId(pumpId);
    setAssignedOperator(operatorNameForPump(pumpId));
  };

  const [formErrors, setFormErrors] = useState<{
    customer?: string;
    address?: string;
    volume?: string;
  }>({});

  const pourTimeOptions = useMemo(() => {
    const labels = Array.from({ length: 24 }, (_, h) => clockFromHour(h));
    // An order saved at 7:30 keeps showing 7:30.
    if (!labels.includes(pourTime)) labels.push(pourTime);
    return labels.map((label) => ({ value: label, label }));
  }, [pourTime]);

  const pumpOptions = useMemo(
    () => [
      { value: 'assign-later', label: 'Assign later' },
      // A pump in maintenance cannot take new work (an order already on it keeps it).
      ...pumps
        .filter((p) => p.status !== 'maintenance' || p.id === editingBooking?.pumpId)
        .map((p) => ({
          value: p.id,
          label: `${p.code} (${p.name})`,
          description: p.boomLength || undefined,
        })),
    ],
    [pumps, editingBooking?.pumpId]
  );

  const operatorOptions = useMemo(
    () => [
      {
        value: 'unassigned',
        label: 'Assign later (Unassigned)',
        description: 'You can assign an operator anytime before dispatch',
      },
      ...options.operators.map((o) => ({
        value: o.name,
        label: o.name,
        description: o.phone || undefined,
      })),
    ],
    [options.operators],
  );

  const pumpSizeOptions = useMemo(
    () => [...new Set(options.pumps.map((p) => p.sizeLabel).filter(Boolean))],
    [options.pumps],
  );

  const pourTypeOptions = useMemo(
    () => [
      { value: 'Foundation', label: 'Foundation' },
      { value: 'Footings', label: 'Footings' },
      { value: 'House slab', label: 'House slab' },
      { value: 'Slab on grade', label: 'Slab on grade' },
      { value: 'Cast-in-place wall', label: 'Cast-in-place wall' },
      { value: 'ICF wall', label: 'ICF wall' },
      { value: 'Commercial deck', label: 'Commercial deck' },
      { value: 'Columns', label: 'Columns' },
      { value: 'Driveway', label: 'Driveway' },
    ],
    []
  );

  // The calendar hands us the day the user clicked, so format that day as is.
  const formattedDate = format(selectedDate, 'MMMM d, yyyy');
  const isoDate = format(selectedDate, 'yyyy-MM-dd');

  const handleCreateOrder = () => {
    const errors: {
      customer?: string;
      address?: string;
      volume?: string;
    } = {};

    if (!customer.trim()) {
      errors.customer = 'Customer is required.';
    }
    if (!address.trim()) {
      errors.address = 'Job site address or city/town is required.';
    }

    const checkVolume = Number(volumeYards);
    if (isNaN(checkVolume) || checkVolume < 1 || checkVolume > 10000) {
      errors.volume = 'Volume must be between 1 and 10,000 yd³.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Required Information Missing', {
        description:
          errors.customer ||
          errors.address ||
          errors.volume ||
          'Please enter required job site details.',
      });
      return;
    }

    setFormErrors({});
    const isAssignLater = assignedPumpId === 'assign-later' || !assignedPumpId;
    const selectedPump = pumps.find((p) => p.id === assignedPumpId);
    const pumpId = isAssignLater ? null : assignedPumpId;

    const customerRecord = options.customers.find((c) => c.name === customer);
    if (!customerRecord) {
      setFormErrors({ customer: 'Pick one of your customers.' });
      return;
    }
    const siteText = address.trim();
    const savedSite = customerRecord.sites.find((site) => site.address === siteText);
    const operatorId = options.operators.find((o) => o.name === assignedOperator)?.id ?? null;

    const base = {
      customerId: customerRecord.id,
      jobSiteId: savedSite?.id ?? null,
      siteLabel: siteText,
      pourType,
      supplierName: supplier,
      estimatedYards: Number(volumeYards),
      minPumpSize,
      equipmentId: pumpId,
      employeeId: operatorId,
    };

    startSaving(async () => {
      await ensureSupplier(supplier, options.suppliers);
      if (editingBooking) {
        if (!editingBooking.jobId || editingBooking.version === undefined) return;
        const result = await updateOrder({
          ...base,
          id: editingBooking.jobId,
          version: editingBooking.version,
          date: isoDate,
          pourTime,
          // Giving a pump to an order that had none confirms it, like a new order with a pump.
          ...(!editingBooking.pumpId && !isAssignLater ? { bookingStatus: 'confirmed' as const } : {}),
        });
        if (!reportAction(result, { entity: 'order', refresh: () => router.refresh() })) return;
        toast.success('Order updated', {
          description: `${customer} • ${selectedPump?.code || 'Unassigned'}`,
        });
      } else {
        const result = await createOrder({
          ...base,
          date: isoDate,
          pourTime,
          arriveBy: shiftClock(pourTime, -30),
          estimatedFinish: shiftClock(pourTime, 150),
          prepMinutes: 30,
          pumpMinutes: 120,
          cleanupMinutes: 30,
          travelMinutes: 0,
          linesOnSite: false,
          collectOnDelivery: false,
          bookingStatus: isAssignLater ? 'pending' : 'confirmed',
          contactId: customerRecord.contacts[0]?.id ?? null,
        });
        if (!reportAction(result, { entity: 'order', refresh: () => router.refresh() })) return;
        if (isAssignLater) {
          toast.info('Pending order created', {
            description: `${result.data.job_number} for ${customer} is waiting for a pump.`,
          });
        } else {
          toast.success('Order booked on the schedule', {
            description: `${result.data.job_number} • ${customer} on ${selectedPump?.code || 'a pump'} at ${pourTime}.`,
          });
        }
      }
      onOpenChange(false);
    });
  };

  // Delete confirmation dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleConfirmDelete = () => {
    if (!editingBooking?.jobId || editingBooking.version === undefined) return;
    const { jobId, version, orderNumber } = editingBooking;
    startSaving(async () => {
      const result = await cancelOrder({ id: jobId, version });
      if (!reportAction(result, { entity: 'order', refresh: () => router.refresh() })) return;
      toast.info('Order cancelled', { description: `${orderNumber} is cancelled and its pump is free.` });
      setIsDeleteDialogOpen(false);
      onOpenChange(false);
    });
  };

  const isAssignLater = assignedPumpId === 'assign-later' || !assignedPumpId;
  const assignedPump = pumps.find((p) => p.id === assignedPumpId);

  // Only a warning: the dispatcher can still save a time that overlaps another pour.
  const { hour: pourHour, minute: pourMinute } = parseClock(pourTime);
  const clash =
    !isAssignLater && format(selectedDate, 'yyyy-MM-dd') === date
      ? findOverlap(bookings, {
          pumpId: assignedPumpId,
          startHour: pourHour + pourMinute / 60,
          durationHours: editingBooking?.durationHours ?? 1,
          ignoreId: editingBooking?.id,
        })
      : null;

  return (
    <>
      {/* Header */}
      <DialogHeader className="p-0 space-y-1">
        <DialogTitle className="text-xl font-bold tracking-tight text-slate-900">
          {isEditMode ? `Order • ${editingBooking?.orderNumber}` : 'New order'}
        </DialogTitle>
        {/* <DialogDescription className="text-xs sm:text-sm text-slate-500">
          {isEditMode
            ? "Update order specifications, crew assignment, or job location."
            : "Describe the job. We'll fill in the details."}
        </DialogDescription> */}
      </DialogHeader>

      {/* ── Subtitle Text (Figma) ── */}
      <div className="text-xs font-normal text-slate-500 -mt-2">
        {isEditMode
          ? 'Review or update the order specifications below.'
          : 'Review the details below before creating your order.'}
      </div>

      {/* ── Validation Error Alert Banner ── */}
      {Object.keys(formErrors).length > 0 && (
        <div className="p-3 rounded-xl bg-red-50 border border-red-200 flex items-start gap-2.5 text-xs text-red-800 animate-in fade-in duration-200">
          <AlertCircle className="h-4 w-4 text-red-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-semibold block">
              Required information missing
            </span>
            <span className="text-red-700">
              Please fill in the fields highlighted in red below before
              continuing.
            </span>
          </div>
        </div>
      )}

      {/* ── Structured Details Container (v1) ── */}
      <div className="rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 space-y-3">
        {/* Row 1: Interactive Date & Pour time */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Interactive Date Picker with Calendar Popover */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Date
            </label>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger className="w-full h-10 px-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between shadow-2xs transition-all hover:border-brand/40 cursor-pointer text-left outline-none group">
                <div className="flex items-center gap-2 min-w-0">
                  <CalendarIcon className="h-4 w-4 text-brand shrink-0" />
                  <span className="text-xs font-semibold text-slate-900 truncate">
                    {formattedDate}
                  </span>
                </div>
                <Pencil className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600 transition-colors shrink-0" />
              </PopoverTrigger>

              <PopoverContent
                align="start"
                className="p-2 shadow-2xl rounded-2xl border-slate-200 bg-white w-auto"
              >
                <Calendar
                  selected={selectedDate}
                  onSelect={(date) => {
                    setSelectedDate(date);
                    setIsCalendarOpen(false);
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Interactive Pour Time Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Pour time
            </label>
            <AppSelect
              value={pourTime}
              onChange={setPourTime}
              options={pourTimeOptions}
              icon={Clock}
              className="h-10"
            />
          </div>
        </div>

        {/* Row 2: Customer & Concrete Supplier Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Customer Field */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Customer <span className="text-red-500">*</span>
            </label>
            <AppSelect
              value={customer}
              onChange={(val) => {
                // Fill in the new customer's first saved site, unless the dispatcher typed their own address.
                const previousSites = options.customers.find((c) => c.name === customer)?.sites ?? [];
                const typedOwnAddress =
                  address.trim() !== '' && !previousSites.some((site) => site.address === address);
                setCustomer(val);
                if (!typedOwnAddress) {
                  const nextAddress = options.customers.find((c) => c.name === val)?.sites[0]?.address ?? '';
                  setAddress(nextAddress);
                  if (nextAddress && formErrors.address) {
                    setFormErrors((prev) => ({ ...prev, address: undefined }));
                  }
                }
                if (formErrors.customer) {
                  setFormErrors((prev) => ({
                    ...prev,
                    customer: undefined,
                  }));
                }
              }}
              options={options.customers.map((c) => c.name)}
              placeholder="Select customer *"
              icon={User}
              error={Boolean(formErrors.customer)}
              className="h-10"
            />
            {formErrors.customer && (
              <p className="text-[11px] text-red-500 font-medium mt-1">
                {formErrors.customer}
              </p>
            )}
          </div>

          {/* Concrete Supplier Field (Optional) */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Concrete supplier <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <SupplierCombobox
              value={supplier}
              onChange={setSupplier}
              suppliers={options.suppliers}
              placeholder="Search or type a supplier"
            />
          </div>
        </div>

        {/* Row 3: Pour Type & Estimated Volume (yd³) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Pour type
            </label>
            <AppSelect
              value={pourType}
              onChange={setPourType}
              options={pourTypeOptions}
              placeholder="Select pour type..."
              className="h-10"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-slate-700">
                Estimated volume
              </label>
                              <span
                  className={cn(
                    'text-[10.5px] font-mono transition-colors',
                    formErrors.volume ? 'text-rose-600 font-bold' : 'text-slate-400'
                  )}
                >
                  1–10,000 yd³
                </span>
            </div>
            <div
              className={cn(
                'flex items-center gap-2 h-10 px-3 rounded-lg border transition-colors shadow-2xs',
                formErrors.volume
                  ? 'border-red-500 bg-red-50/20'
                  : 'border-slate-200 bg-white focus-within:border-brand',
              )}
            >
              <input
                type="number"
                min={1}
                max={10000}
                step={5}
                value={volumeYards}
                onChange={(e) => {
                  setVolumeYards(e.target.value);
                  if (formErrors.volume) {
                    setFormErrors((prev) => ({ ...prev, volume: undefined }));
                  }
                }}
                placeholder="e.g. 80"
                className="text-xs font-medium text-slate-900 bg-transparent outline-none w-full placeholder:text-slate-400 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="text-xs font-semibold text-slate-400 shrink-0">yd³</span>
            </div>
            {formErrors.volume && (
              <p className="text-[11px] text-red-500 font-medium mt-1">
                {formErrors.volume}
              </p>
            )}
          </div>
        </div>

        {/* Row 4: Job Site Address (Single Unified Field) */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs font-semibold text-slate-700">
              Job site address <span className="text-red-500">*</span>
            </label>
            <span className="text-[10.5px] text-slate-400">
              Full address, street, or city/town
            </span>
          </div>
          <SiteCombobox
            value={address}
            onChange={(value) => {
              setAddress(value);
              if (formErrors.address) setFormErrors((prev) => ({ ...prev, address: undefined }));
            }}
            sites={options.customers.find((c) => c.name === customer)?.sites ?? []}
            error={Boolean(formErrors.address)}
            placeholder="Town, cross streets, or street address"
            className="h-10"
          />

          {formErrors.address ? (
            <p className="text-[11px] text-red-500 font-semibold mt-1 px-0.5 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span>{formErrors.address}</span>
            </p>
          ) : null}
        </div>

        {/* Row 4: Minimum Pump Size & Assigned Pump Dropdowns */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Minimum Pump Size Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Minimum pump size
            </label>
            <AppSelect
              value={minPumpSize}
              onChange={setMinPumpSize}
              options={pumpSizeOptions}
              placeholder="Select minimum pump size"
              icon={Truck}
              className="h-10"
            />
            <p className="text-[10.5px] text-slate-400 mt-1 leading-tight">
              Minimum size is a site requirement, not the billing service.
            </p>
          </div>

          {/* Assigned Pump Selector */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Assigned pump
            </label>
            <AppSelect
              value={assignedPumpId}
              onChange={handlePumpChange}
              options={pumpOptions}
              icon={Truck}
              className="h-10"
            />
          </div>

          {clash && (
            <p className="sm:col-span-2 flex items-start gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] font-medium text-amber-800">
              <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
              <span>
                {assignedPump?.code ?? 'This pump'} already has {clash.customerName} at{' '}
                {clockFromHour(clash.startHour)}. You can still save this booking.
              </span>
            </p>
          )}

          {/* Assigned Operator Selector */}
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Assigned operator (Optional)
            </label>
            <AppSelect
              value={assignedOperator}
              onChange={setAssignedOperator}
              options={operatorOptions}
              icon={User}
              className="h-10 transition-colors cursor-pointer border-slate-200 hover:border-slate-300 hover:bg-slate-50/60"
            />
          </div>
        </div>
      </div>

      {/* ── Status Information Banner ── */}
      <div className="px-3.5 py-2.5 rounded-lg bg-brand-light border border-brand/20 flex items-center gap-2 text-xs text-brand-text">
        <Info className="h-4 w-4 text-brand shrink-0" />
        <span>
          {isEditMode ? (
            <>Saves your changes to this order.</>
          ) : isAssignLater ? (
            <>
              Creates a{' '}
              <strong className="font-semibold text-slate-900">Pending</strong>{' '}
              order • Pump and operator unassigned
            </>
          ) : (
            <>
              Creates a{' '}
              <strong className="font-semibold text-slate-900">Confirmed</strong>{' '}
              order • Assigned to {assignedPump?.code || 'Pump'} •{' '}
              {assignedOperator !== 'unassigned' ? (
                <span className="font-semibold text-emerald-800">
                  Operator: {assignedOperator} (Draft)
                </span>
              ) : (
                <span className="font-medium text-slate-600">
                  Operator unassigned
                </span>
              )}
            </>
          )}
        </span>
      </div>

      {/* ── Footer Actions ── */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Action: Open Full Form */}
        <Link
          href={`/orders/new?${new URLSearchParams({
            ...(editingBooking?.orderNumber ? { orderId: editingBooking.orderNumber } : {}),
            ...(editingBooking?.id ? { bookingId: editingBooking.id } : {}),
            ...(volumeYards ? { volume: String(volumeYards) } : {}),
            ...(pourType ? { pourType } : {}),
            ...(editingBooking?.dispatchStatus === 'dispatched' ? { status: 'Confirmed' } : {}),
            pourTime,
            date: isoDate,
            ...(assignedPumpId && assignedPumpId !== 'assign-later' ? { pumpId: assignedPumpId } : {}),
            ...(customer ? { customer } : {}),
            ...(address ? { address } : {}),
            ...(assignedOperator && assignedOperator !== 'unassigned' ? { operator: assignedOperator } : {}),
          }).toString()}`}
          onClick={() => onOpenChange(false)}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors cursor-pointer"
        >
          <ExternalLink className="h-4 w-4 text-slate-500" />
          <span>Open full form</span>
        </Link>

        {/* Right Actions: Cancel + Create Order */}
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {isEditMode && (
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 text-sm font-medium gap-1.5 rounded-lg cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Cancel order</span>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 rounded-lg border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateOrder}
              disabled={isSaving}
              className="h-9 px-5 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-semibold shadow-2xs transition-all cursor-pointer active:scale-98"
            >
              {isSaving ? 'Saving...' : isEditMode ? 'Save changes' : 'Create order'}
            </Button>
          </div>
          {Object.keys(formErrors).length > 0 ? (
            <span className="text-[10.5px] text-red-500 font-semibold pr-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span>Fill required fields to create order</span>
            </span>
          ) : !address.trim() ? (
            <span className="text-[10.5px] text-slate-400 pr-1">
              Confirm the job-site address to continue.
            </span>
          ) : null}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <DeleteOrderDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        booking={editingBooking}
        onConfirmDelete={handleConfirmDelete}
      />
    </>
  );
}

export function NewOrderModal({
  isOpen,
  onOpenChange,
  pumps,
  options,
  initialPumpId,
  initialHour = 7,
  editingBooking,
  bookings,
  date,
}: NewOrderModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={true}
        className="sm:max-w-[620px] max-h-[92vh] overflow-y-auto p-6 rounded-2xl bg-white gap-5 border border-slate-200/90 shadow-2xl"
      >
        <NewOrderModalForm
          key={
            editingBooking?.id ||
            `new-${initialPumpId || 'none'}-${initialHour}`
          }
          pumps={pumps}
          options={options}
          initialPumpId={initialPumpId}
          initialHour={initialHour}
          editingBooking={editingBooking}
          bookings={bookings}
          date={date}
          onOpenChange={onOpenChange}
        />
      </DialogContent>
    </Dialog>
  );
}
