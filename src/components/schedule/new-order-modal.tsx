'use client';

import { useState, useMemo, useRef, useTransition } from 'react';
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
  UserPlus,
  Contact,
} from 'lucide-react';
import { PumpLane, ScheduleBooking } from './schedule-types';
import { toast } from 'sonner';
import Link from 'next/link';
import type { OrderFormContact, OrderFormCustomer, OrderFormOptions } from '@/features/orders/types';
import { cn } from '@/lib/utils';
import { DeleteOrderDialog } from './delete-order-dialog';
import { cancelOrder, createOrder, updateOrder } from '@/features/orders/server/actions';
import { clockFromHour, parseClock, shiftClock } from '@/features/orders/mappers';
import { findOverlap } from '@/features/orders/conflicts';
import { DEFAULT_TRAVEL_MINUTES, findTravelClash } from '@/features/orders/travel';
import { TravelClashDialog, type PendingTravelClash } from './travel-clash-dialog';
import { TravelTimeField } from '@/components/orders/travel-time-field';
import { useDriveTime } from '@/components/orders/use-drive-time';
import { CLEANUP_MINUTES, PREP_MINUTES, pumpMinutesFor } from '@/features/orders/duration';
import { reportAction } from '@/lib/action-feedback';
import { SiteCombobox } from '@/components/orders/site-combobox';
import { SupplierCombobox } from '@/components/orders/supplier-combobox';
import { ensureSupplier } from '@/features/suppliers/ensure';
import { QuickCustomerDialog } from './quick-customer-dialog';
import { QuickContactDialog } from './quick-contact-dialog';

/** Select values for the "add new" rows at the bottom of the customer and contact pickers. */
const NEW_CUSTOMER = '__new_customer__';
const NEW_CONTACT = '__new_contact__';

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
    clockFromHour(editingBooking ? editingBooking.pourHour : initialHour || 14),
  );

  // Drive time into this job, from the shop or the pump's previous job.
  const [travelMinutes, setTravelMinutes] = useState(() => editingBooking?.travelMinutes ?? DEFAULT_TRAVEL_MINUTES);
  // Once the dispatcher picks a drive time themselves, Google's estimate no longer replaces it.
  const travelPickedByHand = useRef(false);
  // Linked: the crew drives straight from the pump's previous job. Not linked: from the shop.
  const [linkedToPrevious, setLinkedToPrevious] = useState(() => editingBooking?.linkedToPrevious ?? false);
  const [pendingTravel, setPendingTravel] = useState<{ clash: PendingTravelClash; suggestedPour: string | null; save: (pourClock: string) => void } | null>(null);

  // Customer & Supplier States
  const [customer, setCustomer] = useState(
    () => editingBooking?.customerName || '',
  );
  const [supplier, setSupplier] = useState(() => editingBooking?.supplierName ?? '');

  // Customers and contacts added from this form, shown at once without leaving it.
  const [addedCustomers, setAddedCustomers] = useState<OrderFormCustomer[]>([]);
  const [addedContacts, setAddedContacts] = useState<Record<string, OrderFormContact[]>>({});
  const [isCustomerDialogOpen, setIsCustomerDialogOpen] = useState(false);
  const [isContactDialogOpen, setIsContactDialogOpen] = useState(false);
  const [contactId, setContactId] = useState(() => editingBooking?.contactId ?? '');
  const [contactChosen, setContactChosen] = useState(false);

  const customers = useMemo(() => {
    const known = new Set(options.customers.map((c) => c.id));
    return [...options.customers, ...addedCustomers.filter((c) => !known.has(c.id))].map((c) => {
      const extra = (addedContacts[c.id] ?? []).filter((x) => !c.contacts.some((k) => k.id === x.id));
      return extra.length ? { ...c, contacts: [...c.contacts, ...extra] } : c;
    });
  }, [options.customers, addedCustomers, addedContacts]);
  const selectedCustomer = customers.find((c) => c.name === customer);
  const contactList = selectedCustomer?.contacts ?? [];
  // Falls back to the customer's first contact until someone picks another.
  const effectiveContactId = contactList.some((c) => c.id === contactId) ? contactId : (contactList[0]?.id ?? '');

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
    () => editingBooking?.volumeYards || '',
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
    // Volume is optional: blank is fine, and the pour then defaults to 1 hour.
    if (checkVolume !== 0 && String(volumeYards).trim() !== '' && (isNaN(checkVolume) || checkVolume < 1 || checkVolume > 10000)) {
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

    const customerRecord = customers.find((c) => c.name === customer);
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
      estimatedYards: Number(volumeYards) || 0,
      minPumpSize,
      equipmentId: pumpId,
      employeeId: operatorId,
    };

    const save = (pourClock: string) =>
      startSaving(async () => {
      await ensureSupplier(supplier, options.suppliers);
      if (editingBooking) {
        if (!editingBooking.jobId || editingBooking.version === undefined) return;
        const result = await updateOrder({
          ...base,
          id: editingBooking.jobId,
          version: editingBooking.version,
          date: isoDate,
          pourTime: pourClock,
          travelMinutes,
          linkedToPrevious,
          // Giving a pump to an order that had none confirms it, like a new order with a pump.
          ...(!editingBooking.pumpId && !isAssignLater ? { bookingStatus: 'confirmed' as const } : {}),
          ...(contactChosen ? { contactId: effectiveContactId || null } : {}),
          // A new volume means a new pour length: finish moves with it, prep and clean-up stay as saved.
          ...(volumeChanged
            ? {
                pumpMinutes,
                estimatedFinish: shiftClock(pourClock, pumpMinutes + savedCleanupMinutes),
              }
            : {}),
        });
        if (!reportAction(result, { entity: 'order', refresh: () => router.refresh() })) return;
        toast.success('Order updated', {
          description: `${customer} • ${selectedPump?.code || 'Unassigned'}`,
        });
      } else {
        const result = await createOrder({
          ...base,
          date: isoDate,
          pourTime: pourClock,
          arriveBy: shiftClock(pourClock, -PREP_MINUTES),
          estimatedFinish: shiftClock(pourClock, pumpMinutes + CLEANUP_MINUTES),
          prepMinutes: PREP_MINUTES,
          pumpMinutes,
          cleanupMinutes: CLEANUP_MINUTES,
          travelMinutes,
          linkedToPrevious,
          linesOnSite: false,
          collectOnDelivery: false,
          bookingStatus: isAssignLater ? 'pending' : 'confirmed',
          contactId: effectiveContactId || null,
        });
        if (!reportAction(result, { entity: 'order', refresh: () => router.refresh() })) return;
        if (isAssignLater) {
          toast.info('Pending order created', {
            description: `${result.data.job_number} for ${customer} is waiting for a pump.`,
          });
        } else {
          toast.success('Order booked on the schedule', {
            description: `${result.data.job_number} • ${customer} on ${selectedPump?.code || 'a pump'} at ${pourClock}.`,
          });
        }
      }
      onOpenChange(false);
      });

    // Too little drive time from the pump's other job: ask before saving.
    const prepHours = savedPrepMinutes / 60;
    const chosen = parseClock(pourTime);
    const pourHourNow = chosen.hour + chosen.minute / 60;
    const travel =
      !isAssignLater && isoDate === date
        ? findTravelClash(bookings, {
            pumpId: assignedPumpId,
            startHour: pourHourNow - prepHours,
            durationHours: (savedPrepMinutes + pumpMinutes + savedCleanupMinutes) / 60,
            prepHours,
            travelMinutes,
            linked: linkedToPrevious,
            ignoreId: editingBooking?.id,
          })
        : null;
    if (travel) {
      setPendingTravel({
        save,
        suggestedPour: travel.suggestedPourHour === null ? null : clockFromHour(travel.suggestedPourHour),
        clash: {
          kind: travel.kind,
          customerName: customer,
          otherCustomerName: travel.other.customerName,
          otherOrderNumber: travel.other.orderNumber,
          gapMinutes: travel.gapMinutes,
          travelMinutes: travel.travelMinutes,
          suggestedPourClock: travel.suggestedPourHour === null ? null : clockFromHour(travel.suggestedPourHour),
          chosenPourClock: pourTime,
        },
      });
      return;
    }
    save(pourTime);
  };

  const answerTravel = (moveToSuggested: boolean) => {
    if (!pendingTravel) return;
    const { suggestedPour, save } = pendingTravel;
    setPendingTravel(null);
    if (moveToSuggested && suggestedPour) {
      setPourTime(suggestedPour);
      save(suggestedPour);
      return;
    }
    save(pourTime);
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

  // How long the job takes: 60 minutes + 1.5 per yard (to the nearest 15), with prep before and clean-up after.
  // An order that already exists keeps its own prep and clean-up.
  const savedPrepMinutes = editingBooking ? Math.round((editingBooking.pourHour - editingBooking.startHour) * 60) : PREP_MINUTES;
  const savedCleanupMinutes = editingBooking
    ? Math.max(
        0,
        Math.round((editingBooking.durationHours - (editingBooking.pourHour - editingBooking.startHour) - editingBooking.pourHours) * 60),
      )
    : CLEANUP_MINUTES;
  // Changing the volume works out the pour again; otherwise an existing order keeps the pour it has.
  const volumeChanged = !editingBooking || Number(volumeYards) !== editingBooking.volumeYards;
  const pumpMinutes = volumeChanged || !editingBooking ? pumpMinutesFor(Number(volumeYards)) : Math.round(editingBooking.pourHours * 60);

  // Only a warning: the dispatcher can still save a time that overlaps another pour.
  const { hour: pourHour, minute: pourMinute } = parseClock(pourTime);
  const clash =
    !isAssignLater && format(selectedDate, 'yyyy-MM-dd') === date
      ? findOverlap(bookings, {
          pumpId: assignedPumpId,
          // The whole block: prep before the pour through clean-up, for the pour this volume takes.
          startHour: pourHour + pourMinute / 60 - savedPrepMinutes / 60,
          durationHours: (savedPrepMinutes + pumpMinutes + savedCleanupMinutes) / 60,
          ignoreId: editingBooking?.id,
        })
      : null;

  // New orders get the drive time from Google once the pump, time and address are known.
  const driveStatus = useDriveTime({
    enabled: !isEditMode && !isAssignLater,
    date: isoDate,
    pumpId: isAssignLater ? null : assignedPumpId,
    startHour: pourHour + pourMinute / 60 - savedPrepMinutes / 60,
    destination: address,
    linked: linkedToPrevious,
    operatorId: options.operators.find((o) => o.name === assignedOperator)?.id,
    onEstimate: (minutes) => {
      if (!travelPickedByHand.current) setTravelMinutes(minutes);
    },
  });

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
          <div className="sm:col-span-2">
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Travel time to this job
            </label>
            <TravelTimeField
              value={travelMinutes}
              onChange={(minutes) => {
                travelPickedByHand.current = true;
                setTravelMinutes(minutes);
              }}
              status={driveStatus}
              linked={linkedToPrevious}
              onLinkedChange={setLinkedToPrevious}
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
                if (val === NEW_CUSTOMER) {
                  setIsCustomerDialogOpen(true);
                  return;
                }
                // Fill in the new customer's first saved site, unless the dispatcher typed their own address.
                const previousSites = customers.find((c) => c.name === customer)?.sites ?? [];
                const typedOwnAddress =
                  address.trim() !== '' && !previousSites.some((site) => site.address === address);
                setCustomer(val);
                if (!typedOwnAddress) {
                  const nextAddress = customers.find((c) => c.name === val)?.sites[0]?.address ?? '';
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
              options={[
                ...customers.map((c) => c.name),
                {
                  value: NEW_CUSTOMER,
                  label: 'Add new customer',
                  description: 'Keeps your order as it is',
                  icon: UserPlus,
                  variant: 'action' as const,
                },
              ]}
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

        {/* Job contact: who the crew calls on site */}
        <div>
          <label className="text-xs font-semibold text-slate-700 block mb-1">
            Contact <span className="text-slate-400 font-normal">(optional)</span>
          </label>
          <AppSelect
            value={effectiveContactId}
            onChange={(val) => {
              if (val === NEW_CONTACT) {
                setIsContactDialogOpen(true);
                return;
              }
              setContactId(val);
              setContactChosen(true);
            }}
            options={[
              ...contactList.map((c) => ({
                value: c.id,
                label: c.name,
                description: [c.role, c.phone].filter(Boolean).join(' · ') || undefined,
              })),
              ...(selectedCustomer ? [{
                    value: NEW_CONTACT,
                    label: 'Add new contact',
                    description: `For ${selectedCustomer.name}`,
                    icon: UserPlus,
                    variant: 'action' as const,
                  }] : []),
            ]}
            placeholder={selectedCustomer ? 'No contact yet' : 'Pick a customer first'}
            disabled={!selectedCustomer}
            icon={Contact}
            className="h-10"
          />
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
                Estimated volume <span className="font-normal text-slate-400">(optional)</span>
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
            sites={selectedCustomer?.sites ?? []}
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

      {/* Add a customer or contact without leaving this form */}
      <QuickCustomerDialog
        open={isCustomerDialogOpen}
        onOpenChange={setIsCustomerDialogOpen}
        onCreated={(created) => {
          setAddedCustomers((prev) => [...prev, { id: created.id, name: created.name, contacts: [], sites: [] }]);
          setCustomer(created.name);
          setContactId('');
          setContactChosen(false);
          setFormErrors((prev) => {
            if (!prev.customer) return prev;
            const next = { ...prev };
            delete next.customer;
            return next;
          });
        }}
        onReload={() => router.refresh()}
      />
      {selectedCustomer && (
        <QuickContactDialog
          open={isContactDialogOpen}
          onOpenChange={setIsContactDialogOpen}
          customerId={selectedCustomer.id}
          customerName={selectedCustomer.name}
          onCreated={(created) => {
            setAddedContacts((prev) => ({
              ...prev,
              [selectedCustomer.id]: [...(prev[selectedCustomer.id] ?? []), created],
            }));
            setContactId(created.id);
            setContactChosen(true);
          }}
          onReload={() => router.refresh()}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteOrderDialog
        isOpen={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        booking={editingBooking}
        onConfirmDelete={handleConfirmDelete}
      />
      <TravelClashDialog
        clash={pendingTravel?.clash ?? null}
        onMove={() => answerTravel(true)}
        onKeep={() => answerTravel(false)}
        onCancel={() => setPendingTravel(null)}
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
        className="grid-cols-[minmax(0,1fr)] max-sm:top-0 max-sm:left-0 max-sm:translate-x-0 max-sm:translate-y-0 max-sm:w-full max-sm:max-w-none max-sm:h-dvh max-sm:max-h-none max-sm:content-start max-sm:gap-5 max-sm:rounded-none max-sm:border-0 sm:max-w-[620px] sm:max-h-[92vh] overflow-y-auto overflow-x-hidden p-6 rounded-2xl bg-white gap-5 border border-slate-200/90 shadow-2xl"
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
