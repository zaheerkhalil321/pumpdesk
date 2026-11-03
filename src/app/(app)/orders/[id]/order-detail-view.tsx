'use client';

import { useMemo, useState, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Clock,
  Box,
  Phone,
  MessageSquare,
  ArrowUpRight,
  Pencil,
  Truck,
  User,
  ChevronLeft,
  X,
  Plus,
  Save,
  Info,
  UserPlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AppSelect } from '@/components/ui/app-select';
import { DatePicker } from '@/components/ui/date-picker';
import { Switch } from '@/components/ui/switch';
import { SiteCombobox } from '@/components/orders/site-combobox';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { CopyButton } from '@/components/ui/copy-button';
import { reportAction } from '@/lib/action-feedback';
import { cancelOrder, updateOrder } from '@/features/orders/server/actions';
import { POUR_TYPE_OPTIONS, STANDARD_TIMES } from '@/features/orders/constants';
import type {
  FullOrderData,
  OrderFormContact,
  OrderFormCustomer,
  OrderFormOptions,
} from '@/features/orders/types';
import { QuickCustomerDialog } from '@/components/schedule/quick-customer-dialog';
import { QuickContactDialog } from '@/components/schedule/quick-contact-dialog';
import { shiftClock } from '@/features/orders/mappers';
import { pumpMinutesFor } from '@/features/orders/duration';
import {
  EDITABLE_ORDER_STATUSES,
  ORDER_STATUS_STYLE,
  toBookingStatus,
  type EditableOrderStatus,
  type OrderStatus,
} from '@/features/orders/statuses';

/** Select value for the "add new customer" row at the bottom of the customer picker. */
const NEW_CUSTOMER = '__new_customer__';
const NEW_CONTACT = '__new_contact__';

/** The status an order is edited from; a cancelled order cannot be edited, so it never gets here. */
const editableStatusOf = (status: OrderStatus): EditableOrderStatus =>
  status === 'Cancelled' ? 'Pending' : status;

interface OrderDetailViewProps {
  order: FullOrderData;
  options: OrderFormOptions;
}

const UNASSIGNED = 'unassigned';
const NONE = 'none';

type ItemRow = { name: string; quantity: string };
const toRows = (items: { name: string; quantity: number }[]): ItemRow[] =>
  items.length ? items.map((i) => ({ name: i.name, quantity: String(i.quantity) })) : [{ name: '', quantity: '1' }];

/** Makes sure a saved value is still in a dropdown even if the standard list lacks it. */
const withValue = (list: string[], value: string) =>
  value && !list.includes(value) ? [value, ...list] : list;

export function OrderDetailView({ order, options }: OrderDetailViewProps) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');

  const isCancelled = order.status === 'Cancelled';

  // ── Edit Order Screen Form State (reset from the saved order each time it opens) ──
  const [editCustomer, setEditCustomer] = useState(order.customer);
  const [editJobSite, setEditJobSite] = useState(order.jobSiteAddress);
  const [editContact, setEditContact] = useState(order.customerContact);
  const [editPO, setEditPO] = useState(order.purchaseOrder);
  const [editJobName, setEditJobName] = useState(order.jobName);
  const [editPourType, setEditPourType] = useState(order.pourType);
  const [editVolume, setEditVolume] = useState<number | string>(order.volumeYards);
  const [editPumpRequested, setEditPumpRequested] = useState(order.pumpRequested);
  const [editInstructions, setEditInstructions] = useState(order.siteInstructions);
  const [editDate, setEditDate] = useState(order.serviceDateIso);
  const [editArriveBy, setEditArriveBy] = useState(order.arriveBy);
  const [editPourTime, setEditPourTime] = useState(order.pourTime);
  const [editEstimatedEnd, setEditEstimatedEnd] = useState(order.estimatedEnd);
  const [editPumpId, setEditPumpId] = useState(order.pumpId ?? UNASSIGNED);
  const [editOperatorId, setEditOperatorId] = useState(order.operatorId ?? UNASSIGNED);
  const [editSupplier, setEditSupplier] = useState(order.supplierName);
  const [editCustomerNotes, setEditCustomerNotes] = useState(order.customerNotes);
  const [editInternalNote, setEditInternalNote] = useState(order.internalNote);
  const [editLinesOnSite, setEditLinesOnSite] = useState(order.linesOnSite);
  const [editCollect, setEditCollect] = useState(order.collectOnDelivery);
  const [editMaxPumpSize, setEditMaxPumpSize] = useState(order.maxPumpSize || NONE);
  const [editExtraItems, setEditExtraItems] = useState(toRows(order.extraItems));
  const [editSecondOperatorId, setEditSecondOperatorId] = useState(order.secondOperatorId ?? UNASSIGNED);
  const [editStatus, setEditStatus] = useState<EditableOrderStatus>(editableStatusOf(order.status));

  const [errors, setErrors] = useState<Record<string, string>>({});
  const clearError = (field: string) => setErrors((prev) => ({ ...prev, [field]: '' }));

  const openEditOrder = () => {
    setEditCustomer(order.customer);
    setEditJobSite(order.jobSiteAddress);
    setEditContact(order.customerContact);
    setEditPO(order.purchaseOrder);
    setEditJobName(order.jobName);
    setEditPourType(order.pourType);
    setEditVolume(order.volumeYards);
    setEditPumpRequested(order.pumpRequested);
    setEditInstructions(order.siteInstructions);
    setEditDate(order.serviceDateIso);
    setEditArriveBy(order.arriveBy);
    setEditPourTime(order.pourTime);
    setEditEstimatedEnd(order.estimatedEnd);
    setEditPumpId(order.pumpId ?? UNASSIGNED);
    setEditOperatorId(order.operatorId ?? UNASSIGNED);
    setEditSupplier(order.supplierName);
    setEditCustomerNotes(order.customerNotes);
    setEditInternalNote(order.internalNote);
    setEditLinesOnSite(order.linesOnSite);
    setEditCollect(order.collectOnDelivery);
    setEditMaxPumpSize(order.maxPumpSize || NONE);
    setEditExtraItems(toRows(order.extraItems));
    setEditSecondOperatorId(order.secondOperatorId ?? UNASSIGNED);
    setEditStatus(editableStatusOf(order.status));
    setErrors({});
    setIsEditingOrder(true);
  };

  // Customers and contacts added while editing show at once, without leaving the order.
  const [addedCustomers, setAddedCustomers] = useState<OrderFormCustomer[]>([]);
  const [addedContacts, setAddedContacts] = useState<Record<string, OrderFormContact[]>>({});
  const [isAddCustomerOpen, setIsAddCustomerOpen] = useState(false);
  const [isAddContactOpen, setIsAddContactOpen] = useState(false);
  const customers = useMemo(() => {
    const known = new Set(options.customers.map((c) => c.id));
    return [...options.customers, ...addedCustomers.filter((c) => !known.has(c.id))].map((c) => {
      const extra = (addedContacts[c.id] ?? []).filter((x) => !c.contacts.some((k) => k.id === x.id));
      return extra.length ? { ...c, contacts: [...c.contacts, ...extra] } : c;
    });
  }, [options.customers, addedCustomers, addedContacts]);

  // Real records for the dropdowns, from the database.
  const selectedCustomer = customers.find((c) => c.name === editCustomer);
  const customerId = selectedCustomer?.id ?? order.customerId;
  const contactChoices = selectedCustomer?.contacts ?? [];
  const selectedContact = contactChoices.find((c) => c.name === editContact);
  const contactPhone =
    selectedContact?.phone ?? (editContact === order.customerContact ? order.customerPhone : '');
  const pumpChoices = [
    ...(order.pumpId && !options.pumps.some((p) => p.id === order.pumpId)
      ? [{ value: order.pumpId, label: order.assignedPumpCode }]
      : []),
    ...options.pumps.map((p) => ({ value: p.id, label: p.label })),
    { value: UNASSIGNED, label: 'Unassigned' },
  ];
  const operatorChoices = [
    ...(order.operatorId && !options.operators.some((o) => o.id === order.operatorId)
      ? [{ value: order.operatorId, label: order.assignedOperator }]
      : []),
    ...options.operators.map((o) => ({ value: o.id, label: o.name })),
    { value: UNASSIGNED, label: 'Unassigned' },
  ];
  // Choosing a pump swaps in its default operator, or clears the operator when it has none.
  const handlePumpChange = (pumpId: string) => {
    setEditPumpId(pumpId);
    const defaultId = options.pumps.find((p) => p.id === pumpId)?.defaultOperatorId;
    setEditOperatorId(options.operators.find((o) => o.id === defaultId)?.id ?? UNASSIGNED);
  };
  const secondOperatorChoices = [
    ...(order.secondOperatorId && !options.operators.some((o) => o.id === order.secondOperatorId)
      ? [{ value: order.secondOperatorId, label: order.secondOperatorName }]
      : []),
    ...options.operators.filter((o) => o.id !== editOperatorId).map((o) => ({ value: o.id, label: o.name })),
    { value: UNASSIGNED, label: 'None' },
  ];
  const pumpSizeChoices = withValue(
    [...new Set(options.pumps.map((p) => p.sizeLabel).filter(Boolean))],
    editPumpRequested,
  );
  const pourTypeChoices = withValue(
    POUR_TYPE_OPTIONS.map((o) => o.label),
    editPourType,
  );

  // Validate form fields
  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!editCustomer.trim()) {
      errs.customer = 'Customer is required';
    }
    if (editJobSite.trim().length < 2) {
      errs.jobSite = 'Town or site address is required';
    }
    if (!editDate) {
      errs.date = 'Service date is required';
    }
    if (!editPourTime.trim()) {
      errs.pourTime = 'Pour time is required';
    }
    if (!editArriveBy.trim()) {
      errs.arriveBy = 'Arrive by time is required';
    }
    const volume = Number(editVolume);
    if (!volume || volume < 1 || volume > 10000) {
      errs.volume = 'Volume must be between 1 and 10,000 yd³';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Save changes from Edit Order Screen
  const handleSaveOrderChanges = (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Validation Error', {
        description: 'Please correct the highlighted fields before saving.',
      });
      return;
    }

    const savedSite = selectedCustomer?.sites.find((site) => site.address === editJobSite);
    const payload = {
      id: order.jobId,
      version: order.version,
      customerId,
      jobSiteId: savedSite?.id ?? null,
      siteLabel: editJobSite,
      contactId:
        selectedContact?.id ?? (editContact === order.customerContact ? order.contactId : null),
      purchaseOrder: editPO,
      jobName: editJobName,
      pourType: editPourType,
      estimatedYards: Number(editVolume),
      minPumpSize: editPumpRequested,
      siteInstructions: editInstructions,
      date: editDate,
      pourTime: editPourTime,
      arriveBy: editArriveBy,
      estimatedFinish: editEstimatedEnd,
      ...(Number(editVolume) !== order.volumeYards ? { pumpMinutes: pumpMinutesFor(Number(editVolume)) } : {}),
      equipmentId: editPumpId === UNASSIGNED ? null : editPumpId,
      employeeId: editOperatorId === UNASSIGNED ? null : editOperatorId,
      bookingStatus: toBookingStatus(editStatus),
      supplierName: editSupplier,
      customerNotes: editCustomerNotes,
      internalNote: editInternalNote,
      linesOnSite: editLinesOnSite,
      collectOnDelivery: editCollect,
      maxPumpSize: editMaxPumpSize === NONE ? '' : editMaxPumpSize,
      extraItems: editExtraItems
        .filter((row) => row.name.trim())
        .map((row) => ({ name: row.name.trim(), quantity: Number(row.quantity) || 1 })),
      secondEmployeeId: editSecondOperatorId === UNASSIGNED ? null : editSecondOperatorId,
    };

    startSaving(async () => {
      const result = await updateOrder(payload);
      if (!reportAction(result, { entity: 'order', refresh: () => router.refresh() })) return;
      setIsEditingOrder(false);
      toast.success('Order changes saved', { description: `${order.id} updated successfully.` });
    });
  };

  const handleCancelOrder = () => {
    startSaving(async () => {
      const result = await cancelOrder({ id: order.jobId, version: order.version, reason: cancelReason });
      if (!reportAction(result, { entity: 'order', refresh: () => router.refresh() })) return;
      setIsCancelOpen(false);
      setCancelReason('');
      toast.success('Order cancelled', { description: `${order.id} is cancelled and its pump and operator are free.` });
    });
  };

  // Opens the phone's dialer or messages app (on a computer, whatever app handles phone links).
  const handleCall = (_name: string, phone: string) => {
    window.location.href = `tel:${phone.replace(/[^\d+]/g, '')}`;
  };

  const handleText = (_name: string, phone: string) => {
    window.location.href = `sms:${phone.replace(/[^\d+]/g, '')}`;
  };

  // ═════════════════════════════════════════════════════════════════════════
  // ── VIEW 1: FULL "EDIT ORDER" SCREEN (Matching Screenshot 1 exactly) ──
  // ═════════════════════════════════════════════════════════════════════════
  if (isEditingOrder) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 w-full space-y-6">
        {/* Top Back Link */}
        <div>
          <button
            type="button"
            onClick={() => setIsEditingOrder(false)}
            className="text-brand hover:underline font-semibold inline-flex items-center gap-1 text-xs cursor-pointer transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>Back to order</span>
          </button>
        </div>

        {/* Header: Title + Subtitle + Action Buttons */}
        <form onSubmit={handleSaveOrderChanges} className="space-y-6">
          <div className="flex items-start sm:items-center justify-between gap-3 sm:gap-4">
            <div className="min-w-0 flex-1">
              <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight text-slate-900 truncate">
                Edit order · {order.id}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                {order.customer} · {order.pourType}
              </p>
            </div>

            <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 justify-end self-start sm:self-center">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditingOrder(false)}
                className="h-9 px-3 sm:px-3.5 rounded-lg border-slate-200 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 gap-1.5 shadow-2xs cursor-pointer"
              >
                <X className="h-4 w-4 text-slate-500" />
                <span>Cancel</span>
              </Button>

              <Button
                type="submit"
                disabled={isSaving}
                className="h-9 px-3.5 sm:px-4 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs sm:text-sm font-semibold shadow-xs gap-1.5 cursor-pointer active:scale-98"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'Saving...' : 'Save'}</span>
              </Button>
            </div>
          </div>

          {/* 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* ── LEFT COLUMN ── */}
            <div className="space-y-6">
              {/* Card 1: Customer & job site */}
              <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-slate-900">Customer & job site</h2>

                <div className="space-y-3.5 text-xs">
                  {/* Customer Dropdown */}
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">Customer</label>
                    <AppSelect
                      value={editCustomer}
                      onChange={(val) => {
                        if (val === NEW_CUSTOMER) {
                          setIsAddCustomerOpen(true);
                          return;
                        }
                        setEditCustomer(val);
                        const next = customers.find((c) => c.name === val);
                        // A different customer means a different contact and site.
                        setEditContact(next?.contacts[0]?.name ?? '');
                        setEditJobSite(next?.sites[0]?.address ?? '');
                        clearError('customer');
                      }}
                      options={[
                        ...withValue(customers.map((c) => c.name), editCustomer),
                        {
                          value: NEW_CUSTOMER,
                          label: 'Add new customer',
                          description: 'Keeps your order as it is',
                          icon: UserPlus,
                          variant: 'action' as const,
                        },
                      ]}
                      error={Boolean(errors.customer)}
                    />
                    {errors.customer && (
                      <p className="text-[11px] text-red-500 font-medium">{errors.customer}</p>
                    )}
                  </div>

                  {/* Job site Dropdown */}
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">Job site</label>
                    <SiteCombobox
                      value={editJobSite}
                      onChange={(value) => {
                        setEditJobSite(value);
                        clearError('jobSite');
                      }}
                      sites={selectedCustomer?.sites ?? []}
                      error={Boolean(errors.jobSite)}
                      placeholder="Town, cross streets, or street address"
                    />
                    {errors.jobSite && (
                      <p className="text-[11px] text-red-500 font-medium">{errors.jobSite}</p>
                    )}
                  </div>

                  {/* Customer contact Dropdown */}
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">Customer contact</label>
                    <AppSelect
                      value={editContact}
                      onChange={(val) => {
                        if (val === NEW_CONTACT) {
                          setIsAddContactOpen(true);
                          return;
                        }
                        setEditContact(val);
                      }}
                      placeholder="No contact"
                      options={[
                        ...contactChoices.map((c) => ({
                          value: c.name,
                          label: c.name,
                          description: c.role || undefined,
                        })),
                        ...(selectedCustomer
                          ? [
                              {
                                value: NEW_CONTACT,
                                label: 'Add new contact',
                                description: `For ${selectedCustomer.name}`,
                                icon: UserPlus,
                                variant: 'action' as const,
                              },
                            ]
                          : []),
                      ]}
                    />
                    {contactPhone && (
                      <p className="text-[11px] text-slate-500 font-mono">{contactPhone}</p>
                    )}
                  </div>

                  {/* Purchase order */}
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">Purchase order</label>
                    <Input
                      value={editPO}
                      onChange={(e) => setEditPO(e.target.value)}
                      className="h-9 text-xs font-medium text-slate-900 border-slate-200 focus-visible:border-brand"
                    />
                  </div>
                </div>
              </div>

              {/* Card 2: Job details */}
              <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-slate-900">Job details</h2>

                <div className="space-y-3.5 text-xs">
                  {/* Job name */}
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">Job name</label>
                    <Input
                      value={editJobName}
                      onChange={(e) => setEditJobName(e.target.value)}
                      className="h-9 text-xs font-semibold text-slate-900 border-slate-200 focus-visible:border-brand"
                    />
                  </div>

                  {/* Concrete supplier */}
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">
                      Concrete supplier <span className="text-slate-400 font-normal">(optional)</span>
                    </label>
                    <Input
                      value={editSupplier}
                      onChange={(e) => setEditSupplier(e.target.value)}
                      placeholder="e.g. Auburn Concrete"
                      className="h-9 text-xs font-medium text-slate-900 border-slate-200 focus-visible:border-brand"
                    />
                  </div>

                  {/* Pour type Dropdown */}
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">Pour type</label>
                    <AppSelect
                      value={editPourType}
                      onChange={setEditPourType}
                      options={pourTypeChoices}
                    />
                  </div>

                  {/* Planned volume */}
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">Planned volume</label>
                    <div className="relative">
                      <Input
                        type="number"
                        value={editVolume}
                        onChange={(e) => {
                          setEditVolume(e.target.value);
                          if (errors.volume) setErrors((prev) => ({ ...prev, volume: '' }));
                          // A new volume means a new pour length: the finish moves with it (it can still be changed by hand).
                          if (Number(e.target.value) > 0) {
                            const pumpMinutes = pumpMinutesFor(Number(e.target.value));
                            const cleanupMinutes = Math.round(order.adjustedCleanup * 60);
                            setEditEstimatedEnd(shiftClock(editPourTime, pumpMinutes + cleanupMinutes));
                          }
                        }}
                        className={cn(
                          'h-9 pr-12 text-xs font-semibold text-slate-900 focus-visible:border-brand',
                          errors.volume ? 'border-red-400 bg-red-50/20' : 'border-slate-200'
                        )}
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 font-medium pointer-events-none">
                        yd³
                      </span>
                    </div>
                    {errors.volume && (
                      <p className="text-[11px] text-red-500 font-medium">{errors.volume}</p>
                    )}
                  </div>

                  {/* Pump requested Dropdown */}
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">Pump requested</label>
                    <AppSelect
                      value={editPumpRequested}
                      onChange={setEditPumpRequested}
                      options={pumpSizeChoices}
                    />
                  </div>

                  {/* Maximum pump size */}
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">
                      Maximum pump size <span className="text-slate-400 font-normal">(the site cannot take a bigger pump)</span>
                    </label>
                    <AppSelect
                      value={editMaxPumpSize}
                      onChange={setEditMaxPumpSize}
                      options={[{ value: NONE, label: 'No restriction' }, ...withValue(pumpSizeChoices, order.maxPumpSize).map((v) => ({ value: v, label: v }))]}
                    />
                  </div>

                  {/* Extra equipment and supplies */}
                  <div className="space-y-1.5">
                    <label className="text-slate-600 font-medium">Extra equipment &amp; supplies</label>
                    {editExtraItems.map((row, index) => (
                      <div key={index} className="grid grid-cols-[1fr_5.5rem_auto] gap-2 items-center">
                        <Input
                          value={row.name}
                          onChange={(e) =>
                            setEditExtraItems((rows) => rows.map((r, i) => (i === index ? { ...r, name: e.target.value } : r)))
                          }
                          placeholder="e.g. Extra 10 ft hose"
                          aria-label={`Item ${index + 1}`}
                          className="h-9 text-xs border-slate-200 focus-visible:border-brand"
                        />
                        <Input
                          type="number"
                          min={1}
                          max={100}
                          value={row.quantity}
                          onChange={(e) =>
                            setEditExtraItems((rows) => rows.map((r, i) => (i === index ? { ...r, quantity: e.target.value } : r)))
                          }
                          aria-label={`Quantity ${index + 1}`}
                          className="h-9 text-xs border-slate-200 focus-visible:border-brand"
                        />
                        <button
                          type="button"
                          aria-label={`Remove item ${index + 1}`}
                          onClick={() =>
                            setEditExtraItems((rows) => (rows.length > 1 ? rows.filter((_, i) => i !== index) : [{ name: '', quantity: '1' }]))
                          }
                          className="h-9 w-9 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 flex items-center justify-center cursor-pointer"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => setEditExtraItems((rows) => (rows.length >= 20 ? rows : [...rows, { name: '', quantity: '1' }]))}
                      className="text-brand hover:underline font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add item</span>
                    </button>
                  </div>

                  {/* Site instructions */}
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">Site instructions</label>
                    <textarea
                      value={editInstructions}
                      onChange={(e) => setEditInstructions(e.target.value)}
                      rows={3}
                      className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-brand leading-relaxed"
                    />
                  </div>

                  {/* Customer-visible details */}
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">Customer-visible details</label>
                    <textarea
                      value={editCustomerNotes}
                      onChange={(e) => setEditCustomerNotes(e.target.value)}
                      rows={2}
                      placeholder="Details shared with the customer"
                      className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-brand leading-relaxed placeholder:text-slate-400"
                    />
                  </div>

                  {/* Internal note */}
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">Internal note</label>
                    <textarea
                      value={editInternalNote}
                      onChange={(e) => setEditInternalNote(e.target.value)}
                      rows={2}
                      placeholder="Visible to your team only"
                      className="w-full p-2.5 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 outline-none focus:border-brand leading-relaxed placeholder:text-slate-400"
                    />
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-1">
                    <span className="text-slate-600 font-medium">Lines on site</span>
                    <Switch aria-label="Lines on site" checked={editLinesOnSite} onCheckedChange={setEditLinesOnSite} />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-slate-600 font-medium">Collect on delivery</span>
                    <Switch aria-label="Collect on delivery" checked={editCollect} onCheckedChange={setEditCollect} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── RIGHT COLUMN ── */}
            <div className="space-y-6">
              {/* Card 3: Schedule & assignment */}
              <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-slate-900">Schedule & assignment</h2>

                <div className="space-y-3.5 text-xs">
                  {/* Service date: Interactive Popover Calendar */}
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">Service date</label>
                    <DatePicker
                      ariaLabel="Service date"
                      size="sm"
                      value={editDate}
                      onChange={(value) => {
                        setEditDate(value);
                        clearError('date');
                      }}
                    />
                    {errors.date && (
                      <p className="text-[11px] text-red-500 font-medium">{errors.date}</p>
                    )}
                  </div>

                  {/* Times Row: Arrive by & Pour time with Selectable Time Menus */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Arrive by */}
                    <div className="space-y-1">
                      <label className="text-slate-600 font-medium">Arrive by</label>
                      <AppSelect
                        value={editArriveBy}
                        onChange={(val) => {
                          setEditArriveBy(val);
                          clearError('arriveBy');
                        }}
                        icon={Clock}
                        options={withValue(STANDARD_TIMES, editArriveBy)}
                        error={Boolean(errors.arriveBy)}
                      />
                      {errors.arriveBy && (
                        <p className="text-[11px] text-red-500 font-medium">{errors.arriveBy}</p>
                      )}
                    </div>

                    {/* Pour time */}
                    <div className="space-y-1">
                      <label className="text-slate-600 font-medium">Pour time</label>
                      <AppSelect
                        value={editPourTime}
                        onChange={(val) => {
                          setEditPourTime(val);
                          clearError('pourTime');
                        }}
                        icon={Clock}
                        options={withValue(STANDARD_TIMES, editPourTime)}
                        error={Boolean(errors.pourTime)}
                      />
                      {errors.pourTime && (
                        <p className="text-[11px] text-red-500 font-medium">{errors.pourTime}</p>
                      )}
                    </div>
                  </div>

                  {/* Estimated on-site end */}
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">Estimated on-site end</label>
                    <AppSelect
                      value={editEstimatedEnd}
                      onChange={setEditEstimatedEnd}
                      icon={Clock}
                      options={withValue(STANDARD_TIMES, editEstimatedEnd)}
                    />
                  </div>

                  {/* Assigned pump Dropdown */}
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">Assigned pump</label>
                    <AppSelect
                      value={editPumpId}
                      onChange={handlePumpChange}
                      options={pumpChoices}
                    />
                  </div>

                  {/* Operator Dropdown */}
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">Operator</label>
                    <AppSelect
                      value={editOperatorId}
                      onChange={setEditOperatorId}
                      options={operatorChoices}
                    />
                  </div>

                  {/* Additional operator */}
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">Additional operator</label>
                    <AppSelect
                      value={editSecondOperatorId}
                      onChange={setEditSecondOperatorId}
                      options={secondOperatorChoices}
                    />
                  </div>

                  {/* Booking status Dropdown */}
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">Booking status</label>
                    <AppSelect
                      value={editStatus}
                      onChange={(val) => setEditStatus(val as EditableOrderStatus)}
                      options={EDITABLE_ORDER_STATUSES.map((status) => ({ value: status, label: status }))}
                    />
                  </div>
                </div>
              </div>

              {/* Bottom Info Callout */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2 text-xs text-slate-500">
                <Info className="h-4 w-4 text-slate-400 shrink-0" />
                <span>To cancel this order, use Cancel order on the order page.</span>
              </div>
            </div>
          </div>
        </form>

        {/* Add a customer or contact without leaving the order */}
        <QuickCustomerDialog
          open={isAddCustomerOpen}
          onOpenChange={setIsAddCustomerOpen}
          onCreated={(created) => {
            setAddedCustomers((prev) => [...prev, { id: created.id, name: created.name, contacts: [], sites: [] }]);
            setEditCustomer(created.name);
            setEditContact('');
            clearError('customer');
          }}
          onReload={() => router.refresh()}
        />
        {selectedCustomer && (
          <QuickContactDialog
            open={isAddContactOpen}
            onOpenChange={setIsAddContactOpen}
            customerId={selectedCustomer.id}
            customerName={selectedCustomer.name}
            onCreated={(created) => {
              setAddedContacts((prev) => ({
                ...prev,
                [selectedCustomer.id]: [...(prev[selectedCustomer.id] ?? []), created],
              }));
              setEditContact(created.name);
            }}
            onReload={() => router.refresh()}
          />
        )}
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // ── VIEW 2: NORMAL ORDER DOSSIER (Overview & Work Ticket) ──
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="p-4 sm:p-6 lg:p-8 w-full space-y-5">
      {/* ── 1. Top Link ── */}
      <div className="flex items-center justify-between text-xs">
        {/* A cancelled order is no longer on the schedule. */}
        {isCancelled ? (
          <span />
        ) : (
          <Link
            href={`/schedule?date=${order.serviceDateIso}`}
            className="text-brand hover:underline font-semibold inline-flex items-center gap-1 transition-colors"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>View on schedule</span>
          </Link>
        )}

        <Link
          href="/orders"
          className="text-slate-500 hover:text-slate-900 transition-colors font-medium"
        >
          Back to orders
        </Link>
      </div>

      {/* ── 2. Header: Title + Status + Subtitle + Action Buttons ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {order.id} · {order.customer}
            </h1>
            <span
              className={cn(
                'inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border',
                ORDER_STATUS_STYLE[order.status].badge
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full shrink-0',
                  ORDER_STATUS_STYLE[order.status].dot
                )}
              />
              <span>{order.status}</span>
            </span>
          </div>

          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            {order.pourType} · {order.locationCity} · {order.serviceDate}
          </p>
        </div>

        {/* Top Right Action Buttons */}
        <div className="flex items-center gap-2 sm:gap-2.5 shrink-0 justify-end self-start sm:self-center">
          {!isCancelled && (
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCancelOpen(true)}
                className="h-9 px-3 sm:px-3.5 rounded-lg border-slate-200 text-xs sm:text-sm font-semibold text-red-600 hover:bg-red-50 gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-98"
              >
                <X className="h-4 w-4" />
                <span>Cancel order</span>
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={openEditOrder}
                className="h-9 px-3 sm:px-3.5 rounded-lg border-slate-200 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-98"
              >
                <Pencil className="h-4 w-4 text-slate-500" />
                <span>Edit order</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: OVERVIEW ── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {(
        <div className="space-y-5">
          {/* 4 Summary Metric Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Metric 1: Arrive by */}
            <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-slate-500">
                <Clock className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-500">Arrive by</div>
                <div className="text-base sm:text-lg font-extrabold text-slate-900 tabular-nums">
                  {order.arriveBy}
                </div>
              </div>
            </div>

            {/* Metric 2: Pour time */}
            <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-light border border-brand/20 flex items-center justify-center shrink-0 text-brand">
                <Clock className="h-5 w-5 text-brand" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-500">Pour time</div>
                <div className="text-base sm:text-lg font-extrabold text-slate-900 tabular-nums">
                  {order.pourTime}
                </div>
              </div>
            </div>

            {/* Metric 3: Estimated on-site end */}
            <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 text-slate-500">
                <Clock className="h-5 w-5 text-slate-600" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-500">Estimated on-site end</div>
                <div className="text-base sm:text-lg font-extrabold text-slate-900 tabular-nums">
                  {order.estimatedEnd}
                </div>
              </div>
            </div>

            {/* Metric 4: Planned volume */}
            <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-brand-light border border-brand/20 flex items-center justify-center shrink-0 text-brand">
                <Box className="h-5 w-5 text-brand" />
              </div>
              <div>
                <div className="text-[11px] font-medium text-slate-500">Planned volume</div>
                <div className="text-base sm:text-lg font-extrabold text-slate-900 tabular-nums">
                  {order.volumeYards} yd³
                </div>
              </div>
            </div>
          </div>

          {/* 2-Column Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left Column: Job details */}
            <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-4">
              <h2 className="text-sm font-bold text-slate-900">Job details</h2>

              <div className="divide-y divide-slate-100 text-xs">
                {/* Customer */}
                <div className="py-2.5 flex items-center justify-between gap-4">
                  <span className="text-slate-500 font-medium w-36 shrink-0">Customer</span>
                  <Link
                    href={`/customers/${order.customerId}`}
                    className="font-bold text-brand hover:underline inline-flex items-center gap-1 text-right"
                  >
                    <span>{order.customer}</span>
                    <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>

                {/* Job site */}
                <div className="py-2.5 flex items-start justify-between gap-4">
                  <span className="text-slate-500 font-medium w-36 shrink-0 pt-0.5">Job site</span>
                  <div className="text-right">
                    <div className="font-semibold text-slate-900">{order.jobSiteAddress}</div>
                    <div className="text-slate-500 text-[11px]">{order.jobSiteCityZip}</div>
                    <a
                      href={order.directionsUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-brand hover:underline font-semibold text-[11px] inline-flex items-center gap-0.5 mt-0.5"
                    >
                      <span>Directions</span>
                      <ArrowUpRight className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                {/* Customer contact */}
                <div className="py-2.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
                  <span className="text-slate-500 font-medium shrink-0">Customer contact</span>
                  <div className="flex items-center justify-between sm:justify-end gap-3 min-w-0">
                    <div className="text-left sm:text-right min-w-0">
                      <div className="font-semibold text-slate-900 whitespace-nowrap">{order.customerContact}</div>
                      {order.customerPhone && (
                        <div className="flex items-center gap-1 text-slate-500 text-[11px] font-mono whitespace-nowrap sm:justify-end">
                          <span>{order.customerPhone}</span>
                          <CopyButton value={order.customerPhone} label="Phone" />
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      {order.customerPhone && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCall(order.customerContact, order.customerPhone)}
                          className="h-7 px-2.5 text-xs font-semibold text-slate-700 hover:bg-brand-light hover:text-brand hover:border-brand/30 gap-1 rounded-lg border-slate-200 cursor-pointer shadow-2xs transition-colors shrink-0"
                        >
                          <Phone className="h-3 w-3 text-brand" />
                          <span>Call</span>
                        </Button>
                      )}
                      {order.customerPhone && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleText(order.customerContact, order.customerPhone)}
                          className="h-7 px-2.5 text-xs font-semibold text-slate-700 hover:bg-brand-light hover:text-brand hover:border-brand/30 gap-1 rounded-lg border-slate-200 cursor-pointer shadow-2xs transition-colors shrink-0"
                        >
                          <MessageSquare className="h-3 w-3 text-brand" />
                          <span>Text</span>
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Job name */}
                {order.jobName && (
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium w-36 shrink-0">Job name</span>
                    <span className="font-semibold text-slate-900 text-right">{order.jobName}</span>
                  </div>
                )}

                {/* Pour type */}
                <div className="py-2.5 flex items-center justify-between gap-4">
                  <span className="text-slate-500 font-medium w-36 shrink-0">Pour type</span>
                  <span className="font-semibold text-slate-900 text-right">{order.pourType}</span>
                </div>

                {/* Pump requested */}
                <div className="py-2.5 flex items-center justify-between gap-4">
                  <span className="text-slate-500 font-medium w-36 shrink-0">Pump requested</span>
                  <span className="font-semibold text-slate-900 text-right">{order.pumpRequested}</span>
                </div>

                {/* Concrete supplier */}
                {order.supplierName && (
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium w-36 shrink-0">Concrete supplier</span>
                    <span className="font-semibold text-slate-900 text-right">{order.supplierName}</span>
                  </div>
                )}

                {/* Lines on site */}
                <div className="py-2.5 flex items-center justify-between gap-4">
                  <span className="text-slate-500 font-medium w-36 shrink-0">Lines on site</span>
                  <span className="font-semibold text-slate-900 text-right">{order.linesOnSite ? 'Yes' : 'No'}</span>
                </div>

                {/* Maximum pump size */}
                {order.maxPumpSize && (
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium w-36 shrink-0">Maximum pump size</span>
                    <span className="font-semibold text-slate-900 text-right">{order.maxPumpSize}</span>
                  </div>
                )}

                {/* Purchase order */}
                <div className="py-2.5 flex items-center justify-between gap-4">
                  <span className="text-slate-500 font-medium w-36 shrink-0">Purchase order</span>
                  <span className="font-semibold text-slate-900 text-right">{order.purchaseOrder}</span>
                </div>
              </div>

              {/* Extra equipment and supplies */}
              {order.extraItems.length > 0 && (
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1.5">
                  <div className="text-[11px] font-bold text-slate-800">Extra equipment &amp; supplies</div>
                  <ul className="text-xs text-slate-600 font-medium space-y-0.5">
                    {order.extraItems.map((item, index) => (
                      <li key={index} className="flex items-center justify-between gap-3">
                        <span>{item.name}</span>
                        <span className="tabular-nums text-slate-500">× {item.quantity}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Customer-visible details and internal note */}
              {order.customerNotes && (
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                  <div className="text-[11px] font-bold text-slate-800">Customer-visible details</div>
                  <p className="text-xs text-slate-600 font-medium leading-relaxed">{order.customerNotes}</p>
                </div>
              )}
              {order.internalNote && (
                <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200/70 space-y-1">
                  <div className="text-[11px] font-bold text-amber-900">Internal note (team only)</div>
                  <p className="text-xs text-amber-950/80 font-medium leading-relaxed">{order.internalNote}</p>
                </div>
              )}

              {/* Site instructions box */}
              <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-1">
                <div className="text-[11px] font-bold text-slate-800">Site instructions</div>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">
                  {order.siteInstructions}
                </p>
              </div>
            </div>

            {/* Right Column: Pump & Operator + Work ticket & billing */}
            <div className="space-y-5">
              {/* Pump & operator */}
              <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-slate-900">Pump & operator</h2>

                <div className="space-y-3 text-xs">
                  {/* Assigned pump */}
                  <div className="py-2 px-0.5 flex items-center justify-between gap-4 border-b border-slate-100 pb-3">
                    <span className="text-slate-500 font-medium shrink-0">Assigned pump</span>
                    <div className="flex items-center gap-2 text-right">
                      <Truck className="h-4 w-4 text-slate-400 shrink-0" />
                      <div className="whitespace-nowrap">
                        <span className="font-bold text-slate-900">{order.assignedPumpCode}</span>
                        <span className="text-slate-500 text-[11px] ml-1.5 font-normal">
                          {order.assignedPumpType}
                        </span>
                      </div>
                    </div>
                  </div>

                  {order.secondOperatorName && (
                    <div className="py-2.5 flex items-center justify-between gap-4 text-xs border-b border-slate-100">
                      <span className="text-slate-500 font-medium w-36 shrink-0">Additional operator</span>
                      <span className="font-semibold text-slate-900 text-right">{order.secondOperatorName}</span>
                    </div>
                  )}

                  {/* Operator Highlight Box */}
                  <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-10 w-10 rounded-full bg-white border border-slate-200 flex items-center justify-center shrink-0 shadow-2xs text-brand font-bold text-xs">
                        <User className="h-5 w-5 text-brand" />
                      </div>
                      <div className="min-w-0">
                        <div className="text-[11px] font-bold text-slate-400">Assigned operator</div>
                        <div className="font-bold text-slate-900 text-sm whitespace-nowrap truncate">{order.assignedOperator}</div>
                        {order.operatorPhone ? (
                          <div className="flex items-center gap-1 text-slate-500 text-xs font-mono whitespace-nowrap">
                            <span>{order.operatorPhone}</span>
                            <CopyButton value={order.operatorPhone} label="Phone" />
                          </div>
                        ) : (
                          <div className="text-amber-600 text-xs font-medium">No phone listed</div>
                        )}
                      </div>
                    </div>

                    {order.operatorPhone && (
                      <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleCall(order.assignedOperator, order.operatorPhone)}
                          className="h-8 px-3 text-xs font-semibold text-slate-700 hover:bg-brand-light hover:text-brand hover:border-brand/30 gap-1.5 rounded-lg border-slate-200 cursor-pointer shadow-2xs transition-colors shrink-0"
                        >
                          <Phone className="h-3.5 w-3.5 text-brand" />
                          <span>Call</span>
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleText(order.assignedOperator, order.operatorPhone)}
                          className="h-8 px-3 text-xs font-semibold text-slate-700 hover:bg-brand-light hover:text-brand hover:border-brand/30 gap-1.5 rounded-lg border-slate-200 cursor-pointer shadow-2xs transition-colors shrink-0"
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-brand" />
                          <span>Text</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Billing */}
              <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-slate-900">Billing</h2>

                <div className="divide-y divide-slate-100 text-xs">
                  {/* Billing service */}
                  {order.billingService && (
                    <div className="py-2.5 flex items-center justify-between gap-4">
                      <span className="text-slate-500 font-medium w-36 shrink-0">Billing service</span>
                      <span className="font-semibold text-slate-900 text-right">{order.billingService}</span>
                    </div>
                  )}

                  {/* Collect on delivery */}
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium w-36 shrink-0">Collect on delivery</span>
                    <span className="font-semibold text-slate-900 text-right">
                      {order.collectOnDelivery ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Dialog: Cancel order ── */}
      <Dialog open={isCancelOpen} onOpenChange={setIsCancelOpen}>
        <DialogContent className="sm:max-w-[430px] p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 tracking-tight">
              Cancel {order.id}?
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-slate-600">
            The order for {order.customer} stays on file as cancelled. Its pump and operator are freed up.
          </p>
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Reason <span className="text-slate-400 font-normal">(optional)</span>
            </label>
            <Input
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Customer postponed the pour"
              className="h-10 text-sm text-slate-900 border-slate-200"
            />
          </div>
          <div className="pt-1 flex items-center justify-end gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsCancelOpen(false)}
              className="h-9 px-4 text-xs font-semibold cursor-pointer"
            >
              Keep order
            </Button>
            <Button
              type="button"
              disabled={isSaving}
              onClick={handleCancelOrder}
              className="h-9 px-4 text-xs font-semibold bg-red-600 hover:bg-red-700 text-white cursor-pointer"
            >
              {isSaving ? 'Cancelling...' : 'Cancel order'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
