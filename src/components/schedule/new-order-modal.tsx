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
  const [supplier, setSupplier] = useState('Auburn Concrete');

  // Job Site States
  const [siteAddress, setSiteAddress] = useState(
    () => editingBooking?.jobSiteName || '',
  );
  const [townCity, setTownCity] = useState(() => editingBooking?.address || '');

  // Pump States
  const [minPumpSize, setMinPumpSize] = useState('34 meters');
  const [assignedPumpId, setAssignedPumpId] = useState<string>(
    () => editingBooking?.pumpId || initialPumpId || 'assign-later',
  );

  const [formErrors, setFormErrors] = useState<{
    customer?: string;
    siteAddress?: string;
    townCity?: string;
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
        description: p.operator || 'No Operator',
      })),
    ],
    [pumps]
  );

  const formattedDate = formatInTimeZone(
    selectedDate,
    TIMEZONE,
    'MMMM d, yyyy',
  );

  const handleCreateOrder = () => {
    const errors: {
      customer?: string;
      siteAddress?: string;
      townCity?: string;
    } = {};

    if (!customer.trim()) {
      errors.customer = 'Customer is required.';
    }
    if (!siteAddress.trim()) {
      errors.siteAddress = 'Street address is required.';
    }
    if (!townCity.trim()) {
      errors.townCity = 'Confirm the job-site town to continue.';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      toast.error('Required Information Missing', {
        description:
          errors.customer ||
          errors.siteAddress ||
          errors.townCity ||
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

    if (editingBooking && onUpdateBooking) {
      const updated: ScheduleBooking = {
        ...editingBooking,
        customerName: customer,
        jobSiteName: siteAddress,
        address: townCity || editingBooking.address,
        pumpId: isAssignLater ? '' : assignedPumpId,
        startHour: hour,
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
        jobSiteName: siteAddress,
        address: townCity,
        startHour: hour,
        durationHours: 3,
        volumeYards: 120,
        status: isAssignLater ? 'travel' : 'onsite',
      };

      if (isAssignLater) {
        if (onAddUnassignedJob) {
          onAddUnassignedJob(newOrder);
        } else {
          onAddBooking(newOrder);
        }
        toast.info('Pending Order Created', {
          description: `${customer} at ${siteAddress} added to Unassigned Jobs.`,
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

  const handleDelete = () => {
    if (editingBooking && onDeleteBooking) {
      onDeleteBooking(editingBooking.id);
      toast.info('Order Removed', {
        description: `Order ${editingBooking.orderNumber} removed from schedule.`,
      });
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

          {/* Concrete Supplier Field */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Concrete supplier
            </label>
            <AppSelect
              value={supplier}
              onChange={setSupplier}
              options={SAMPLE_SUPPLIERS}
              placeholder="Select supplier..."
              icon={Building2}
              className="h-10"
            />
          </div>
        </div>

        {/* Row 3: Job Site Location (Street Address + Town/City) */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Job site <span className="text-red-500">*</span>
          </label>
          <div className="bg-white rounded-lg border border-slate-200 p-3 shadow-2xs space-y-2.5 transition-colors hover:border-slate-300">
            {/* Street Address Input */}
            <div className="space-y-1">
              <div
                className={cn(
                  'flex items-center gap-2 h-9 px-3 rounded-md border bg-white transition-colors',
                  formErrors.siteAddress
                    ? 'border-red-500 bg-red-50/20'
                    : 'border-slate-200 focus-within:border-brand',
                )}
              >
                <MapPin
                  className={cn(
                    'h-4 w-4 shrink-0',
                    formErrors.siteAddress ? 'text-red-500' : 'text-slate-400',
                  )}
                />
                <input
                  type="text"
                  value={siteAddress}
                  onChange={(e) => {
                    setSiteAddress(e.target.value);
                    if (formErrors.siteAddress) {
                      setFormErrors((prev) => ({
                        ...prev,
                        siteAddress: undefined,
                      }));
                    }
                  }}
                  placeholder="Job site street address"
                  className="text-xs font-semibold text-slate-900 bg-transparent outline-none w-full placeholder:text-slate-400"
                />
                <Pencil className="h-3.5 w-3.5 text-slate-400 shrink-0" />
              </div>
              {formErrors.siteAddress && (
                <p className="text-[11px] text-red-500 font-medium px-1">
                  {formErrors.siteAddress}
                </p>
              )}
            </div>

            {/* Nested Town/City Input: clean border focus, zero ring */}
            <div className="space-y-1.5">
              <div
                className={cn(
                  'flex items-center gap-2 h-9 px-3 rounded-md border bg-slate-50/70 focus-within:bg-white transition-colors',
                  formErrors.townCity
                    ? 'border-red-500 bg-red-50/30'
                    : 'border-slate-200 focus-within:border-brand',
                )}
              >
                <Building2
                  className={cn(
                    'h-3.5 w-3.5 shrink-0',
                    formErrors.townCity ? 'text-red-500' : 'text-slate-400',
                  )}
                />
                <input
                  type="text"
                  value={townCity}
                  onChange={(e) => {
                    setTownCity(e.target.value);
                    if (formErrors.townCity) {
                      setFormErrors((prev) => ({
                        ...prev,
                        townCity: undefined,
                      }));
                    }
                  }}
                  placeholder="Town / city"
                  className="text-xs text-slate-900 bg-transparent placeholder:text-slate-400 outline-none w-full font-medium"
                />
                {townCity && (
                  <Check className="h-3.5 w-3.5 text-brand shrink-0" />
                )}
              </div>

              {/* Quick Town Suggestions */}
              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[10px] text-slate-400 font-medium">
                  Quick select:
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
                      setTownCity(t);
                      setFormErrors((prev) => ({
                        ...prev,
                        townCity: undefined,
                      }));
                    }}
                    className={cn(
                      'text-[10.5px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer',
                      townCity === t
                        ? 'bg-brand-light border-brand text-brand font-semibold'
                        : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:text-slate-900',
                    )}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {formErrors.townCity ? (
                <p className="text-[11px] text-red-500 font-semibold px-1 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 shrink-0" />
                  <span>{formErrors.townCity}</span>
                </p>
              ) : (
                <p className="text-[11px] text-slate-500 font-normal px-1">
                  Select town to confirm address
                </p>
              )}
            </div>
          </div>
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
              order • Assigned to {assignedPump?.code || 'Pump'} (
              {assignedPump?.operator || 'No Operator'})
            </>
          )}
        </span>
      </div>

      {/* ── Footer Actions ── */}
      <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Left Action: Open Full Form */}
        <Link
          href="/orders/new"
          onClick={() => onOpenChange(false)}
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-slate-700 hover:text-slate-900 transition-colors"
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
                onClick={handleDelete}
                className="h-9 px-3 text-red-600 hover:text-red-700 hover:bg-red-50 text-xs font-medium gap-1.5 rounded-lg"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </Button>
            )}
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 rounded-lg border-slate-200 text-xs text-slate-700 hover:bg-slate-50 transition-colors"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreateOrder}
              className="h-9 px-5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-2xs transition-all cursor-pointer active:scale-98"
            >
              {isEditMode ? 'Save changes' : 'Create order'}
            </Button>
          </div>
          {Object.keys(formErrors).length > 0 ? (
            <span className="text-[10.5px] text-red-500 font-semibold pr-1 flex items-center gap-1">
              <AlertCircle className="h-3 w-3 shrink-0" />
              <span>Fill required fields to create order</span>
            </span>
          ) : !townCity ? (
            <span className="text-[10.5px] text-slate-400 pr-1">
              Confirm the job-site town to continue.
            </span>
          ) : null}
        </div>
      </div>
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
