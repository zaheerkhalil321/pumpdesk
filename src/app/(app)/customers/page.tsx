'use client';

import { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  Plus,
  Phone,
  MessageSquare,
  ChevronRight,
  Info,
  X,
  Building2,
  Users,
  MapPin,
  CheckCircle2,
  Copy,
  ExternalLink,
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

export interface CustomerItem {
  id: string;
  name: string;
  contactName: string;
  contactRole: string;
  phone: string;
  email: string;
  tier: string;
  activeSites: number;
  createdDate: string;
  createdTime: string;
  createdAtRaw: string;
  status: 'Active' | 'Inactive';
}

const INITIAL_CUSTOMERS: CustomerItem[] = [
  {
    id: 'CUST-101',
    name: 'Accurate Concrete',
    contactName: 'Rob Black',
    contactRole: 'Lead Superintendent',
    phone: '207-555-0101',
    email: 'office@accurate.example',
    tier: 'VIP Partner',
    activeSites: 3,
    createdDate: 'Jan 14, 2026',
    createdTime: '9:22 AM',
    createdAtRaw: '2026-01-14T09:22:00',
    status: 'Active',
  },
  {
    id: 'CUST-102',
    name: 'Advanced Concrete Solutions',
    contactName: 'Jim Harris',
    contactRole: 'Project Manager',
    phone: '207-555-0102',
    email: 'office@advanced.example',
    tier: 'Commercial Tier 2',
    activeSites: 0,
    createdDate: 'Nov 3, 2025',
    createdTime: '2:15 PM',
    createdAtRaw: '2025-11-03T14:15:00',
    status: 'Inactive',
  },
  {
    id: 'CUST-103',
    name: "Berube's Excavation & Lawn",
    contactName: 'Marc Berube',
    contactRole: 'Owner & Operator',
    phone: '207-555-0103',
    email: 'office@berube.example',
    tier: 'Residential & Civil',
    activeSites: 2,
    createdDate: 'Aug 27, 2025',
    createdTime: '11:10 AM',
    createdAtRaw: '2025-08-27T11:10:00',
    status: 'Active',
  },
  {
    id: 'CUST-104',
    name: 'Coastal Foundations',
    contactName: 'Dave Miller',
    contactRole: 'Lead Superintendent',
    phone: '207-555-0104',
    email: 'office@coastal.example',
    tier: 'Commercial Tier 1',
    activeSites: 4,
    createdDate: 'Sep 18, 2026',
    createdTime: '8:00 AM',
    createdAtRaw: '2026-09-18T08:00:00',
    status: 'Active',
  },
  {
    id: 'CUST-105',
    name: 'Granite State Builders',
    contactName: 'Steve Cole',
    contactRole: 'Field Foreman',
    phone: '207-555-0105',
    email: 'office@granite.example',
    tier: 'Commercial Tier 1',
    activeSites: 2,
    createdDate: 'Sep 14, 2026',
    createdTime: '10:00 AM',
    createdAtRaw: '2026-09-14T10:00:00',
    status: 'Active',
  },
  {
    id: 'CUST-106',
    name: 'Harbor Builders',
    contactName: 'Ken Adams',
    contactRole: 'General Superintendent',
    phone: '207-555-0106',
    email: 'office@harbor.example',
    tier: 'VIP Partner',
    activeSites: 3,
    createdDate: 'Sep 16, 2026',
    createdTime: '9:30 AM',
    createdAtRaw: '2026-09-16T09:30:00',
    status: 'Active',
  },
  {
    id: 'CUST-107',
    name: 'Pine Tree Concrete',
    contactName: 'Paul White',
    contactRole: 'Operations Director',
    phone: '207-555-0107',
    email: 'office@pinetree.example',
    tier: 'Municipal',
    activeSites: 1,
    createdDate: 'Sep 17, 2026',
    createdTime: '7:00 AM',
    createdAtRaw: '2026-09-17T07:00:00',
    status: 'Active',
  },
  {
    id: 'CUST-108',
    name: 'Turner Construction',
    contactName: 'Mike Vance',
    contactRole: 'Lead Superintendent',
    phone: '207-555-0108',
    email: 'billing@turner.example',
    tier: 'Commercial Tier 1',
    activeSites: 5,
    createdDate: 'Sep 12, 2026',
    createdTime: '7:30 AM',
    createdAtRaw: '2026-09-12T07:30:00',
    status: 'Active',
  },
];

type StatusFilter = 'All' | 'Active' | 'Inactive';
type SortOption = 'name_asc' | 'name_desc' | 'newest' | 'oldest';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<CustomerItem[]>(INITIAL_CUSTOMERS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('All');
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');
  const [selectedCustomerForQuickView, setSelectedCustomerForQuickView] = useState<CustomerItem | null>(null);

  // Add New Customer Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCustomerName, setNewCustomerName] = useState('');
  const [newContactPerson, setNewContactPerson] = useState('');
  const [newCustomerPhone, setNewCustomerPhone] = useState('');
  const [newCustomerEmail, setNewCustomerEmail] = useState('');
  const [newCustomerTier, setNewCustomerTier] = useState('Commercial Tier 1');
  const [newCustomerStatus, setNewCustomerStatus] = useState<'Active' | 'Inactive'>('Active');

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
  const totalSitesCount = useMemo(() => customers.reduce((sum, c) => sum + c.activeSites, 0), [customers]);

  // Handle Create Customer
  const handleCreateCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomerName.trim()) {
      toast.error('Customer company name is required');
      return;
    }

    const formattedPhone = formatUSPhone(newCustomerPhone) || newCustomerPhone.trim();
    const newId = `CUST-${100 + customers.length + 1}`;
    const now = new Date();
    const dateStr = now.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });

    const newCust: CustomerItem = {
      id: newId,
      name: newCustomerName.trim(),
      contactName: newContactPerson.trim() || 'Primary Contact',
      contactRole: 'Field Representative',
      phone: formattedPhone || '(207) 555-0100',
      email: newCustomerEmail.trim() || `office@${newCustomerName.toLowerCase().replace(/[^a-z0-9]/g, '')}.example`,
      tier: newCustomerTier,
      activeSites: 1,
      createdDate: dateStr,
      createdTime: timeStr,
      createdAtRaw: now.toISOString(),
      status: newCustomerStatus,
    };

    setCustomers((prev) => [newCust, ...prev]);
    setIsAddModalOpen(false);
    setNewCustomerName('');
    setNewContactPerson('');
    setNewCustomerPhone('');
    setNewCustomerEmail('');
    setNewCustomerTier('Commercial Tier 1');
    setNewCustomerStatus('Active');

    toast.success('Customer account created', {
      description: `${newCust.name} added to master CRM directory.`,
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

  // Helper for generating initial badges
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ── 1. Page Header ── */}
      <PageHeader
        title="Customers"
        badge={
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-muted text-muted-foreground border border-border">
            CRM Master
          </span>
        }
        description="Find customer details, contacts, and orders."
        actions={
          <Button
            variant="brand"
            onClick={() => setIsAddModalOpen(true)}
            className="font-semibold gap-1.5"
          >
            <Plus className="h-4 w-4" />
            <span>New customer</span>
          </Button>
        }
      />

      {/* ── 2. KPI / Metrics Summary Bar ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Total Accounts</span>
            <Building2 className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 tabular-nums">{customers.length}</span>
            <span className="text-[11px] text-slate-400 font-medium">registered</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Active Pumping</span>
            <span className="h-2 w-2 rounded-full bg-brand animate-pulse" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold text-brand tabular-nums">{activeCount}</span>
            <span className="text-[11px] text-brand/80 font-medium">good standing</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Authorized Sites</span>
            <MapPin className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-900 tabular-nums">{totalSitesCount}</span>
            <span className="text-[11px] text-slate-400 font-medium">job locations</span>
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-white border border-slate-200/80 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 text-xs font-medium">
            <span>Inactive / On Hold</span>
            <Users className="h-4 w-4 text-slate-400" />
          </div>
          <div className="mt-1.5 flex items-baseline gap-2">
            <span className="text-xl font-bold text-slate-700 tabular-nums">{inactiveCount}</span>
            <span className="text-[11px] text-slate-400 font-medium">dormant</span>
          </div>
        </div>
      </div>

      {/* ── 3. Filters & Search Control Bar ── */}
      <div className="space-y-3">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200/60 w-fit">
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
        <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex items-center gap-3">
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

          {/* Sort Selector */}
          <div className="w-36 shrink-0">
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

      {/* ── 4. Customers Master Directory Table ── */}
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
                <th className="py-3 px-4 text-right sm:pr-6 w-[12%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-slate-400">
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
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((cust) => (
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
                          <Link
                            href={`/customers/${cust.id}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-semibold text-slate-900 group-hover:text-brand underline underline-offset-2 transition-colors truncate"
                          >
                            {cust.name}
                          </Link>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5 truncate">
                            <span>{cust.contactName}</span>
                            <span className="text-slate-300">&bull;</span>
                            <span className="text-slate-500">{cust.tier}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Phone with copy-on-click */}
                    <td
                      className="py-3.5 px-4 font-normal text-slate-700 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => handleCopyPhone(cust.phone, cust.name)}
                        className="inline-flex items-center gap-1 text-slate-700 hover:text-brand font-mono text-xs cursor-pointer group/phone"
                        title="Click to copy phone"
                      >
                        <span>{cust.phone}</span>
                        <Copy className="h-3 w-3 opacity-0 group-hover/phone:opacity-100 text-slate-400 transition-opacity" />
                      </button>
                    </td>

                    {/* Email */}
                    <td
                      className="py-3.5 px-4 font-normal text-slate-600 truncate max-w-[200px]"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <a
                        href={`mailto:${cust.email}`}
                        className="hover:text-slate-900 hover:underline transition-colors"
                        title={`Send email to ${cust.email}`}
                      >
                        {cust.email}
                      </a>
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
                      className="py-3.5 px-4 text-right sm:pr-6 whitespace-nowrap"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="inline-flex items-center justify-end gap-1.5">
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
                          className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-800 hover:bg-slate-100 transition-colors ml-0.5 cursor-pointer"
                          title="Open customer dossier"
                        >
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ── 5. Bottom Info & Quick Filter Banner ── */}
      <div className="p-3.5 sm:p-4 rounded-xl bg-slate-50/80 border border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-500">
        <div className="flex items-center gap-2">
          <Info className="h-4 w-4 text-slate-400 shrink-0" />
          <span>Select any customer row to preview details, contacts, and active job sites.</span>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto text-slate-500 font-medium">
          <div className="flex items-center gap-1.5">
            <span>Show:</span>
            <div className="w-36">
              <AppSelect
                size="sm"
                value={statusFilter}
                onChange={(val) => setStatusFilter(val as StatusFilter)}
                options={[
                  { value: "All", label: "All customers" },
                  { value: "Active", label: "Active only" },
                  { value: "Inactive", label: "Inactive only" },
                ]}
              />
            </div>
          </div>
          <span className="text-slate-300">|</span>
          <span>Showing all {filteredCustomers.length} customers</span>
        </div>
      </div>

      {/* ── 6. Dialog: Add New Customer ── */}
      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="sm:max-w-[440px] p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 tracking-tight">
              Add new customer
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateCustomer} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Company name *</label>
              <Input
                value={newCustomerName}
                onChange={(e) => setNewCustomerName(e.target.value)}
                placeholder="e.g. Acme Concrete Contractors"
                className="h-10 text-xs sm:text-sm font-medium text-slate-900 border-slate-200 bg-white placeholder:text-slate-400 focus-visible:border-brand focus:border-brand outline-none rounded-lg shadow-2xs transition-colors"
                required
              />
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
                className="h-9 px-4 text-xs font-semibold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg cursor-pointer shadow-2xs transition-colors focus-visible:outline-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 px-4.5 text-xs font-semibold bg-brand hover:bg-brand-hover text-white rounded-lg cursor-pointer shadow-xs transition-colors focus-visible:outline-none"
              >
                Add customer
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
          <DialogContent className="sm:max-w-md p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-4">
            <DialogHeader>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-brand text-white font-bold text-sm flex items-center justify-center shadow-xs">
                  {getInitials(selectedCustomerForQuickView.name)}
                </div>
                <div>
                  <DialogTitle className="text-base font-bold text-slate-900 tracking-tight">
                    {selectedCustomerForQuickView.name}
                  </DialogTitle>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Account ID: {selectedCustomerForQuickView.id}
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-3.5 pt-2 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Status</span>
                  <span className="inline-flex items-center gap-1 font-semibold text-brand">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {selectedCustomerForQuickView.status}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Account Tier</span>
                  <span className="font-semibold text-slate-900">{selectedCustomerForQuickView.tier}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Primary Contact</span>
                  <span className="font-semibold text-slate-900">
                    {selectedCustomerForQuickView.contactName} ({selectedCustomerForQuickView.contactRole})
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Phone</span>
                  <span className="font-mono font-medium text-slate-900">{selectedCustomerForQuickView.phone}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Email</span>
                  <span className="font-medium text-slate-900">{selectedCustomerForQuickView.email}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Active Sites</span>
                  <span className="font-semibold text-slate-900">
                    {selectedCustomerForQuickView.activeSites} locations
                  </span>
                </div>
              </div>

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
                  <span>Open dossier</span>
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