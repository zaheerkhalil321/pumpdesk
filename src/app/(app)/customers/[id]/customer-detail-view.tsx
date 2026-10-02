'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ChevronLeft,
  ChevronDown,
  ChevronRight,
  Phone,
  MessageSquare,
  Mail,
  MapPin,
  Pencil,
  Plus,
  ExternalLink,
  Search,
  MoreHorizontal,
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
import { toast } from 'sonner';
import { cn, formatUSPhone } from '@/lib/utils';

interface CustomerDetailViewProps {
  customerId: string;
}

interface ContactPerson {
  id: string;
  name: string;
  title: string;
  roles: string[];
  phone: string;
  email: string;
}

interface JobSite {
  id: string;
  name: string;
  address: string;
}

interface RecentOrder {
  id: string;
  date: string;
  status: 'Confirmed' | 'Completed' | 'Pending';
}

interface CustomerFullData {
  id: string;
  name: string;
  nickname: string;
  phone: string;
  email: string;
  address: string;
  customerSince: string;
  location: string;
  status: 'Active' | 'Inactive';
  contacts: ContactPerson[];
  jobSites: JobSite[];
  recentOrders: RecentOrder[];
  defaultInvoiceRecipient: string;
}

const CUSTOMERS_DB: Record<string, CustomerFullData> = {
  'CUST-101': {
    id: 'CUST-101',
    name: 'Accurate Concrete',
    nickname: 'Not set',
    phone: '(207) 555-0101',
    email: 'office@accurate.example',
    address: '318 Main Street, Winthrop, ME 04364',
    customerSince: 'December 10, 2025',
    location: 'Winthrop, Maine',
    status: 'Active',
    contacts: [
      {
        id: 'c1',
        name: 'Alex Morgan',
        title: 'Project manager',
        roles: ['Primary contact', 'Site contact'],
        phone: '(207) 555-0110',
        email: 'alex@accurate.example',
      },
      {
        id: 'c2',
        name: 'Jamie Lee',
        title: 'Accounts payable',
        roles: ['Invoicing'],
        phone: '(207) 555-0111',
        email: 'billing@accurate.example',
      },
      {
        id: 'c3',
        name: 'Sam Taylor',
        title: 'Site superintendent',
        roles: ['Site contact'],
        phone: '(207) 555-0112',
        email: 'sam@accurate.example',
      },
    ],
    jobSites: [
      {
        id: 's1',
        name: 'Appleton',
        address: 'Appleton, ME · Street address not provided',
      },
    ],
    recentOrders: [
      { id: 'ORD-1522', date: 'Sep 15, 2026', status: 'Confirmed' },
      { id: 'ORD-1482', date: 'Aug 28, 2026', status: 'Completed' },
    ],
    defaultInvoiceRecipient: 'Jamie Lee · billing@accurate.example',
  },
  'CUST-104': {
    id: 'CUST-104',
    name: 'Coastal Foundations',
    nickname: 'Coastal',
    phone: '(207) 555-0104',
    email: 'office@coastal.example',
    address: '18 Main Street, Rockland, ME 04841',
    customerSince: 'January 15, 2026',
    location: 'Rockland, Maine',
    status: 'Active',
    contacts: [
      {
        id: 'c1',
        name: 'Dave Miller',
        title: 'Lead Superintendent',
        roles: ['Primary contact', 'Site contact'],
        phone: '(207) 555-0199',
        email: 'dave@coastal.example',
      },
    ],
    jobSites: [
      {
        id: 's1',
        name: 'Rockland Pier',
        address: '18 Main Street, Rockland, ME',
      },
    ],
    recentOrders: [
      { id: 'ORD-1525', date: 'Sep 18, 2026', status: 'Confirmed' },
    ],
    defaultInvoiceRecipient: 'Dave Miller · dave@coastal.example',
  },
  'CUST-108': {
    id: 'CUST-108',
    name: 'Turner Construction',
    nickname: 'Turner',
    phone: '(207) 555-0108',
    email: 'billing@turner.example',
    address: '24 Bay View Street, Camden, ME 04843',
    customerSince: 'September 1, 2025',
    location: 'Camden, Maine',
    status: 'Active',
    contacts: [
      {
        id: 'c1',
        name: 'Mike Vance',
        title: 'Lead Superintendent',
        roles: ['Primary contact', 'Site contact'],
        phone: '(207) 555-0142',
        email: 'mvance@turner.example',
      },
    ],
    jobSites: [
      {
        id: 's1',
        name: 'Bay View Tower',
        address: '24 Bay View Street, Camden, ME 04843',
      },
    ],
    recentOrders: [
      { id: 'ORD-1518', date: 'Sep 12, 2026', status: 'Completed' },
    ],
    defaultInvoiceRecipient: 'Accounting · billing@turner.example',
  },
};

type ActiveTab = 'overview' | 'contacts_sites';

export function CustomerDetailView({ customerId }: CustomerDetailViewProps) {
  const initial = CUSTOMERS_DB[customerId] || {
    ...CUSTOMERS_DB['CUST-101'],
    id: customerId,
    name: customerId.startsWith('CUST-') ? `Customer ${customerId}` : customerId,
  };

  const [customer, setCustomer] = useState<CustomerFullData>(initial);
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');

  // Contact list search in Contacts & Sites tab
  const [contactSearchQuery, setContactSearchQuery] = useState('');

  // Selected site contact in Job contacts card
  const [selectedSiteContact, setSelectedSiteContact] = useState<string>(
    customer.contacts[2]?.name || customer.contacts[0]?.name || ''
  );

  // Modals state
  const [isAddContactModalOpen, setIsAddContactModalOpen] = useState(false);
  const [isAddSiteModalOpen, setIsAddSiteModalOpen] = useState(false);
  const [isEditCustomerModalOpen, setIsEditCustomerModalOpen] = useState(false);

  // Add Contact Form State
  const [newContactName, setNewContactName] = useState('');
  const [newContactTitle, setNewContactTitle] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');
  const [newContactEmail, setNewContactEmail] = useState('');
  const [newContactRole, setNewContactRole] = useState<'Site contact' | 'Primary contact' | 'Invoicing'>('Site contact');

  // Add Site Form State
  const [newSiteName, setNewSiteName] = useState('');
  const [newSiteAddress, setNewSiteAddress] = useState('');

  // Edit Customer Form State
  const [editCustName, setEditCustName] = useState(customer.name);
  const [editCustPhone, setEditCustPhone] = useState(customer.phone);
  const [editCustEmail, setEditCustEmail] = useState(customer.email);
  const [editCustAddress, setEditCustAddress] = useState(customer.address);

  // Actions
  const handleCall = (phone: string, targetName: string) => {
    toast.info(`Calling ${targetName}`, { description: phone });
  };

  const handleText = (phone: string, targetName: string) => {
    toast.info(`Opening SMS with ${targetName}`, { description: phone });
  };

  const handleEmail = (email: string) => {
    toast.info('Opening mail composer', { description: email });
  };

  const handleDirections = (address: string) => {
    const url = `https://maps.google.com/?q=${encodeURIComponent(address)}`;
    window.open(url, '_blank');
  };

  // Add Contact Submit
  const handleCreateContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContactName.trim() || !newContactPhone.trim()) {
      toast.error('Name and phone are required');
      return;
    }

    const formatted = formatUSPhone(newContactPhone) || newContactPhone.trim();
    const newContact: ContactPerson = {
      id: `c-${Date.now()}`,
      name: newContactName.trim(),
      title: newContactTitle.trim() || 'Site Representative',
      roles: [newContactRole],
      phone: formatted,
      email: newContactEmail.trim() || `contact@${customer.name.toLowerCase().replace(/[^a-z0-9]/g, '')}.example`,
    };

    setCustomer((prev) => ({
      ...prev,
      contacts: [...prev.contacts, newContact],
    }));

    setIsAddContactModalOpen(false);
    setNewContactName('');
    setNewContactTitle('');
    setNewContactPhone('');
    setNewContactEmail('');
    toast.success('Contact added', {
      description: `${newContact.name} linked to ${customer.name}.`,
    });
  };

  // Add Site Submit
  const handleCreateSite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSiteName.trim()) {
      toast.error('Site name is required');
      return;
    }

    const newSite: JobSite = {
      id: `s-${Date.now()}`,
      name: newSiteName.trim(),
      address: newSiteAddress.trim() || `${newSiteName.trim()}, ME · Street address not provided`,
    };

    setCustomer((prev) => ({
      ...prev,
      jobSites: [...prev.jobSites, newSite],
    }));

    setIsAddSiteModalOpen(false);
    setNewSiteName('');
    setNewSiteAddress('');
    toast.success('Job site added', {
      description: `${newSite.name} added to authorized sites.`,
    });
  };

  // Edit Customer Submit
  const handleSaveCustomer = (e: React.FormEvent) => {
    e.preventDefault();
    setCustomer((prev) => ({
      ...prev,
      name: editCustName.trim() || prev.name,
      phone: formatUSPhone(editCustPhone) || prev.phone,
      email: editCustEmail.trim() || prev.email,
      address: editCustAddress.trim() || prev.address,
    }));
    setIsEditCustomerModalOpen(false);
    toast.success('Customer details updated');
  };

  // Filter contacts by search
  const filteredContacts = customer.contacts.filter((c) => {
    if (!contactSearchQuery.trim()) return true;
    const q = contactSearchQuery.toLowerCase().trim();
    return (
      c.name.toLowerCase().includes(q) ||
      c.title.toLowerCase().includes(q) ||
      c.email.toLowerCase().includes(q) ||
      c.phone.includes(q)
    );
  });

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ── 1. Top Navigation & Header ── */}
      <div className="space-y-3">
        <Link
          href="/customers"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
          <span>Back to customers</span>
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                {customer.name}
              </h1>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-brand-light text-brand border border-brand/25 shadow-2xs">
                <span className="h-1.5 w-1.5 rounded-full bg-brand" />
                <span>{customer.status}</span>
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Customer since {customer.customerSince} &bull; {customer.location}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditCustomerModalOpen(true)}
              className="h-9 px-3.5 text-xs font-semibold text-slate-700 border-slate-200 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs gap-1.5"
            >
              <Pencil className="h-3.5 w-3.5 text-slate-500" />
              <span>Edit customer</span>
            </Button>

            <Link href="/schedule">
              <Button
                size="sm"
                className="h-9 px-4 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer gap-1.5"
              >
                <Plus className="h-4 w-4" />
                <span>New order</span>
              </Button>
            </Link>

            <Button
              variant="outline"
              size="sm"
              onClick={() => toast.info('Customer options', { description: 'Account settings & audit logs' })}
              className="h-9 w-9 p-0 text-slate-500 border-slate-200 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs"
            >
              <MoreHorizontal className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* ── 2. Navigation Tabs (V1 Scope: Overview, Contacts & Sites) ── */}
      <div className="flex items-center gap-1.5 border-b border-slate-200/80 pb-3">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={cn(
            'px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none',
            activeTab === 'overview'
              ? 'bg-brand text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
          )}
        >
          Overview
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('contacts_sites')}
          className={cn(
            'px-4 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none inline-flex items-center gap-1.5',
            activeTab === 'contacts_sites'
              ? 'bg-brand text-white shadow-xs'
              : 'bg-slate-100 hover:bg-slate-200/80 text-slate-600'
          )}
        >
          <span>Contacts &amp; sites</span>
          <span
            className={cn(
              'px-1.5 py-0.2 rounded-md text-[10px] font-bold tabular-nums',
              activeTab === 'contacts_sites'
                ? 'bg-white/20 text-white'
                : 'bg-slate-200 text-slate-700'
            )}
          >
            {customer.contacts.length}
          </span>
        </button>
      </div>

      {/* ── 3. Tab 1: OVERVIEW (Screenshot 1) ── */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* LEFT COLUMN */}
          <div className="space-y-5">
            {/* Card 1: Customer Information */}
            <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-4">
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm text-slate-900">Customer information</span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="flex items-start justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium w-32">Name</span>
                  <span className="text-slate-900 font-semibold flex-1">{customer.name}</span>
                </div>

                <div className="flex items-start justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium w-32">Nickname</span>
                  <span className="text-slate-600 font-medium flex-1">{customer.nickname}</span>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium w-32">Main phone</span>
                  <div className="flex-1 flex items-center justify-between gap-2">
                    <span className="text-slate-900 font-mono font-medium">{customer.phone}</span>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCall(customer.phone, customer.name)}
                        className="h-7 px-2 text-[11px] font-medium gap-1 text-slate-700 border-slate-200 hover:bg-brand-light hover:text-brand hover:border-brand/30 shadow-2xs transition-colors"
                      >
                        <Phone className="h-3 w-3 text-brand" />
                        <span>Call</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleText(customer.phone, customer.name)}
                        className="h-7 px-2 text-[11px] font-medium gap-1 text-slate-700 border-slate-200 hover:bg-brand-light hover:text-brand hover:border-brand/30 shadow-2xs transition-colors"
                      >
                        <MessageSquare className="h-3 w-3 text-brand" />
                        <span>Text</span>
                      </Button>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between py-1.5 border-b border-slate-100">
                  <span className="text-slate-500 font-medium w-32">Email</span>
                  <div className="flex-1 flex items-center justify-between gap-2">
                    <span className="text-slate-900 font-medium truncate max-w-[200px]">{customer.email}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEmail(customer.email)}
                      className="h-7 px-2 text-[11px] font-medium gap-1 text-slate-700 border-slate-200 hover:bg-brand-light hover:text-brand hover:border-brand/30 shadow-2xs"
                    >
                      <Mail className="h-3 w-3 text-brand" />
                      <span>Email</span>
                    </Button>
                  </div>
                </div>

                <div className="flex items-start justify-between py-1.5">
                  <span className="text-slate-500 font-medium w-32">Physical address</span>
                  <div className="flex-1 flex items-start justify-between gap-2">
                    <span className="text-slate-900 font-medium">{customer.address}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDirections(customer.address)}
                      className="h-7 px-2 text-[11px] font-medium gap-1 text-slate-700 border-slate-200 hover:bg-brand-light hover:text-brand hover:border-brand/30 shadow-2xs shrink-0"
                    >
                      <MapPin className="h-3 w-3 text-brand" />
                      <span>Directions</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Contacts & Job Sites */}
            <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">Contacts &amp; job sites</span>
              </div>

              {/* Contacts Subsection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Contacts</span>
                  <button
                    type="button"
                    onClick={() => setIsAddContactModalOpen(true)}
                    className="text-brand hover:underline font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add contact</span>
                  </button>
                </div>

                {customer.contacts.slice(0, 1).map((c) => (
                  <div key={c.id} className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between text-xs">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <span className="font-semibold text-slate-900">{c.name}</span>
                        {c.roles.includes('Primary contact') && (
                          <span className="px-1.5 py-0.2 rounded-md bg-brand-light text-brand border border-teal-200/50 text-[10px] font-bold">
                            Primary contact
                          </span>
                        )}
                      </div>
                      <div className="text-slate-500 font-mono text-[11px] mt-0.5">{c.phone}</div>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleCall(c.phone, c.name)}
                        className="h-7 px-2 text-[11px] font-medium gap-1 text-slate-700 border-slate-200 hover:bg-brand-light hover:text-brand hover:border-brand/30 shadow-2xs transition-colors"
                      >
                        <Phone className="h-3 w-3 text-brand" />
                        <span>Call</span>
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleText(c.phone, c.name)}
                        className="h-7 px-2 text-[11px] font-medium gap-1 text-slate-700 border-slate-200 hover:bg-brand-light hover:text-brand hover:border-brand/30 shadow-2xs transition-colors"
                      >
                        <MessageSquare className="h-3 w-3 text-brand" />
                        <span>Text</span>
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Job Sites Subsection */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-700">Job sites</span>
                  <button
                    type="button"
                    onClick={() => setIsAddSiteModalOpen(true)}
                    className="text-brand hover:underline font-semibold text-xs inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add site</span>
                  </button>
                </div>

                {customer.jobSites.map((site) => (
                  <div key={site.id} className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between text-xs">
                    <div>
                      <div className="font-semibold text-slate-900">{site.name}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">{site.address}</div>
                    </div>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                ))}
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => setActiveTab('contacts_sites')}
                  className="text-xs font-semibold text-[#0D5294] hover:underline cursor-pointer inline-flex items-center gap-1"
                >
                  <span>View all contacts &amp; sites</span>
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-5">
            {/* Card 1: Dispatch Account Settings & Invoicing Recipient */}
            <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">Dispatch profile &amp; defaults</span>
                <span className="px-2 py-0.5 rounded-full bg-brand-light text-brand border border-brand/25 text-[10.5px] font-bold">
                  Active account
                </span>
              </div>

              <div className="space-y-3 text-xs">
                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 space-y-1.5">
                  <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                    Default Invoice Recipient
                  </div>
                  <div className="font-semibold text-slate-900 text-xs">
                    {customer.defaultInvoiceRecipient}
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Automatically assigned when creating new pour orders for {customer.name}.
                  </p>
                </div>

                <div className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between">
                  <div>
                    <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">
                      Authorized Pour Sites
                    </div>
                    <div className="font-semibold text-slate-900 text-xs mt-0.5">
                      {customer.jobSites.length} verified {customer.jobSites.length === 1 ? 'site' : 'sites'} on file
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setIsAddSiteModalOpen(true)}
                    className="h-7 px-2.5 text-xs font-semibold text-slate-700 border-slate-200 hover:bg-white shadow-2xs gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add site</span>
                  </Button>
                </div>
              </div>
            </div>

            {/* Card 2: Recent Orders */}
            <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-slate-900">Recent orders</span>
                <Link
                  href="/orders"
                  className="text-xs font-semibold text-[#0D5294] hover:underline inline-flex items-center gap-1"
                >
                  <span>View all orders</span>
                  <ExternalLink className="h-3 w-3" />
                </Link>
              </div>

              <div className="divide-y divide-slate-100 text-xs">
                {customer.recentOrders.map((ord) => (
                  <Link
                    key={ord.id}
                    href={`/orders/${ord.id}`}
                    className="py-3 flex items-center justify-between hover:bg-slate-50/80 -mx-2 px-2 rounded-lg transition-colors group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-900 group-hover:text-brand transition-colors">
                        {ord.id}
                      </span>
                      <span className="text-slate-500 font-medium">{ord.date}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={cn(
                          'px-2 py-0.5 rounded-full text-[11px] font-semibold border',
                          ord.status === 'Confirmed'
                            ? 'bg-brand-light text-brand border-brand/20'
                            : 'bg-brand-light text-brand border-brand/20'
                        )}
                      >
                        {ord.status}
                      </span>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-slate-700 transition-colors" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 4. Tab 2: CONTACTS & SITES (Screenshot 2) ── */}
      {activeTab === 'contacts_sites' && (
        <div className="space-y-5">
          {/* Top Card: Contacts Master Directory */}
          <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900">Contacts</h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  People linked to {customer.name}.
                </p>
              </div>

              <div className="flex items-center gap-2.5">
                <div className="relative">
                  <Search className="h-3.5 w-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  <Input
                    value={contactSearchQuery}
                    onChange={(e) => setContactSearchQuery(e.target.value)}
                    placeholder="Search contacts..."
                    className="h-8.5 pl-8.5 pr-3 text-xs w-48 bg-slate-50/60 border-slate-200 rounded-lg outline-none focus-visible:border-brand"
                  />
                </div>

                <Button
                  size="sm"
                  onClick={() => setIsAddContactModalOpen(true)}
                  className="h-8.5 px-3 bg-brand hover:bg-brand-hover text-white text-xs font-semibold rounded-lg shadow-xs cursor-pointer gap-1.5"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Add contact</span>
                </Button>
              </div>
            </div>

            {/* Contacts Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs sm:text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/60 text-slate-500 font-semibold select-none">
                    <th className="py-3 px-4 sm:px-6 w-[28%]">Name &amp; title</th>
                    <th className="py-3 px-4 w-[24%]">Roles</th>
                    <th className="py-3 px-4 w-[26%]">Phone &amp; email</th>
                    <th className="py-3 px-4 text-right sm:pr-6 w-[22%]">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredContacts.map((contact) => (
                    <tr key={contact.id} className="hover:bg-slate-50/60 transition-colors">
                      {/* Name & Title */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="font-semibold text-slate-900">{contact.name}</div>
                        <div className="text-xs text-slate-400 mt-0.5">{contact.title}</div>
                      </td>

                      {/* Roles */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-wrap items-center gap-1.5">
                          {contact.roles.map((r) => (
                            <span
                              key={r}
                              className={cn(
                                'px-2 py-0.5 rounded-full text-[10.5px] font-semibold border',
                                r === 'Primary contact'
                                  ? 'bg-brand-light text-brand border-brand/20'
                                  : r === 'Site contact'
                                  ? 'bg-slate-100 text-slate-700 border-slate-200'
                                  : 'bg-slate-100 text-slate-600 border-slate-200'
                              )}
                            >
                              {r}
                            </span>
                          ))}
                        </div>
                      </td>

                      {/* Phone & Email */}
                      <td className="py-3.5 px-4">
                        <div className="font-mono text-slate-800 text-xs">{contact.phone}</div>
                        <div className="text-slate-400 text-[11px] truncate max-w-[180px]">
                          {contact.email}
                        </div>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right sm:pr-6 whitespace-nowrap">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleCall(contact.phone, contact.name)}
                            className="h-7.5 px-2 text-[11px] font-medium text-slate-700 border-slate-200 bg-white hover:bg-brand-light hover:text-brand hover:border-brand/30 shadow-2xs gap-1 transition-colors"
                          >
                            <Phone className="h-3 w-3 text-brand" />
                            <span>Call</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleText(contact.phone, contact.name)}
                            className="h-7.5 px-2 text-[11px] font-medium text-slate-700 border-slate-200 bg-white hover:bg-brand-light hover:text-brand hover:border-brand/30 shadow-2xs gap-1 transition-colors"
                          >
                            <MessageSquare className="h-3 w-3 text-brand" />
                            <span>Text</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEmail(contact.email)}
                            className="h-7.5 px-2 text-[11px] font-medium text-slate-700 border-slate-200 bg-white hover:bg-brand-light hover:text-brand hover:border-brand/30 shadow-2xs gap-1 transition-colors"
                          >
                            <Mail className="h-3 w-3 text-brand" />
                            <span>Email</span>
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toast.info(`Editing ${contact.name}`)}
                            className="h-7.5 px-2 text-[11px] font-medium text-slate-700 border-slate-200 bg-white hover:bg-slate-50 shadow-2xs gap-1"
                          >
                            <Pencil className="h-3 w-3 text-slate-500" />
                            <span>Edit</span>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Two-Column Split: Job Contacts & Job Sites vs Invoice Recipients */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Left Column: Job Contacts & Job Sites */}
            <div className="space-y-5">
              {/* Card 1: Job contacts */}
              <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-3.5">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Job contacts</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Choose the site contact on each order.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-slate-900">ORD-1522 &bull; Appleton</span>
                    <Link
                      href="/orders/ORD-1522"
                      className="text-xs font-semibold text-[#0D5294] hover:underline inline-flex items-center gap-0.5"
                    >
                      <span>Open order</span>
                      <ChevronRight className="h-3 w-3" />
                    </Link>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[11px] font-semibold text-slate-600 block">Site contact</label>
                    <AppSelect
                      size="sm"
                      value={selectedSiteContact}
                      onChange={setSelectedSiteContact}
                      options={customer.contacts.map((c) => ({
                        value: c.name,
                        label: c.name,
                        description: c.title,
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => setIsAddContactModalOpen(true)}
                    className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Additional contact</span>
                  </button>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    For this order only; account contacts stay unchanged.
                  </p>
                </div>
              </div>

              {/* Card 2: Job sites */}
              <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-slate-900">Job sites</h3>
                  <button
                    type="button"
                    onClick={() => setIsAddSiteModalOpen(true)}
                    className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="h-3 w-3" />
                    <span>Add site</span>
                  </button>
                </div>

                <div className="space-y-2 text-xs">
                  {customer.jobSites.map((site) => (
                    <div
                      key={site.id}
                      className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/70 flex items-center justify-between"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{site.name}</div>
                        <div className="text-slate-500 text-[11px] mt-0.5">{site.address}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => toast.info(`Viewing job site: ${site.name}`)}
                        className="text-xs font-semibold text-[#0D5294] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>View site</span>
                        <ChevronRight className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Invoice Recipients */}
            <div className="space-y-5">
              <div className="p-5 rounded-2xl border border-slate-200/90 bg-white shadow-xs space-y-3.5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-slate-900">Invoice recipients</h3>
                      <span className="px-2 py-0.2 rounded-md bg-brand-light text-brand border border-brand/20 text-[10.5px] font-bold">
                        Account default
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Default invoice recipient(s) for {customer.name}.
                    </p>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-800">{customer.defaultInvoiceRecipient}</span>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                </div>

                <div>
                  <button
                    type="button"
                    onClick={() => toast.info('Edit invoice recipient contacts')}
                    className="text-xs font-semibold text-[#0D5294] hover:underline cursor-pointer"
                  >
                    Edit recipients
                  </button>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Used for new invoices; recipients can be changed before sending.
                  </p>
                </div>
              </div>

              {/* Notification Preferences Banner */}
              <div className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/70 flex items-start justify-between gap-3 text-xs">
                <div>
                  <div className="font-bold text-slate-900 mb-1">
                    Contact notification preferences
                  </div>
                  <p className="text-slate-500 leading-relaxed text-[11.5px]">
                    Manage confirmations, operator details, en-route updates, authorization requests, work-ticket review, and missing-detail reminders from each contact&apos;s profile.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toast.info('Manage notification routing')}
                  className="text-xs font-semibold text-[#0D5294] hover:underline whitespace-nowrap cursor-pointer shrink-0 mt-0.5"
                >
                  Manage contacts &rarr;
                </button>
              </div>
            </div>
          </div>
        </div>
      )}



      {/* ── 7. Dialog: Add Contact ── */}
      <Dialog open={isAddContactModalOpen} onOpenChange={setIsAddContactModalOpen}>
        <DialogContent className="sm:max-w-[430px] p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 tracking-tight">
              Add contact for {customer.name}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateContact} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Full name *</label>
              <Input
                value={newContactName}
                onChange={(e) => setNewContactName(e.target.value)}
                placeholder="e.g. Alex Morgan"
                className="h-10 text-xs sm:text-sm font-medium text-slate-900 border-slate-200 bg-white placeholder:text-slate-400 focus-visible:border-brand focus:border-brand outline-none rounded-lg shadow-2xs transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Role / Title</label>
              <Input
                value={newContactTitle}
                onChange={(e) => setNewContactTitle(e.target.value)}
                placeholder="e.g. Project manager"
                className="h-10 text-xs sm:text-sm font-medium text-slate-900 border-slate-200 bg-white placeholder:text-slate-400 focus-visible:border-brand focus:border-brand outline-none rounded-lg shadow-2xs transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Phone number *</label>
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
              <label className="text-xs font-semibold text-slate-700 block">Email address</label>
              <Input
                type="email"
                value={newContactEmail}
                onChange={(e) => setNewContactEmail(e.target.value)}
                placeholder="e.g. alex@accurate.example"
                className="h-10 text-xs sm:text-sm font-medium text-slate-900 border-slate-200 bg-white placeholder:text-slate-400 focus-visible:border-brand focus:border-brand outline-none rounded-lg shadow-2xs transition-colors"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Primary role tag</label>
              <AppSelect
                size="lg"
                value={newContactRole}
                onChange={(val) => setNewContactRole(val as 'Site contact' | 'Primary contact' | 'Invoicing')}
                options={[
                  "Primary contact",
                  "Site contact",
                  "Invoicing",
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

      {/* ── 8. Dialog: Add Job Site ── */}
      <Dialog open={isAddSiteModalOpen} onOpenChange={setIsAddSiteModalOpen}>
        <DialogContent className="sm:max-w-[430px] p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 tracking-tight">
              Add authorized site for {customer.name}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleCreateSite} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Site name *</label>
              <Input
                value={newSiteName}
                onChange={(e) => setNewSiteName(e.target.value)}
                placeholder="e.g. Rockland Medical Plaza"
                className="h-10 text-xs sm:text-sm font-medium text-slate-900 border-slate-200 bg-white placeholder:text-slate-400 focus-visible:border-brand focus:border-brand outline-none rounded-lg shadow-2xs transition-colors"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Street address</label>
              <Input
                value={newSiteAddress}
                onChange={(e) => setNewSiteAddress(e.target.value)}
                placeholder="e.g. 1400 Stemmons Fwy, Rockland, ME"
                className="h-10 text-xs sm:text-sm font-medium text-slate-900 border-slate-200 bg-white placeholder:text-slate-400 focus-visible:border-brand focus:border-brand outline-none rounded-lg shadow-2xs transition-colors"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsAddSiteModalOpen(false)}
                className="h-9 px-4 text-xs font-semibold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg cursor-pointer shadow-2xs transition-colors focus-visible:outline-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 px-4.5 text-xs font-semibold bg-brand hover:bg-brand-hover text-white rounded-lg cursor-pointer shadow-xs transition-colors focus-visible:outline-none"
              >
                Add job site
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── 9. Dialog: Edit Customer ── */}
      <Dialog open={isEditCustomerModalOpen} onOpenChange={setIsEditCustomerModalOpen}>
        <DialogContent className="sm:max-w-[430px] p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl space-y-4">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 tracking-tight">
              Edit {customer.name}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSaveCustomer} className="space-y-4 pt-1">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Company name</label>
              <Input
                value={editCustName}
                onChange={(e) => setEditCustName(e.target.value)}
                className="h-10 text-xs sm:text-sm font-medium text-slate-900 border-slate-200 bg-white focus-visible:border-brand focus:border-brand outline-none rounded-lg shadow-2xs"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Main phone</label>
              <Input
                type="tel"
                value={editCustPhone}
                onChange={(e) => setEditCustPhone(formatUSPhone(e.target.value))}
                maxLength={14}
                className="h-10 text-xs sm:text-sm font-medium text-slate-900 border-slate-200 bg-white focus-visible:border-brand focus:border-brand outline-none rounded-lg shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Email</label>
              <Input
                type="email"
                value={editCustEmail}
                onChange={(e) => setEditCustEmail(e.target.value)}
                className="h-10 text-xs sm:text-sm font-medium text-slate-900 border-slate-200 bg-white focus-visible:border-brand focus:border-brand outline-none rounded-lg shadow-2xs"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700 block">Physical address</label>
              <Input
                value={editCustAddress}
                onChange={(e) => setEditCustAddress(e.target.value)}
                className="h-10 text-xs sm:text-sm font-medium text-slate-900 border-slate-200 bg-white focus-visible:border-brand focus:border-brand outline-none rounded-lg shadow-2xs"
              />
            </div>

            <div className="pt-3 flex items-center justify-end gap-2.5">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsEditCustomerModalOpen(false)}
                className="h-9 px-4 text-xs font-semibold border-slate-200 bg-white hover:bg-slate-50 text-slate-700 rounded-lg cursor-pointer shadow-2xs transition-colors focus-visible:outline-none"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="h-9 px-4.5 text-xs font-semibold bg-brand hover:bg-brand-hover text-white rounded-lg cursor-pointer shadow-xs transition-colors focus-visible:outline-none"
              >
                Save changes
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
