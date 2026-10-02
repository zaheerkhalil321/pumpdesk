'use client';

import { useState } from 'react';
import Link from 'next/link';
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
  FileText,
  Plus,
  Calendar as CalendarIcon,
  X,
  Save,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { AppSelect } from '@/components/ui/app-select';
import { format, parse } from 'date-fns';
import { toast } from 'sonner';
import { cn, formatUSPhone } from '@/lib/utils';
import { getFullOrderDetail } from '@/lib/orders-store';

interface OrderDetailViewProps {
  orderId: string;
}

interface OrderData {
  id: string;
  customer: string;
  customerPhone: string;
  customerContact: string;
  jobName: string;
  status: 'Pending' | 'Confirmed' | 'Turned In' | 'Completed' | 'Cancelled';
  pourType: string;
  locationCity: string;
  serviceDate: string;
  arriveBy: string;
  pourTime: string;
  estimatedEnd: string;
  volumeYards: number;
  jobSiteAddress: string;
  jobSiteCityZip: string;
  directionsUrl: string;
  pumpRequested: string;
  purchaseOrder: string;
  siteInstructions: string;
  assignedPumpCode: string;
  assignedPumpType: string;
  assignedOperator: string;
  operatorPhone: string;
  workTicketNumber: string;
  workTicketStatus: string;
  invoiceStatus: string;
  collectOnDelivery: boolean;
  notifyOperator: boolean;
  adjustedYards: number;
  adjustedTravel: number;
  adjustedPrep: number;
  adjustedPour: number;
  adjustedCleanup: number;
}

const DEFAULT_ORDERS: Record<string, OrderData> = {
  'ORD-1518': {
    id: 'ORD-1518',
    customer: 'Turner Construction',
    customerContact: 'Mike Vance',
    customerPhone: '(207) 555-0142',
    jobName: 'Foundation',
    status: 'Completed',
    pourType: 'Foundation',
    locationCity: 'Camden',
    serviceDate: 'Sep 12, 2026',
    arriveBy: '7:00 AM',
    pourTime: '7:30 AM',
    estimatedEnd: '11:00 AM',
    volumeYards: 80,
    jobSiteAddress: '24 Bay View Street',
    jobSiteCityZip: 'Camden, ME 04843',
    directionsUrl: 'https://maps.google.com/?q=24+Bay+View+Street+Camden+ME',
    pumpRequested: '34M boom pump',
    purchaseOrder: 'PO-2048',
    siteInstructions: 'Use the north gate. Washout area beside the gravel pad.',
    assignedPumpCode: '01 · 34M',
    assignedPumpType: 'Boom pump',
    assignedOperator: 'Rob Black',
    operatorPhone: '(207) 555-0168',
    workTicketNumber: 'TKT-4019',
    workTicketStatus: 'Not submitted',
    invoiceStatus: 'Not created',
    collectOnDelivery: false,
    notifyOperator: true,
    adjustedYards: 85,
    adjustedTravel: 1.25,
    adjustedPrep: 0.5,
    adjustedPour: 3.0,
    adjustedCleanup: 0.5,
  },
  'ORD-1525': {
    id: 'ORD-1525',
    customer: 'Coastal Foundations',
    customerContact: 'Dave Miller',
    customerPhone: '(207) 555-0199',
    jobName: 'Foundation Slab',
    status: 'Pending',
    pourType: 'Foundation',
    locationCity: 'Rockland',
    serviceDate: 'Sep 18, 2026',
    arriveBy: '7:30 AM',
    pourTime: '8:00 AM',
    estimatedEnd: '12:00 PM',
    volumeYards: 95,
    jobSiteAddress: '18 Main Street',
    jobSiteCityZip: 'Rockland, ME 04841',
    directionsUrl: 'https://maps.google.com/?q=18+Main+Street+Rockland+ME',
    pumpRequested: '34M boom pump',
    purchaseOrder: 'PO-2055',
    siteInstructions: 'Check overhead wires near front curb before unfolding.',
    assignedPumpCode: 'Unassigned',
    assignedPumpType: 'Operator needed',
    assignedOperator: 'Unassigned',
    operatorPhone: '',
    workTicketNumber: 'TKT-4022',
    workTicketStatus: 'Not submitted',
    invoiceStatus: 'Not created',
    collectOnDelivery: false,
    notifyOperator: true,
    adjustedYards: 95,
    adjustedTravel: 1.0,
    adjustedPrep: 0.5,
    adjustedPour: 3.5,
    adjustedCleanup: 0.5,
  },
};

const STANDARD_TIMES = [
  '5:00 AM', '5:30 AM', '6:00 AM', '6:30 AM', '7:00 AM', '7:30 AM',
  '8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM',
  '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM',
  '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM', '4:00 PM', '4:30 PM',
  '5:00 PM', '5:30 PM', '6:00 PM',
];

export function OrderDetailView({ orderId }: OrderDetailViewProps) {
  const [order, setOrder] = useState<OrderData>(() => {
    const stored = getFullOrderDetail(orderId);
    const base = DEFAULT_ORDERS[orderId] || {
      ...DEFAULT_ORDERS['ORD-1518'],
      id: orderId,
    };
    return {
      ...base,
      ...(stored || {}),
    } as OrderData;
  });
  const [activeTab, setActiveTab] = useState<'overview' | 'work_ticket'>('overview');
  const [isEditingOrder, setIsEditingOrder] = useState(false);
  const [isAdjustmentsModalOpen, setIsAdjustmentsModalOpen] = useState(false);
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);

  // Contacts list
  const [availableContacts, setAvailableContacts] = useState([
    { name: 'Mike Vance', phone: '(207) 555-0142', role: 'Superintendent' },
    { name: 'Dave Miller', phone: '(207) 555-0199', role: 'Project Manager' },
    { name: 'Rob Black', phone: '(207) 555-0168', role: 'Foreman' },
  ]);

  // New Contact Dialog form state
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactRole, setNewContactRole] = useState('Superintendent');

  // ── Edit Order Screen Form State ──
  const [editCustomer, setEditCustomer] = useState(order.customer);
  const [editJobSite, setEditJobSite] = useState(order.jobSiteAddress + ', ' + order.jobSiteCityZip);
  const [editContact, setEditContact] = useState(order.customerContact);
  const [editPhone, setEditPhone] = useState(order.customerPhone);
  const [editPO, setEditPO] = useState(order.purchaseOrder);
  const [editJobName, setEditJobName] = useState(order.jobName);
  const [editPourType, setEditPourType] = useState(order.pourType);
  const [editVolume, setEditVolume] = useState<number | string>(order.volumeYards);
  const [editPumpRequested, setEditPumpRequested] = useState(order.pumpRequested);
  const [editInstructions, setEditInstructions] = useState(order.siteInstructions);
  const [editDate, setEditDate] = useState(order.serviceDate);
  const [editArriveBy, setEditArriveBy] = useState(order.arriveBy);
  const [editPourTime, setEditPourTime] = useState(order.pourTime);
  const [editEstimatedEnd, setEditEstimatedEnd] = useState(order.estimatedEnd);
  const [editPump, setEditPump] = useState(order.assignedPumpCode);
  const [editOperator, setEditOperator] = useState(order.assignedOperator);
  const [editStatus, setEditStatus] = useState(order.status);
  const [editNotify, setEditNotify] = useState(order.notifyOperator);

  // Validation errors map
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Date picker popover state
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);

  // Helper to parse date for Calendar
  const getParsedDate = (dateStr: string): Date => {
    try {
      const parsed = parse(dateStr, 'MMM d, yyyy', new Date());
      return isNaN(parsed.getTime()) ? new Date(2026, 8, 12) : parsed;
    } catch {
      return new Date(2026, 8, 12);
    }
  };

  // ── Edit Billing Adjustments Modal Form State ──
  const [modalYards, setModalYards] = useState(order.adjustedYards);
  const [modalTravel, setModalTravel] = useState(order.adjustedTravel);
  const [modalPrep, setModalPrep] = useState(order.adjustedPrep);
  const [modalPour, setModalPour] = useState(order.adjustedPour);
  const [modalCleanup, setModalCleanup] = useState(order.adjustedCleanup);
  const [modalReason, setModalReason] = useState('');

  const modalTotalOnSite = (
    Number(modalPrep || 0) +
    Number(modalPour || 0) +
    Number(modalCleanup || 0)
  ).toFixed(1);

  // Validate form fields
  const validateForm = () => {
    const errs: Record<string, string> = {};

    if (!editCustomer.trim()) {
      errs.customer = 'Customer is required';
    }
    if (!editJobSite.trim()) {
      errs.jobSite = 'Job site address is required';
    }
    if (!editContact.trim()) {
      errs.contact = 'Customer contact is required';
    }
    if (!editDate.trim()) {
      errs.date = 'Service date is required';
    }
    if (!editPourTime.trim()) {
      errs.pourTime = 'Pour time is required';
    }
    if (!editArriveBy.trim()) {
      errs.arriveBy = 'Arrive by time is required';
    }
    if (!editVolume || Number(editVolume) <= 0) {
      errs.volume = 'Planned volume must be greater than 0';
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

    const formattedPhone = formatUSPhone(editPhone) || editPhone;
    setOrder((prev) => ({
      ...prev,
      customer: editCustomer,
      customerContact: editContact,
      customerPhone: formattedPhone,
      purchaseOrder: editPO,
      jobName: editJobName,
      pourType: editPourType,
      volumeYards: Number(editVolume),
      pumpRequested: editPumpRequested,
      siteInstructions: editInstructions,
      serviceDate: editDate,
      arriveBy: editArriveBy,
      pourTime: editPourTime,
      estimatedEnd: editEstimatedEnd,
      assignedPumpCode: editPump,
      assignedOperator: editOperator,
      status: editStatus,
      notifyOperator: editNotify,
    }));
    setIsEditingOrder(false);
    toast.success('Order changes saved', {
      description: `${order.id} updated successfully.`,
    });
  };

  // Save new contact from Modal
  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) {
      toast.error('Name and phone are required');
      return;
    }

    const formattedContactPhone = formatUSPhone(newContactPhone) || newContactPhone.trim();
    const newContact = {
      name: newContactName.trim(),
      phone: formattedContactPhone,
      role: newContactRole,
    };

    setAvailableContacts((prev) => [newContact, ...prev]);
    setEditContact(newContact.name);
    setEditPhone(formattedContactPhone);
    setIsAddContactModalOpen(false);
    setNewContactName('');
    setNewContactPhone('');
    toast.success('Contact added and selected', {
      description: `${newContact.name} (${formattedContactPhone})`,
    });
  };

  // Save billing adjustments from Modal
  const handleSaveAdjustments = (e: React.FormEvent) => {
    e.preventDefault();
    setOrder((prev) => ({
      ...prev,
      adjustedYards: Number(modalYards),
      adjustedTravel: Number(modalTravel),
      adjustedPrep: Number(modalPrep),
      adjustedPour: Number(modalPour),
      adjustedCleanup: Number(modalCleanup),
    }));
    setIsAdjustmentsModalOpen(false);
    toast.success('Billing adjustments saved', {
      description: `Adjustments updated for ${order.id}.`,
    });
  };

  const handleCall = (name: string, phone: string) => {
    toast.info(`Calling ${name}`, { description: phone });
  };

  const handleText = (name: string, phone: string) => {
    toast.info(`Opening SMS with ${name}`, { description: phone });
  };

  // ═════════════════════════════════════════════════════════════════════════
  // ── VIEW 1: FULL "EDIT ORDER" SCREEN (Matching Screenshot 1 exactly) ──
  // ═════════════════════════════════════════════════════════════════════════
  if (isEditingOrder) {
    return (
      <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
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
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
                Edit order · {order.id}
              </h1>
              <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
                {order.customer} · {order.pourType}
              </p>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-center">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setIsEditingOrder(false)}
                className="h-9 px-3.5 rounded-lg border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 gap-1.5 shadow-2xs cursor-pointer"
              >
                <X className="h-3.5 w-3.5 text-slate-500" />
                <span>Cancel</span>
              </Button>

              <Button
                type="submit"
                size="sm"
                className="h-9 px-4 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold shadow-xs gap-1.5 cursor-pointer active:scale-98"
              >
                <Save className="h-3.5 w-3.5" />
                <span>Save changes</span>
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
                        setEditCustomer(val);
                        if (errors.customer) setErrors((prev) => ({ ...prev, customer: '' }));
                      }}
                      options={[
                        "Turner Construction",
                        "Coastal Foundations",
                        "Pine Tree Concrete",
                        "Harbor Builders",
                        "Granite State Builders",
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
                    <AppSelect
                      value={editJobSite}
                      onChange={(val) => {
                        setEditJobSite(val);
                        if (errors.jobSite) setErrors((prev) => ({ ...prev, jobSite: '' }));
                      }}
                      options={[
                        "24 Bay View Street, Camden, ME 04843",
                        "18 Main Street, Rockland, ME 04841",
                        "42 Union Street, Camden, ME 04843",
                      ]}
                      error={Boolean(errors.jobSite)}
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
                        setEditContact(val);
                        const matched = availableContacts.find((c) => c.name === val);
                        if (matched) setEditPhone(matched.phone);
                        if (errors.contact) setErrors((prev) => ({ ...prev, contact: '' }));
                      }}
                      options={availableContacts.map((c) => ({
                        value: c.name,
                        label: c.name,
                        description: c.role,
                      }))}
                      error={Boolean(errors.contact)}
                    />
                    {errors.contact && (
                      <p className="text-[11px] text-red-500 font-medium">{errors.contact}</p>
                    )}
                  </div>

                  {/* Phone */}
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">Phone</label>
                    <Input
                      type="tel"
                      value={editPhone}
                      onChange={(e) => setEditPhone(formatUSPhone(e.target.value))}
                      placeholder="(207) 555-0188"
                      maxLength={14}
                      className="h-9 text-xs font-medium text-slate-900 border-slate-200 focus-visible:border-brand"
                    />
                  </div>

                  {/* Add another contact link (Opens In-Place Modal to avoid losing edits) */}
                  <div>
                    <button
                      type="button"
                      onClick={() => setIsAddContactModalOpen(true)}
                      className="text-brand hover:underline font-semibold text-xs inline-flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add another contact</span>
                    </button>
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

                  {/* Pour type Dropdown */}
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">Pour type</label>
                    <AppSelect
                      value={editPourType}
                      onChange={setEditPourType}
                      options={[
                        "Foundation",
                        "Slab on Grade",
                        "Walls / Columns",
                        "Commercial Deck",
                      ]}
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
                      options={[
                        "34M boom pump",
                        "28M boom pump",
                        "47M boom pump",
                        "Trailer Line pump",
                      ]}
                    />
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
                    <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
                      <PopoverTrigger className="w-full h-9 px-3 bg-white rounded-lg border border-slate-200 flex items-center justify-between shadow-2xs hover:border-brand/40 cursor-pointer text-left outline-none group transition-colors">
                        <span className="font-semibold text-slate-900 text-xs">{editDate}</span>
                        <CalendarIcon className="h-4 w-4 text-slate-400 group-hover:text-brand transition-colors" />
                      </PopoverTrigger>
                      <PopoverContent align="start" className="p-0 border border-slate-200 shadow-xl rounded-2xl overflow-hidden">
                        <Calendar
                          selected={getParsedDate(editDate)}
                          onSelect={(newDate) => {
                            setEditDate(format(newDate, 'MMM d, yyyy'));
                            setIsCalendarOpen(false);
                            if (errors.date) setErrors((prev) => ({ ...prev, date: '' }));
                          }}
                        />
                      </PopoverContent>
                    </Popover>
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
                          if (errors.arriveBy) setErrors((prev) => ({ ...prev, arriveBy: '' }));
                        }}
                        icon={Clock}
                        options={STANDARD_TIMES}
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
                          if (errors.pourTime) setErrors((prev) => ({ ...prev, pourTime: '' }));
                        }}
                        icon={Clock}
                        options={STANDARD_TIMES}
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
                      options={STANDARD_TIMES}
                    />
                  </div>

                  {/* Assigned pump Dropdown */}
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">Assigned pump</label>
                    <AppSelect
                      value={editPump}
                      onChange={setEditPump}
                      options={[
                        "01 · 34M",
                        "02 · 28M",
                        "03 · 47M",
                        "04 · Line pump",
                        "Unassigned",
                      ]}
                    />
                  </div>

                  {/* Operator Dropdown */}
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">Operator</label>
                    <AppSelect
                      value={editOperator}
                      onChange={setEditOperator}
                      options={[
                        "Rob Black",
                        "Dave Smith",
                        "Tony Perez",
                        "Unassigned",
                      ]}
                    />
                  </div>

                  {/* Booking status Dropdown */}
                  <div className="space-y-1">
                    <label className="text-slate-600 font-medium">Booking status</label>
                    <AppSelect
                      value={editStatus}
                      onChange={(val) => setEditStatus(val as OrderData['status'])}
                      options={[
                        { value: "Confirmed", label: "Confirmed" },
                        { value: "Pending", label: "Pending" },
                        { value: "Turned In", label: "Turned In" },
                        { value: "Completed", label: "Completed" },
                        { value: "Cancelled", label: "Cancelled" },
                      ]}
                    />
                  </div>
                </div>
              </div>

              {/* Card 4: Update notification */}
              <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-2">
                <h2 className="text-sm font-bold text-slate-900">Update notification</h2>

                <label className="flex items-start gap-2.5 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={editNotify}
                    onChange={(e) => setEditNotify(e.target.checked)}
                    className="h-4 w-4 mt-0.5 rounded border-slate-300 text-brand focus:outline-none cursor-pointer accent-brand"
                  />
                  <div>
                    <div className="text-xs font-semibold text-slate-900">
                      Notify operator of these changes
                    </div>
                    <div className="text-[11px] text-slate-500">
                      A summary is prepared before sending.
                    </div>
                  </div>
                </label>
              </div>

              {/* Bottom Info Callout */}
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center gap-2 text-xs text-slate-500">
                <Info className="h-4 w-4 text-slate-400 shrink-0" />
                <span>Work ticket entries and billing charges are edited in their own tabs.</span>
              </div>
            </div>
          </div>
        </form>

        {/* ── Dialog: Add Another Contact (In-Place so edits are NOT lost) ── */}
        <Dialog open={isAddContactModalOpen} onOpenChange={setIsAddContactModalOpen}>
          <DialogContent className="sm:max-w-[430px] p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-4">
            <DialogHeader>
              <DialogTitle className="text-base font-bold text-slate-900 tracking-tight">
                Add contact for {editCustomer}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleCreateContact} className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Full name</label>
                <Input
                  value={newContactName}
                  onChange={(e) => setNewContactName(e.target.value)}
                  placeholder="e.g. Jim Morrison"
                  className="h-10 text-xs sm:text-sm font-medium text-slate-900 border-slate-200 bg-white placeholder:text-slate-400 focus-visible:border-brand focus:border-brand outline-none rounded-lg shadow-2xs transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Phone number</label>
                <Input
                  type="tel"
                  value={newContactPhone}
                  onChange={(e) => setNewContactPhone(formatUSPhone(e.target.value))}
                  placeholder="(207) 555-0188"
                  maxLength={14}
                  className="h-10 text-xs sm:text-sm font-medium text-slate-900 border-slate-200 bg-white placeholder:text-slate-400 focus-visible:border-brand focus:border-brand outline-none rounded-lg shadow-2xs transition-colors"
                  required
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Role / Title</label>
                <AppSelect
                  size="lg"
                  value={newContactRole}
                  onChange={setNewContactRole}
                  options={[
                    "Superintendent",
                    "Project Manager",
                    "Foreman",
                    "Dispatcher",
                  ]}
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2.5">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsAddContactModalOpen(false)}
                  className="h-9 px-4 text-xs font-semibold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg cursor-pointer shadow-2xs transition-colors focus-visible:outline-none"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="h-9 px-4.5 text-xs font-semibold bg-brand hover:bg-brand-hover text-white rounded-lg cursor-pointer shadow-xs transition-colors focus-visible:outline-none"
                >
                  Add contact
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ═════════════════════════════════════════════════════════════════════════
  // ── VIEW 2: NORMAL ORDER DOSSIER (Overview & Work Ticket) ──
  // ═════════════════════════════════════════════════════════════════════════
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5">
      {/* ── 1. Top Link ── */}
      <div className="flex items-center justify-between text-xs">
        <Link
          href="/schedule"
          className="text-brand hover:underline font-semibold inline-flex items-center gap-1 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>View on schedule</span>
        </Link>

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
                order.status === 'Confirmed' &&
                  'bg-brand-light text-brand border border-brand/25',
                order.status === 'Completed' &&
                  'bg-brand-light text-brand border border-brand/25',
                order.status === 'Pending' &&
                  'bg-amber-50 text-amber-800 border-amber-200/80',
                order.status === 'Cancelled' &&
                  'bg-slate-50 text-slate-500 border-slate-200'
              )}
            >
              <span
                className={cn(
                  'h-1.5 w-1.5 rounded-full shrink-0',
                  (order.status === 'Confirmed' || order.status === 'Completed') &&
                    'bg-brand',
                  order.status === 'Pending' && 'bg-amber-600',
                  order.status === 'Cancelled' && 'bg-slate-400'
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
        <div className="flex items-center gap-2.5 self-start sm:self-center">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditingOrder(true)}
            className="h-9 px-3.5 rounded-lg border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 gap-1.5 shadow-2xs cursor-pointer transition-all active:scale-98"
          >
            <Pencil className="h-3.5 w-3.5 text-slate-500" />
            <span>Edit order</span>
          </Button>
        </div>
      </div>

      {/* ── 3. Tabs: Overview / Work Ticket ── */}
      <div className="flex items-center gap-6 border-b border-slate-200 text-xs font-semibold">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={cn(
            'pb-3 pt-1 transition-colors relative cursor-pointer',
            activeTab === 'overview'
              ? 'text-brand font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          )}
        >
          <span>Overview</span>
          {activeTab === 'overview' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
          )}
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('work_ticket')}
          className={cn(
            'pb-3 pt-1 transition-colors relative cursor-pointer',
            activeTab === 'work_ticket'
              ? 'text-brand font-bold'
              : 'text-slate-500 hover:text-slate-900 font-medium'
          )}
        >
          <span>Work Ticket</span>
          {activeTab === 'work_ticket' && (
            <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand rounded-full" />
          )}
        </button>
      </div>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 1: WORK TICKET (With Edit Adjustments Modal Connection) ── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'work_ticket' && (
        <div className="space-y-5">
          {/* Top Banner: Work Ticket Info */}
          <div className="p-4 rounded-xl border border-slate-200/90 bg-white shadow-2xs flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-brand-light border border-brand/20 flex items-center justify-center shrink-0 text-brand">
                <FileText className="h-5 w-5" />
              </div>
              <div>
                <div className="font-bold text-slate-900 text-sm">
                  Work ticket #{order.workTicketNumber}
                </div>
                <div className="text-xs text-slate-500 font-medium mt-0.5">
                  Operator: {order.assignedOperator} · Pump: {order.assignedPumpCode.replace(' · ', ' / ')}
                </div>
              </div>
            </div>
          </div>

          {/* Card 1: Quantities & time */}
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900">Quantities & time</h2>
              <button
                type="button"
                onClick={() => setIsAdjustmentsModalOpen(true)}
                className="text-xs font-semibold text-brand hover:underline cursor-pointer inline-flex items-center gap-1"
              >
                <Pencil className="h-3 w-3" />
                <span>Edit adjustments</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-semibold select-none">
                    <th className="py-3 px-4 w-1/4">Metric</th>
                    <th className="py-3 px-4 w-1/4">Planned</th>
                    <th className="py-3 px-4 w-1/4">Reported by operator</th>
                    <th className="py-3 px-4 w-1/4">Adjusted for billing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Row 1: Cubic yards */}
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      Cubic yards
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700 tabular-nums">
                      {order.volumeYards} yd³
                    </td>
                    <td className="py-3.5 px-4 font-medium text-slate-700 tabular-nums">
                      85 yd³
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900 tabular-nums">
                      {order.adjustedYards} yd³
                    </td>
                  </tr>

                  {/* Row 2: Travel */}
                  <tr>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">Travel</div>
                      <a
                        href={order.directionsUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="text-brand hover:underline font-semibold text-[11px] inline-flex items-center gap-0.5 mt-0.5"
                      >
                        <span>View route</span>
                        <ArrowUpRight className="h-3 w-3" />
                      </a>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-700">1.0 hr</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Out: 6:30 – 7:00 AM<br />
                        Return: 11:00 – 11:30 AM
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-700">1.25 hr</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Out: 6:15 – 7:00 AM<br />
                        Return: 11:00 – 11:30 AM
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{order.adjustedTravel} hr</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        No billing adjustment
                      </div>
                    </td>
                  </tr>

                  {/* Row 3: On-site total */}
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      On-site total
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-700">4.0 hr</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">7:00 – 11:00 AM</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-700">4.0 hr</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">7:00 – 11:00 AM</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">4.0 hr</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">7:00 – 11:00 AM</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Card 2: On-site breakdown */}
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100">
              <h2 className="text-sm font-bold text-slate-900">On-site breakdown</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-semibold select-none">
                    <th className="py-3 px-4 w-1/4">Metric</th>
                    <th className="py-3 px-4 w-1/4">Planned</th>
                    <th className="py-3 px-4 w-1/4">Reported by operator</th>
                    <th className="py-3 px-4 w-1/4">Adjusted for billing</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Prep */}
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      Prep
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-700">0.5 hr</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">7:00 – 7:30 AM</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-700">0.5 hr</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">7:00 – 7:30 AM</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{order.adjustedPrep} hr</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">7:00 – 7:30 AM</div>
                    </td>
                  </tr>

                  {/* Pour */}
                  <tr>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">Pour</div>
                      <div className="text-[11px] text-slate-500 font-medium">Foundation</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-700">3.0 hr</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">7:30 – 10:30 AM</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-700">3.0 hr</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">7:30 – 10:30 AM</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{order.adjustedPour} hr</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">7:30 – 10:30 AM</div>
                    </td>
                  </tr>

                  {/* Cleanup */}
                  <tr>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      Cleanup
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-700">0.5 hr</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">10:30 – 11:00 AM</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-700">0.5 hr</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">10:30 – 11:00 AM</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{order.adjustedCleanup} hr</div>
                      <div className="text-[11px] text-slate-400 mt-0.5">10:30 – 11:00 AM</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Table Footer Helper Text */}
            <div className="p-3.5 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
              <span className="text-[11px] text-slate-400 font-medium">
                Billing adjustments preserve original operator entries and recorded times.
              </span>
              <span className="text-xs text-slate-500 font-medium self-end sm:self-center">
                No adjustments made.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── TAB 2: OVERVIEW ── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeTab === 'overview' && (
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
                    href="/customers"
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
                <div className="py-2.5 flex items-center justify-between gap-4">
                  <span className="text-slate-500 font-medium w-36 shrink-0">Customer contact</span>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <div className="font-semibold text-slate-900">{order.customerContact}</div>
                      <div className="text-slate-500 text-[11px]">{order.customerPhone}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleCall(order.customerContact, order.customerPhone)}
                        className="h-7 px-2.5 text-xs font-semibold text-slate-700 hover:bg-brand-light hover:text-brand hover:border-brand/30 gap-1 rounded-lg border-slate-200 cursor-pointer shadow-2xs transition-colors"
                      >
                        <Phone className="h-3 w-3 text-brand" />
                        <span>Call</span>
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleText(order.customerContact, order.customerPhone)}
                        className="h-7 px-2.5 text-xs font-semibold text-slate-700 hover:bg-brand-light hover:text-brand hover:border-brand/30 gap-1 rounded-lg border-slate-200 cursor-pointer shadow-2xs transition-colors"
                      >
                        <MessageSquare className="h-3 w-3 text-brand" />
                        <span>Text</span>
                      </Button>
                    </div>
                  </div>
                </div>

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

                {/* Purchase order */}
                <div className="py-2.5 flex items-center justify-between gap-4">
                  <span className="text-slate-500 font-medium w-36 shrink-0">Purchase order</span>
                  <span className="font-semibold text-slate-900 text-right">{order.purchaseOrder}</span>
                </div>
              </div>

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

                <div className="divide-y divide-slate-100 text-xs">
                  {/* Assigned pump */}
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium w-32 shrink-0">Assigned pump</span>
                    <div className="flex items-center gap-2 text-right">
                      <Truck className="h-4 w-4 text-slate-400" />
                      <div>
                        <span className="font-bold text-slate-900">{order.assignedPumpCode}</span>
                        <span className="text-slate-500 text-[11px] ml-1.5 font-normal">
                          {order.assignedPumpType}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Operator */}
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium w-32 shrink-0">Operator</span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5 text-right">
                        <User className="h-4 w-4 text-slate-400" />
                        <div>
                          <div className="font-bold text-slate-900">{order.assignedOperator}</div>
                          {order.operatorPhone && (
                            <div className="text-slate-500 text-[11px] font-normal">{order.operatorPhone}</div>
                          )}
                        </div>
                      </div>

                      {order.operatorPhone && (
                        <div className="flex items-center gap-1">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleCall(order.assignedOperator, order.operatorPhone)}
                            className="h-7 px-2.5 text-xs font-semibold text-slate-700 hover:bg-brand-light hover:text-brand hover:border-brand/30 gap-1 rounded-lg border-slate-200 cursor-pointer shadow-2xs transition-colors"
                          >
                            <Phone className="h-3 w-3 text-brand" />
                            <span>Call</span>
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => handleText(order.assignedOperator, order.operatorPhone)}
                            className="h-7 px-2.5 text-xs font-semibold text-slate-700 hover:bg-brand-light hover:text-brand hover:border-brand/30 gap-1 rounded-lg border-slate-200 cursor-pointer shadow-2xs transition-colors"
                          >
                            <MessageSquare className="h-3 w-3 text-brand" />
                            <span>Text</span>
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Work ticket & billing */}
              <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-4">
                <h2 className="text-sm font-bold text-slate-900">Work ticket & billing</h2>

                <div className="divide-y divide-slate-100 text-xs">
                  {/* Work ticket */}
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium w-36 shrink-0">Work ticket</span>
                    <div className="flex items-center gap-2 text-right">
                      <span className="text-slate-500 font-medium">{order.workTicketStatus}</span>
                      <button
                        type="button"
                        onClick={() => setActiveTab('work_ticket')}
                        className="text-brand font-bold hover:underline inline-flex items-center gap-0.5 cursor-pointer ml-1"
                      >
                        <span>Open work ticket</span>
                        <ArrowUpRight className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Invoice */}
                  <div className="py-2.5 flex items-center justify-between gap-4">
                    <span className="text-slate-500 font-medium w-36 shrink-0">Invoice</span>
                    <span className="font-semibold text-slate-600 text-right">{order.invoiceStatus}</span>
                  </div>

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

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* ── MODAL: EDIT BILLING ADJUSTMENTS (Matching Screenshot 2 exactly) ── */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      <Dialog open={isAdjustmentsModalOpen} onOpenChange={setIsAdjustmentsModalOpen}>
        <DialogContent className="sm:max-w-lg p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-4">
          <DialogHeader className="space-y-0.5">
            <DialogTitle className="text-lg font-bold text-slate-900">
              Edit billing adjustments
            </DialogTitle>
            <p className="text-xs text-slate-500 font-medium">
              {order.id} · {order.customer}
            </p>
          </DialogHeader>

          {/* Theme Teal Info Callout */}
          <div className="p-3 rounded-xl bg-brand-light border border-brand/20 flex items-center gap-2.5 text-xs text-[#084B4E]">
            <Info className="h-4 w-4 text-brand shrink-0" />
            <span className="font-medium">
              Original operator entries and recorded times stay unchanged.
            </span>
          </div>

          <form onSubmit={handleSaveAdjustments} className="space-y-4">
            {/* Adjustments Table */}
            <div className="rounded-xl border border-slate-200/90 overflow-hidden text-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-600 font-bold select-none">
                    <th className="py-2.5 px-3.5 w-1/3">Metric</th>
                    <th className="py-2.5 px-3.5 w-1/3">Operator reported</th>
                    <th className="py-2.5 px-3.5 w-1/3">Billable quantity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {/* Cubic yards */}
                  <tr>
                    <td className="py-2.5 px-3.5 font-semibold text-slate-900">Cubic yards</td>
                    <td className="py-2.5 px-3.5 text-slate-600 font-medium tabular-nums">85 yd³</td>
                    <td className="py-2 px-3.5">
                      <div className="relative flex items-center">
                        <Input
                          type="number"
                          value={modalYards}
                          onChange={(e) => setModalYards(Number(e.target.value))}
                          className="h-8 pr-9 text-xs font-semibold"
                        />
                        <span className="absolute right-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                          yd³
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Travel */}
                  <tr>
                    <td className="py-2.5 px-3.5 font-semibold text-slate-900">Travel</td>
                    <td className="py-2.5 px-3.5 text-slate-600 font-medium tabular-nums">1.25 hr</td>
                    <td className="py-2 px-3.5">
                      <div className="relative flex items-center">
                        <Input
                          type="number"
                          step="0.05"
                          value={modalTravel}
                          onChange={(e) => setModalTravel(Number(e.target.value))}
                          className="h-8 pr-8 text-xs font-semibold"
                        />
                        <span className="absolute right-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                          hr
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Prep */}
                  <tr>
                    <td className="py-2.5 px-3.5 font-semibold text-slate-900">Prep</td>
                    <td className="py-2.5 px-3.5 text-slate-600 font-medium tabular-nums">0.5 hr</td>
                    <td className="py-2 px-3.5">
                      <div className="relative flex items-center">
                        <Input
                          type="number"
                          step="0.1"
                          value={modalPrep}
                          onChange={(e) => setModalPrep(Number(e.target.value))}
                          className="h-8 pr-8 text-xs font-semibold"
                        />
                        <span className="absolute right-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                          hr
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Pour */}
                  <tr>
                    <td className="py-2.5 px-3.5 font-semibold text-slate-900">Pour</td>
                    <td className="py-2.5 px-3.5 text-slate-600 font-medium tabular-nums">3.0 hr</td>
                    <td className="py-2 px-3.5">
                      <div className="relative flex items-center">
                        <Input
                          type="number"
                          step="0.1"
                          value={modalPour}
                          onChange={(e) => setModalPour(Number(e.target.value))}
                          className="h-8 pr-8 text-xs font-semibold"
                        />
                        <span className="absolute right-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                          hr
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Cleanup */}
                  <tr>
                    <td className="py-2.5 px-3.5 font-semibold text-slate-900">Cleanup</td>
                    <td className="py-2.5 px-3.5 text-slate-600 font-medium tabular-nums">0.5 hr</td>
                    <td className="py-2 px-3.5">
                      <div className="relative flex items-center">
                        <Input
                          type="number"
                          step="0.1"
                          value={modalCleanup}
                          onChange={(e) => setModalCleanup(Number(e.target.value))}
                          className="h-8 pr-8 text-xs font-semibold"
                        />
                        <span className="absolute right-2.5 text-xs text-slate-400 font-medium pointer-events-none">
                          hr
                        </span>
                      </div>
                    </td>
                  </tr>

                  {/* Total on-site hours highlight row */}
                  <tr className="bg-slate-50/80 font-bold border-t border-slate-200">
                    <td className="py-3 px-3.5 text-slate-900">Total on-site hours:</td>
                    <td className="py-3 px-3.5 text-slate-500"></td>
                    <td className="py-3 px-3.5 text-slate-900 font-extrabold text-xs tabular-nums">
                      {modalTotalOnSite} hr
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Reason for adjustment */}
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-900">Reason for adjustment</label>
              <textarea
                value={modalReason}
                onChange={(e) => setModalReason(e.target.value)}
                placeholder="Explain any changes for the billing history..."
                rows={3}
                className="w-full p-2.5 rounded-xl border border-slate-200 bg-white text-xs text-slate-900 outline-none focus:border-brand"
              />
            </div>

            {/* Modal Footer */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100">
              <span className="text-[11px] text-slate-400 font-medium">
                Changes are recorded with your name and time.
              </span>
              <div className="flex items-center gap-2 self-end sm:self-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsAdjustmentsModalOpen(false)}
                  className="h-8 text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  className="h-8 text-xs font-semibold bg-brand hover:bg-brand-hover text-white cursor-pointer"
                >
                  Save adjustments
                </Button>
              </div>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
