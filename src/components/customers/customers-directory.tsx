'use client';

import { useState, useMemo, useRef, useEffect, useTransition } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Phone,
  MessageSquare,
  ChevronRight,
  X,
  Copy,
  ExternalLink,
  LayoutGrid,
  Table as TableIcon,
  FileText,
  User,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { AppSelect } from '@/components/ui/app-select';
import { toast } from 'sonner';
import { cn, formatUSPhone } from '@/lib/utils';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { CustomerTileCard } from '@/components/customers/customer-tile-card';
import { createCustomer } from '@/features/crm/server/actions';
import { createCustomerSchema } from '@/features/crm/schemas';
import { reportAction } from '@/features/crm/action-feedback';
import type { CustomerItem } from '@/features/crm/types';

type StatusFilter = 'All' | 'Active' | 'Inactive';
type SortOption = 'name_asc' | 'name_desc' | 'newest' | 'oldest';
type ViewLayout = 'table' | 'tiles';

export function CustomersDirectory({ customers }: { customers: CustomerItem[] }) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');
  const [selectedCustomerForQuickView, setSelectedCustomerForQuickView] = useState<CustomerItem | null>(null);

  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [userLayout, setUserLayout] = useState<ViewLayout | null>(null);
  const currentLayout: ViewLayout = userLayout ?? (isMobile || isTablet ? 'tiles' : 'table');

  // Add New Customer Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newCustomerNameError, setNewCustomerNameError] = useState<string | null>(null);
  const [newContactPerson, setNewContactPerson] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerTier, setNewCustomerTier] = useState('Commercial Tier 1');
  const [newCustomerStatus, setNewCustomerStatus] = useState<'Active' | 'Inactive'>('Active');

  const handleOpenAddModal = () => {
    setNewCustomerNameError(null);
    setNewCustomerName('');
    setNewContactPerson('');
    setNewCustomerPhone('');
    setNewCustomerEmail('');
    setNewCustomerTier('Commercial Tier 1');
    setNewCustomerStatus('Active');
    setIsAddModalOpen(true);
  };

  const searchInputRef = useRef<HTMLInputElement>(null);

  // ⌘K keyboard shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filtered & Sorted Customers
  const filteredCustomers = useMemo(() => {
    return customers
      .filter((cust) => {
        // Status filter
        if (statusFilter === 'Active' && cust.status !== 'Active') return false;
        if (statusFilter === 'Inactive' && cust.status !== 'Inactive') return false;

        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const cleanPhone = cust.phone.replace(/\D/g, '');
          const searchDigits = q.replace(/\D/g, '');
          const matchName = cust.name.toLowerCase().includes(q);
          const matchEmail = cust.email.toLowerCase().includes(q);
          const matchContact = cust.contactName.toLowerCase().includes(q);
          const matchTier = cust.tier.toLowerCase().includes(q);
          const matchPhone =
            cust.phone.toLowerCase().includes(q) ||
            (searchDigits.length > 2 && cleanPhone.includes(searchDigits));

          if (!matchName && !matchEmail && !matchPhone && !matchContact && !matchTier) return false;
        }

        return true;
      })
      .sort((a, b) => {
        // Keep inactive customers at the bottom by default
        if (a.status !== b.status) {
          return a.status === 'Inactive' ? 1 : -1;
        }
        if (sortBy === 'name_asc') return a.name.localeCompare(b.name);
        if (sortBy === 'name_desc') return b.name.localeCompare(a.name);
        if (sortBy === 'newest') return new Date(b.createdAtRaw).getTime() - new Date(a.createdAtRaw).getTime();
        if (sortBy === 'oldest') return new Date(a.createdAtRaw).getTime() - new Date(b.createdAtRaw).getTime();
        return 0;
      });
  }, [customers, statusFilter, searchQuery, sortBy]);

  // Aggregate Metrics
  const activeCount = useMemo(() => customers.filter((c) => c.status === 'Active').length, [customers]);
  const inactiveCount = useMemo(() => customers.filter((c) => c.status === 'Inactive').length, [customers]);

  // Handle Create Customer
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      businessName: newCustomerName,
      contactName: newContactPerson,
      phone: newCustomerPhone,
      email: newCustomerEmail,
      tier: newCustomerTier,
      status: newCustomerStatus === 'Active' ? ('active' as const) : ('inactive' as const),
    };

    const check = createCustomerSchema.safeParse(payload);
    if (!check.success) {
      const fields = check.error.flatten().fieldErrors;
      if (fields.businessName) {
        setNewCustomerNameError(fields.businessName[0] ?? 'Company name is required');
      } else {
        toast.error(Object.values(fields).flat()[0] ?? 'Please check the form.');
      }
      return;
    }

    startSaving(async () => {
      const result = await createCustomer(payload);
      if (!reportAction(result, { entity: 'customer', refresh: () => router.refresh() })) return;

      setNewCustomerNameError(null);
      setIsAddModalOpen(false);
      toast.success('Customer account created', {
        description: `${newCustomerName.trim()} added to master CRM directory.`,
      });
      if (!result.data.contactSaved) {
        toast.warning('The lead contact could not be saved. Add it from the customer page.');
      }
    });
  };

  const handleCall = (name: string, phone: string) => {
    toast.info(`Calling ${name}`, {
      description: `Dialing ${phone} via office telephony link`,
    });
  };

  const handleText = (name: string, phone: string) => {
    toast.info(`Opening SMS channel with ${name}`, {
      description: `Target mobile: ${phone}`,
    });
  };

  const handleCopyPhone = (phone: string, company: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(phone);
      toast.success('Phone copied to clipboard', {
        description: `${phone} (${company})`,
      });
    }
  };

  const handleCopyEmail = (email: string, company: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(email);
      toast.success('Email copied to clipboard', {
        description: `${email} (${company})`,
      });
    }
  };

  // Helper for generating initial badges
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full">
      {/* ── 1. Page Header ── */}
      <PageHeader
        title="Customers"
        description="Find customer details, contacts, and orders."
        actions={
          <Button
            variant="brand"
            onClick={handleOpenAddModal}
            className="font-semibold gap-1.5 text-sm h-9 px-3.5"
          >
            <Plus className="h-4 w-4" />
            <span>New customer</span>
          </Button>
        }
      />

      {/* ── 3. Filters & Search Control Bar ── */}
      <div className="space-y-3">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200/60 w-full sm:w-fit overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusFilter('All')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5',
                statusFilter === 'All'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <span>All customers</span>
              <span className="px-1.5 py-0.2 rounded-md bg-slate-200/70 text-[10.5px] font-bold text-slate-700">
                {customers.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('Active')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5',
                statusFilter === 'Active'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              <span>Active</span>
              <span className="px-1.5 py-0.2 rounded-md bg-slate-200/70 text-[10.5px] font-bold text-slate-700">
                {activeCount}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusFilter('Inactive')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5',
                statusFilter === 'Inactive'
                  ? 'bg-white text-slate-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
              <span>Inactive</span>
              <span className="px-1.5 py-0.2 rounded-md bg-slate-200/70 text-[10.5px] font-bold text-slate-700">
                {inactiveCount}
              </span>
            </button>
          </div>

          {/* Quick Counter */}
          <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
            <span>Showing {filteredCustomers.length} of {customers.length} customers</span>
          </div>
        </div>

        {/* Search Bar Row (More filters excluded as V2) */}
        <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3">
          <div className="relative flex-1 group">
            <Search className="h-4 w-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none group-focus-within:text-brand transition-colors" />
            <Input
              ref={searchInputRef}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search name, phone, or email"
              className="pl-9.5 pr-14 h-10 text-xs sm:text-sm bg-slate-50/50 border-slate-200 focus-visible:bg-white focus-visible:border-brand outline-none rounded-lg shadow-none transition-all placeholder:text-slate-400"
            />
            {searchQuery ? (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 cursor-pointer"
                title="Clear search"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            ) : (
              <kbd className="hidden sm:inline-flex absolute right-3 top-1/2 -translate-y-1/2 h-5 select-none items-center gap-0.5 rounded border border-slate-200 bg-white px-1.5 font-mono text-[10px] font-medium text-slate-400">
                <span className="text-xs">⌘</span>K
              </kbd>
            )}
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0">
            {/* View Mode Switcher: Tiles vs Table */}
            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 shadow-2xs shrink-0">
              <button
                type="button"
                onClick={() => setUserLayout('tiles')}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer",
                  currentLayout === 'tiles'
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                )}
                title="Tiles view"
                aria-label="Tiles view"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Tiles</span>
              </button>
              <button
                type="button"
                onClick={() => setUserLayout('table')}
                className={cn(
                  "px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer",
                  currentLayout === 'table'
                    ? "bg-white text-slate-900 shadow-2xs font-bold"
                    : "text-slate-600 hover:text-slate-900"
                )}
                title="Table view"
                aria-label="Table view"
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>

            {/* Sort Selector */}
            <div className="w-36 sm:w-44 shrink-0">
              <AppSelect
                size="sm"
                value={sortBy}
                onChange={(val) => setSortBy(val as SortOption)}
                options={[
                  { value: "name_asc", label: "Name A – Z" },
                  { value: "name_desc", label: "Name Z – A" },
                  { value: "newest", label: "Newest first" },
                  { value: "oldest", label: "Oldest first" },
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Customers Master Directory (Tiles Grid vs Table) ── */}
      {filteredCustomers.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs py-14 px-4 text-center text-slate-400">
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No customers found</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No matching records found for "${searchQuery}". Check spelling or try a different filter.`
              : 'No customer accounts in this category.'}
          </p>
          {searchQuery && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSearchQuery('')}
              className="mt-3.5 h-8 text-xs font-semibold cursor-pointer"
            >
              Reset search
            </Button>
          )}
        </div>
      ) : currentLayout === 'tiles' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
          {filteredCustomers.map((cust) => (
            <CustomerTileCard
              key={cust.id}
              customer={cust}
              onClick={() => setSelectedCustomerForQuickView(cust)}
              onCall={handleCall}
              onText={handleText}
              onCopyPhone={handleCopyPhone}
              onCopyEmail={handleCopyEmail}
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold select-none">
                  <th className="py-3 px-4 sm:px-6 w-[28%]">Customer</th>
                  <th className="py-3 px-4 w-[16%]">Phone</th>
                  <th className="py-3 px-4 w-[20%]">Email</th>
                  <th className="py-3 px-4 w-[14%]">Created</th>
                  <th className="py-3 px-4 w-[10%]">Status</th>
                  <th className="py-3 px-4 text-left sm:pr-6 w-[12%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredCustomers.map((cust) => (
                  <tr
                    key={cust.id}
                    className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                    onClick={() => setSelectedCustomerForQuickView(cust)}
                  >
                    {/* Customer Info with Monogram Badge */}
                    <td className="py-3.5 px-4 sm:px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-8.5 w-8.5 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0 group-hover:border-brand/40 group-hover:bg-brand-light/50 group-hover:text-brand transition-colors">
                          {getInitials(cust.name)}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <span className="font-semibold text-slate-900 group-hover:text-brand transition-colors truncate">
                            {cust.name}
                          </span>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                            <span>{cust.contactName}</span>
                            <span className="text-slate-300">&bull;</span>
                            <span className="text-slate-500">{cust.tier}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Phone with copy-on-click */}
                    <td className="py-3.5 px-4 font-normal text-slate-700 whitespace-nowrap">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyPhone(cust.phone, cust.name);
                        }}
                        className="inline-flex items-center gap-1 text-slate-700 hover:text-brand font-mono text-xs cursor-pointer group/phone"
                        title="Click to copy phone"
                      >
                        <span>{cust.phone}</span>
                        <Copy className="h-3 w-3 opacity-0 group-hover/phone:opacity-100 text-slate-400 transition-opacity" />
                      </button>
                    </td>

                    {/* Email with copy-on-click */}
                    <td className="py-3.5 px-4 font-normal text-slate-600 truncate max-w-[320px]">
                      <div className="inline-flex items-center gap-1.5 group/email">
                        <a
                          href={`mailto:${cust.email}`}
                          onClick={(e) => e.stopPropagation()}
                          className="hover:text-slate-900 hover:underline transition-colors truncate"
                          title={`Send email to ${cust.email}`}
                        >
                          {cust.email}
                        </a>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleCopyEmail(cust.email, cust.name);
                          }}
                          className="inline-flex items-center text-slate-400 hover:text-brand cursor-pointer opacity-0 group-hover/email:opacity-100 transition-opacity p-0.5"
                          title="Click to copy email"
                        >
                          <Copy className="h-3 w-3" />
                        </button>
                      </div>
                    </td>

                    {/* Created Date & Time */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      <div className="font-medium text-slate-800">{cust.createdDate}</div>
                      <div className="text-[11px] text-slate-400">{cust.createdTime}</div>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {cust.status === 'Active' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-light text-brand border border-brand/25 shadow-2xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          <span>Inactive</span>
                        </span>
                      )}
                    </td>

                    {/* Actions Column */}
                    <td
                      className="py-3.5 px-4 text-left sm:pr-6 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center justify-start gap-1.5">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCall(cust.contactName, cust.phone)}
                          className="h-8 px-2.5 text-xs font-medium text-slate-700 border-slate-200 bg-white hover:bg-brand-light hover:text-brand hover:border-brand/30 cursor-pointer shadow-2xs gap-1.5 transition-all"
                          title={`Call ${cust.phone}`}
                        >
                          <Phone className="h-3.5 w-3.5 text-brand" />
                          <span>Call</span>
                        </Button>

                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleText(cust.contactName, cust.phone)}
                          className="h-8 px-2.5 text-xs font-medium text-slate-700 border-slate-200 bg-white hover:bg-brand-light hover:text-brand hover:border-brand/30 cursor-pointer shadow-2xs gap-1.5 transition-all"
                          title={`Text ${cust.phone}`}
                        >
                          <MessageSquare className="h-3.5 w-3.5 text-brand" />
                          <span>Text</span>
                        </Button>

                        <Link
                          href={`/customers/${cust.id}`}
                          onClick={(e) => e.stopPropagation()}
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors ml-0.5 cursor-pointer"
                          title="Open customer dossier"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}



      {/* ── 6. Dialog: Add New Customer ── */}
      <Dialog
        open={isAddModalOpen}
        onOpenChange={(open) => {
          setIsAddModalOpen(open);
          if (!open) setNewCustomerNameError(null);
        }}
      >
        <DialogContent className="sm:max-w-[440px] p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 tracking-tight">
              Add new customer
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateCustomer} noValidate className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">
                Company name <span className="text-red-500">*</span>
              </label>
              <Input
                value={newCustomerName}
                onChange={(e) => {
                  setNewCustomerName(e.target.value);
                  if (newCustomerNameError) setNewCustomerNameError(null);
                }}
                placeholder="e.g. Acme Concrete Contractors"
                className={cn(
                  "h-10 text-xs sm:text-sm font-medium rounded-lg shadow-2xs transition-colors",
                  newCustomerNameError
                    ? "border-red-500 focus-visible:border-red-500 text-red-900 bg-red-50/20"
                    : "border-slate-200 text-slate-900 bg-white placeholder:text-slate-400 focus-visible:border-brand"
                )}
              />
              {newCustomerNameError && (
                <p className="text-[11px] text-red-500 font-medium mt-1">
                  {newCustomerNameError}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Lead contact person</label>
              <Input
                value={newContactPerson}
                onChange={(e) => setNewContactPerson(e.target.value)}
                placeholder="e.g. John Doe (Superintendent)"
                className="h-10 text-xs sm:text-sm font-medium text-slate-900 border-slate-200 bg-white placeholder:text-slate-400 focus-visible:border-brand focus:border-brand outline-none rounded-lg shadow-2xs transition-colors"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Phone number</label>
                <Input
                  type="tel"
                  value={newCustomerPhone}
                  onChange={(e) => setNewCustomerPhone(formatUSPhone(e.target.value))}
                  placeholder="(207) 555-0188"
                  maxLength={14}
                  className="h-10 text-xs sm:text-sm font-medium text-slate-900 border-slate-200 bg-white placeholder:text-slate-400 focus-visible:border-brand focus:border-brand outline-none rounded-lg shadow-2xs transition-colors"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-700 block">Status</label>
                <AppSelect
                  size="lg"
                  value={newCustomerStatus}
                  onChange={(val) => setNewCustomerStatus(val as 'Active' | 'Inactive')}
                  options={["Active", "Inactive"]}
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Email address</label>
              <Input
                type="email"
                value={newCustomerEmail}
                onChange={(e) => setNewCustomerEmail(e.target.value)}
                placeholder="e.g. office@acmeconcrete.example"
                className="h-10 text-xs sm:text-sm font-medium text-slate-900 border-slate-200 bg-white placeholder:text-slate-400 focus-visible:border-brand focus:border-brand outline-none rounded-lg shadow-2xs transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Account tier</label>
              <AppSelect
                size="lg"
                value={newCustomerTier}
                onChange={setNewCustomerTier}
                options={[
                  "Commercial Tier 1",
                  "Commercial Tier 2",
                  "VIP Partner",
                  "Residential & Civil",
                  "Municipal",
                ]}
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddModalOpen(false)}
                className="h-9 px-4 text-sm font-medium border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg cursor-pointer shadow-2xs transition-colors focus-visible:outline-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSaving}
                className="h-9 px-4.5 text-sm font-semibold bg-brand hover:bg-brand-hover text-white rounded-lg cursor-pointer shadow-xs transition-colors focus-visible:outline-none"
              >
                {isSaving ? 'Saving...' : 'Add customer'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── 7. Quick View Customer Modal ── */}
      {selectedCustomerForQuickView && (
        <Dialog
          open={!!selectedCustomerForQuickView}
          onOpenChange={(open) => !open && setSelectedCustomerForQuickView(null)}
        >
          <DialogContent className="sm:max-w-lg p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-4">
            <DialogHeader>
              <div className="flex items-center gap-3.5">
                <div className="h-11 w-11 rounded-xl bg-brand text-white font-bold text-base flex items-center justify-center shadow-xs shrink-0">
                  {getInitials(selectedCustomerForQuickView.name)}
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-base sm:text-lg font-bold text-slate-900 tracking-tight truncate">
                    {selectedCustomerForQuickView.name}
                  </DialogTitle>
                  {selectedCustomerForQuickView.number && (
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      <span className="text-xs text-slate-400 font-medium">
                        Account ID: {selectedCustomerForQuickView.number}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-4 pt-1">
              {/* Contact Details */}
              <div className="rounded-xl border border-slate-200/80 bg-slate-50/60 p-2.5 space-y-2">
                {/* Primary Contact */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200/60 shadow-2xs gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-slate-100/90 border border-slate-200/70 flex items-center justify-center text-slate-600 shrink-0">
                      <User className="h-4.5 w-4.5 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 block">
                        Primary Contact
                      </span>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="font-semibold text-sm text-slate-900">
                          {selectedCustomerForQuickView.contactName}
                        </span>
                        {selectedCustomerForQuickView.contactRole && (
                          <span className="text-xs text-slate-500 font-normal">
                            ({selectedCustomerForQuickView.contactRole})
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Phone */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200/60 shadow-2xs gap-3 group/phone">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-slate-100/90 border border-slate-200/70 flex items-center justify-center text-slate-600 shrink-0">
                      <Phone className="h-4.5 w-4.5 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 block">
                        Phone Number
                      </span>
                      <span className="font-mono text-sm font-semibold text-slate-900 tracking-tight">
                        {selectedCustomerForQuickView.phone}
                      </span>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyPhone(selectedCustomerForQuickView.phone, selectedCustomerForQuickView.name)}
                    className="h-8 px-2.5 text-xs text-slate-600 hover:text-brand hover:bg-brand-light/60 gap-1.5 cursor-pointer rounded-lg shrink-0 border border-slate-200/60 hover:border-brand/30"
                    title="Click to copy phone"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Copy</span>
                  </Button>
                </div>

                {/* Email */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white border border-slate-200/60 shadow-2xs gap-3 group/email">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-9 w-9 rounded-lg bg-slate-100/90 border border-slate-200/70 flex items-center justify-center text-slate-600 shrink-0">
                      <Mail className="h-4.5 w-4.5 text-slate-500" />
                    </div>
                    <div className="min-w-0">
                      <span className="text-[10.5px] font-semibold uppercase tracking-wider text-slate-400 block">
                        Email Address
                      </span>
                      <a
                        href={`mailto:${selectedCustomerForQuickView.email}`}
                        className="text-sm font-semibold text-slate-900 hover:text-brand hover:underline truncate block"
                        title={`Send email to ${selectedCustomerForQuickView.email}`}
                      >
                        {selectedCustomerForQuickView.email}
                      </a>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    onClick={() => handleCopyEmail(selectedCustomerForQuickView.email, selectedCustomerForQuickView.name)}
                    className="h-8 px-2.5 text-xs text-slate-600 hover:text-brand hover:bg-brand-light/60 gap-1.5 cursor-pointer rounded-lg shrink-0 border border-slate-200/60 hover:border-brand/30"
                    title="Click to copy email"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    <span className="text-xs font-medium">Copy</span>
                  </Button>
                </div>
              </div>

              {/* Dispatch Note (Shown only when there's a note for the customer) */}
              {selectedCustomerForQuickView.dispatchNote && (
                <div className="p-3 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-start gap-2.5 text-xs text-amber-950 font-medium">
                  <FileText className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                  <div className="space-y-0.5 min-w-0">
                    <span className="font-bold text-xs text-amber-800 block">
                      Dispatch Note
                    </span>
                    <p className="text-amber-900 leading-snug">
                      {selectedCustomerForQuickView.dispatchNote}
                    </p>
                  </div>
                </div>
              )}

              {/* Direct Actions */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleCall(selectedCustomerForQuickView.contactName, selectedCustomerForQuickView.phone)}
                    className="h-8.5 px-3 text-xs font-medium gap-1.5 cursor-pointer shadow-2xs hover:bg-brand-light hover:text-brand hover:border-brand/30"
                  >
                    <Phone className="h-3.5 w-3.5 text-brand" />
                    <span>Call</span>
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleText(selectedCustomerForQuickView.contactName, selectedCustomerForQuickView.phone)}
                    className="h-8.5 px-3 text-xs font-medium gap-1.5 cursor-pointer shadow-2xs hover:bg-brand-light hover:text-brand hover:border-brand/30"
                  >
                    <MessageSquare className="h-3.5 w-3.5 text-brand" />
                    <span>Text</span>
                  </Button>
                </div>

                <Link
                  href={`/customers/${selectedCustomerForQuickView.id}`}
                  className="h-8.5 px-3.5 rounded-lg bg-brand hover:bg-brand-hover text-white text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors"
                >
                  <span>View details</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}