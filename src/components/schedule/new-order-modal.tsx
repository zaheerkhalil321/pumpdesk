'use client';

import { useState, useMemo } from 'react';
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
  Building2,
  MapPin,
  Truck,
  Info,
  ExternalLink,
  Trash2,
  Check,
  Pencil,
  AlertCircle,
} from 'lucide-react';
import { PumpLane, ScheduleBooking } from './schedule-types';
import { formatInTimeZone } from 'date-fns-tz';
import { toast } from 'sonner';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { DeleteOrderDialog } from './delete-order-dialog';

const TIMEZONE = 'America/Chicago';

interface NewOrderModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  pumps: PumpLane[];
  initialPumpId?: string;
  initialHour?: number;
  editingBooking?: ScheduleBooking | null;
  onAddBooking: (booking: ScheduleBooking) => void;
  onAddUnassignedJob?: (job: ScheduleBooking) => void;
  onUpdateBooking?: (booking: ScheduleBooking) => void;
  onDeleteBooking?: (bookingId: string) => void;
}

const SAMPLE_CUSTOMERS = [
  'Concrete Services',
  'Turner Construction',
  'Harbor Builders',
  'Granite State Builders',
  'Pine Tree Concrete',
  'Coastal Foundations',
];

const SAMPLE_SUPPLIERS = [
  'Auburn Concrete',
  'Dragon Products',
  'S.T. Griswold',
  'Redi-Mix Maine',
  'Carroll Concrete',
];

const PUMP_SIZES = ['28 meters', '34 meters', '47 meters', 'Line pump'];

interface FormContentProps {
  pumps: PumpLane[];
  initialPumpId?: string;
  initialHour?: number;
  editingBooking?: ScheduleBooking | null;
  onOpenChange: (open: boolean) => void;
  onAddBooking: (booking: ScheduleBooking) => void;
  onAddUnassignedJob?: (job: ScheduleBooking) => void;
  onUpdateBooking?: (booking: ScheduleBooking) => void;
  onDeleteBooking?: (bookingId: string) => void;
}

function NewOrderModalForm({
  pumps,
  initialPumpId,
  initialHour = 7,
  editingBooking,
  onOpenChange,
  onAddBooking,
  onAddUnassignedJob,
  onUpdateBooking,
  onDeleteBooking,
}: FormContentProps) {
  const isEditMode = Boolean(editingBooking);

  // Date State with Calendar Popover
  const [selectedDate, setSelectedDate] = useState<Date>(() =>
    editingBooking ? new Date(2026, 8, 12) : new Date(2026, 9, 5),
  );
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Pour Time State
  const [pourTime, setPourTime] = useState(() => {
    if (editingBooking) {
      const h = editingBooking.startHour;
      return h <= 12 ? `${h}:00 AM` : `${h - 12}:00 PM`;
    }
    const h = initialHour || 14;
    return h === 12 ? '12:00 PM' : h < 12 ? `${h}:00 AM` : `${h - 12}:00 PM`;
  });

  // Customer & Supplier States
  const [customer, setCustomer] = useState(
    () => editingBooking?.customerName || '',
  );
  const [supplier, setSupplier] = useState('');

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
    () => editingBooking?.volumeYards ?? 80,
  );

  // Pump & Operator States
  const [minPumpSize, setMinPumpSize] = useState('34 meters');
  const [assignedPumpId, setAssignedPumpId] = useState<string>(
    () => editingBooking?.pumpId || initialPumpId || 'assign-later',
  );
  const [assignedOperator, setAssignedOperator] = useState<string>(
    () => editingBooking?.operator || 'unassigned',
  );

  const [formErrors, setFormErrors] = useState<{
    customer?: string;
    address?: string;
  }>({});

  const pourTimeOptions = useMemo(
    () =>
      [5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17].map((h) => {
        const label =
          h === 12
            ? '12:00 PM'
            : h < 12
              ? `${h}:00 AM`
              : `${h - 12}:00 PM`;
        return { value: label, label };
      }),
    []
  );

  const pumpOptions = useMemo(
    () => [
      { value: 'assign-later', label: 'Assign later' },
      ...pumps.map((p) => ({
        value: p.id,
        label: `${p.code} (${p.name})`,
        description: p.boomLength || undefined,
      })),
    ],
    [pumps]
  );

  const operatorOptions = useMemo(
    () => [
      {
        value: 'unassigned',
        label: 'Assign later (Unassigned)',
        description: 'You can assign an operator anytime before dispatch',
      },
      { value: 'Rob Black', label: 'Rob Black', description: 'ACPA Certified • (207) 555-0168' },
      { value: 'Dave Smith', label: 'Dave Smith', description: '47M Heavy Boom Specialist' },
      { value: 'Tony Perez', label: 'Tony Perez', description: 'Line Pump & Trailer Specialist' },
      { value: 'Marcus Brody', label: 'Marcus Brody', description: 'Commercial Pours • Relief Operator' },
      { value: 'Sam Higgins', label: 'Sam Higgins', description: 'Boom Apprentice • Yard Lead' },
    ],
    []
  );

  const supplierOptions = useMemo(
    () => [
      { value: '', label: 'None / Not specified' },
      ...SAMPLE_SUPPLIERS.map((s) => ({ value: s, label: s })),
    ],
    []
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

  const formattedDate = formatInTimeZone(
    selectedDate,
    TIMEZONE,
    'MMMM d, yyyy',
  );

  const handleCreateOrder = () => {
    const errors: {
      customer?: string;
      address?: string;
    } = {};

    if (!customer.trim()) {
      errors.customer = 'Customer is required.';
    }
    if (!address.trim()) {
      errors.address = 'Job site address or city/town is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Required Information Missing', {
        description:
          errors.customer ||
          errors.address ||
          'Please enter required job site details.',
      });
      return;
    }

    setFormErrors({});
    const isAssignLater = assignedPumpId === 'assign-later' || !assignedPumpId;
    const selectedPump = pumps.find((p) => p.id === assignedPumpId);

    // Parse hour from pourTime
    let hour = 14;
    const match = pourTime.match(/(\d+):?(\d*)\s*(AM|PM)?/i);
    if (match) {
      let h = parseInt(match[1], 10);
      const period = match[3]?.toUpperCase();
      if (period === 'PM' && h < 12) h += 12;
      if (period === 'AM' && h === 12) h = 0;
      hour = h;
    }

    const trimmedAddress = address.trim();
    let finalJobSite = trimmedAddress;
    let finalAddress = trimmedAddress;

    if (trimmedAddress.includes(',')) {
      const parts = trimmedAddress.split(',').map((p) => p.trim());
      finalJobSite = parts[0];
      finalAddress = parts.slice(1).join(', ');
    }

    const parsedVolume = Number(volumeYards) || 80;
    const finalOperator = assignedOperator !== 'unassigned' ? assignedOperator : undefined;
    const finalDispatchStatus = finalOperator ? (editingBooking?.dispatchStatus || 'draft') : 'unassigned';

    if (editingBooking && onUpdateBooking) {
      const updated: ScheduleBooking = {
        ...editingBooking,
        customerName: customer,
        jobSiteName: finalJobSite,
        address: finalAddress,
        pourType: pourType,
        volumeYards: parsedVolume,
        pumpId: isAssignLater ? '' : assignedPumpId,
        startHour: hour,
        operator: finalOperator,
        dispatchStatus: finalDispatchStatus,
      };
      onUpdateBooking(updated);
      toast.success('Order Updated', {
        description: `${customer} • ${selectedPump?.code || 'Unassigned'}`,
      });
    } else {
      const uniqueId =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : `order-${Date.now()}`;
      const shortCode = uniqueId.slice(0, 4).toUpperCase();

      const newOrder: ScheduleBooking = {
        id: `ord-${uniqueId}`,
        orderNumber: `ORD-${shortCode}`,
        pumpId: isAssignLater ? '' : assignedPumpId,
        customerName: customer,
        jobSiteName: finalJobSite,
        address: finalAddress,
        pourType: pourType,
        startHour: hour,
        durationHours: 3,
        volumeYards: parsedVolume,
        status: isAssignLater ? 'travel' : 'onsite',
        operator: finalOperator,
        dispatchStatus: finalDispatchStatus,
      };

      if (isAssignLater) {
        if (onAddUnassignedJob) {
          onAddUnassignedJob(newOrder);
        } else {
          onAddBooking(newOrder);
        }
        toast.info('Pending Order Created', {
          description: `${customer} in ${finalAddress} added to Unassigned Jobs.`,
        });
      } else {
        onAddBooking(newOrder);
        toast.success('Order Booked on Schedule', {
          description: `${customer} assigned to ${selectedPump?.code || 'Rig'} at ${pourTime}.`,
        });
      }
    }

    onOpenChange(false);
  };

  // Delete confirmation dialog state
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  const handleConfirmDelete = () => {
    if (editingBooking && onDeleteBooking) {
      onDeleteBooking(editingBooking.id);
      toast.info('Order Removed', {
        description: `Order ${editingBooking.orderNumber} removed from schedule.`,
      });
      setIsDeleteDialogOpen(false);
      onOpenChange(false);
    }
  };

  const isAssignLater = assignedPumpId === 'assign-later' || !assignedPumpId;
  const assignedPump = pumps.find((p) => p.id === assignedPumpId);

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
                setCustomer(val);
                if (formErrors.customer) {
                  setFormErrors((prev) => ({
                    ...prev,
                    customer: undefined,
                  }));
                }
              }}
              options={SAMPLE_CUSTOMERS}
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
            <AppSelect
              value={supplier}
              onChange={setSupplier}
              options={supplierOptions}
              placeholder="Select supplier (optional)..."
              icon={Building2}
              className="h-10"
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
              <span className="text-[10.5px] text-slate-400">Cubic yards (yd³)</span>
            </div>
            <div className="flex items-center gap-2 h-10 px-3 rounded-lg border border-slate-200 bg-white focus-within:border-brand transition-colors shadow-2xs">
              <input
                type="number"
                min={1}
                step={1}
                value={volumeYards}
                onChange={(e) => setVolumeYards(e.target.value)}
                placeholder="e.g. 80"
                className="text-xs font-medium text-slate-900 bg-transparent outline-none w-full placeholder:text-slate-400"
              />
              <span className="text-xs font-semibold text-slate-400 shrink-0">yd³</span>
            </div>
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
          <div
            className={cn(
              'flex items-center gap-2 h-10 px-3 rounded-lg border transition-colors shadow-2xs',
              formErrors.address
                ? 'border-red-500 bg-red-50/20'
                : 'border-slate-200 bg-white focus-within:border-brand',
            )}
          >
            <MapPin
              className={cn(
                'h-4 w-4 shrink-0',
                formErrors.address ? 'text-red-500' : 'text-slate-400',
              )}
            />
            <input
              type="text"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (formErrors.address) {
                  setFormErrors((prev) => ({
                    ...prev,
                    address: undefined,
                  }));
                }
              }}
              placeholder="e.g. 24 Bay View Street, Camden or Camden, ME *"
              className="text-xs text-slate-900 bg-transparent placeholder:text-slate-400 outline-none w-full font-medium"
            />
            {address.trim() && (
              <Check className="h-3.5 w-3.5 text-brand shrink-0" />
            )}
          </div>

          {/* Quick Town Suggestions */}
          <div className="flex flex-wrap items-center gap-1.5 pt-1">
            <span className="text-[10px] text-slate-400 font-medium">
              Quick select town:
            </span>
            {[
              'Warren, ME',
              'Camden, ME',
              'Rockport, ME',
              'Rockland, ME',
            ].map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => {
                  if (address.trim() && !address.toLowerCase().includes(t.toLowerCase().split(',')[0])) {
                    setAddress(`${address.trim()}, ${t}`);
                  } else {
                    setAddress(t);
                  }
                  if (formErrors.address) {
                    setFormErrors((prev) => ({
                      ...prev,
                      address: undefined,
                    }));
                  }
                }}
                className={cn(
                  'text-[10.5px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer',
                  address.includes(t)
                    ? 'bg-brand-light border-brand text-brand font-semibold'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900',
                )}
              >
                {t}
              </button>
            ))}
          </div>

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
              options={PUMP_SIZES}
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
              onChange={setAssignedPumpId}
              options={pumpOptions}
              icon={Truck}
              className="h-10"
            />
          </div>

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
          {isAssignLater ? (
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
            date: formattedDate,
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
                <span>Delete</span>
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
              className="h-9 px-5 rounded-lg bg-brand hover:bg-brand-hover text-white text-sm font-semibold shadow-2xs transition-all cursor-pointer active:scale-98"
            >
              {isEditMode ? 'Save changes' : 'Create order'}
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
  initialPumpId,
  initialHour = 7,
  editingBooking,
  onAddBooking,
  onAddUnassignedJob,
  onUpdateBooking,
  onDeleteBooking,
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
          initialPumpId={initialPumpId}
          initialHour={initialHour}
          editingBooking={editingBooking}
          onOpenChange={onOpenChange}
          onAddBooking={onAddBooking}
          onAddUnassignedJob={onAddUnassignedJob}
          onUpdateBooking={onUpdateBooking}
          onDeleteBooking={onDeleteBooking}
        />
      </DialogContent>
    </Dialog>
  );
}
