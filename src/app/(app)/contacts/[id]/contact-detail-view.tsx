'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  ChevronLeft,
  ChevronRight,
  Phone,
  MessageSquare,
  Mail,
  Pencil,
  MoreHorizontal,
  Plus,
  Search,
  Ban,
  Copy,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { AppSelect } from '@/components/ui/app-select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import {
  useContacts,
  updateContact,
  deleteContact,
} from '@/lib/contacts-store';
import { EditContactModal } from '@/components/contacts/edit-contact-modal';
import { LinkAccountModal } from '@/components/contacts/link-account-modal';
import { EditNotificationPreferencesModal } from '@/components/contacts/edit-notification-preferences-modal';

interface ContactDetailViewProps {
  contactId: string;
}

type TabMode = 'overview' | 'assigned_orders';
type OrderStatusFilter = 'all' | 'upcoming' | 'completed' | 'cancelled';

export function ContactDetailView({ contactId }: ContactDetailViewProps) {
  const router = useRouter();
  const contacts = useContacts();

  const [activeTab, setActiveTab] = useState<TabMode>('overview');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [isPrefModalOpen, setIsPrefModalOpen] = useState(false);

  // Filters for assigned orders tab
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatusFilter>('all');
  const [orderSearchQuery, setOrderSearchQuery] = useState('');
  const [orderCustomerFilter, setOrderCustomerFilter] = useState('all');
  const [orderDateFilter, setOrderDateFilter] = useState('all');
  const [orderStatusDropdown, setOrderStatusDropdown] = useState('all');

  const contact = useMemo(() => {
    return (
      contacts.find((c) => c.id === contactId) ||
      contacts.find((c) => c.id.toLowerCase() === contactId.toLowerCase()) ||
      contacts[0]
    );
  }, [contacts, contactId]);

  const isInactive = contact?.status === 'Inactive';

  const handleCall = () => {
    if (!contact) return;
    toast.info(`Calling ${contact.name}`, { description: contact.phone });
  };

  const handleText = () => {
    if (!contact) return;
    toast.info(`Opening SMS with ${contact.name}`, { description: contact.phone });
  };

  const handleEmail = () => {
    if (!contact) return;
    window.location.href = `mailto:${contact.email}`;
  };

  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Contact link copied to clipboard');
    }
  };

  const handleToggleStatus = () => {
    if (!contact) return;
    const newStatus = contact.status === 'Active' ? 'Inactive' : 'Active';
    updateContact(contact.id, { status: newStatus });
    toast.success(`Contact status changed to ${newStatus}`);
  };

  const handleDelete = () => {
    if (!contact) return;
    deleteContact(contact.id);
    toast.success(`Contact ${contact.name} deleted`);
    router.push('/contacts');
  };

  // Filtered assigned orders
  const filteredAssignedOrders = useMemo(() => {
    if (!contact || !contact.assignedOrders) return [];
    return contact.assignedOrders.filter((order) => {
      // Status pill filter
      if (orderStatusFilter === 'upcoming') {
        if (order.status !== 'Confirmed' && order.status !== 'Pending') return false;
      } else if (orderStatusFilter === 'completed') {
        if (order.status !== 'Completed') return false;
      } else if (orderStatusFilter === 'cancelled') {
        if (order.status !== 'Cancelled') return false;
      }

      // Status dropdown filter
      if (orderStatusDropdown !== 'all' && order.status !== orderStatusDropdown) {
        return false;
      }

      // Search query
      if (orderSearchQuery.trim()) {
        const q = orderSearchQuery.toLowerCase().trim();
        const matchId = order.orderId.toLowerCase().includes(q);
        const matchSite = order.jobSite.toLowerCase().includes(q);
        const matchOperator = order.operator.toLowerCase().includes(q);
        if (!matchId && !matchSite && !matchOperator) return false;
      }

      return true;
    });
  }, [contact, orderStatusFilter, orderStatusDropdown, orderSearchQuery]);

  if (!contact) {
    return (
      <div className="p-8 text-center">
        <p className="text-slate-600 font-medium">Contact not found</p>
        <Link href="/contacts" className="text-brand hover:underline text-sm mt-2 inline-block">
          Return to contacts
        </Link>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full max-w-[1600px] mx-auto">
      {/* 1. TOP BACK LINK */}
      <div>
        <Link
          href="/contacts"
          className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-medium text-brand hover:underline"
        >
          <ChevronLeft className="h-4 w-4" />
          <span>Back to contacts</span>
        </Link>
      </div>

      {/* 2. CONTACT HEADER & ACTION BAR */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-100">
        {/* Contact Info Header */}
        <div className="space-y-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
              {contact.name}
            </h1>

            {/* Status Badge */}
            {!isInactive ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                <span>Active</span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                <span>Inactive</span>
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm text-slate-500 font-medium">
            {contact.title} · {contact.company}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCall}
            className="h-9 px-3.5 text-xs font-semibold text-slate-700 bg-white hover:bg-brand-light hover:text-brand hover:border-brand/30 border-slate-200 cursor-pointer shadow-2xs gap-1.5"
          >
            <Phone className="h-3.5 w-3.5 text-brand" />
            <span>Call</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleText}
            className="h-9 px-3.5 text-xs font-semibold text-slate-700 bg-white hover:bg-brand-light hover:text-brand hover:border-brand/30 border-slate-200 cursor-pointer shadow-2xs gap-1.5"
          >
            <MessageSquare className="h-3.5 w-3.5 text-brand" />
            <span>Text</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleEmail}
            className="h-9 px-3.5 text-xs font-semibold text-slate-700 bg-white hover:bg-brand-light hover:text-brand hover:border-brand/30 border-slate-200 cursor-pointer shadow-2xs gap-1.5"
          >
            <Mail className="h-3.5 w-3.5 text-brand" />
            <span>Email</span>
          </Button>

          <Button
            type="button"
            variant="brand"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="h-9 px-3.5 text-xs font-semibold cursor-pointer shadow-xs gap-1.5"
          >
            <Pencil className="h-3.5 w-3.5" />
            <span>Edit contact</span>
          </Button>

          {/* More menu */}
          <DropdownMenu>
            <DropdownMenuTrigger className="h-9 w-9 p-0 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 flex items-center justify-center cursor-pointer shadow-2xs">
              <MoreHorizontal className="h-4 w-4" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48 rounded-xl p-1 shadow-lg border-slate-200">
              <DropdownMenuItem
                onClick={handleCopyLink}
                className="text-xs cursor-pointer flex items-center gap-2 p-2 rounded-lg"
              >
                <Copy className="h-3.5 w-3.5 text-slate-500" />
                <span>Copy contact link</span>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={handleToggleStatus}
                className="text-xs cursor-pointer flex items-center gap-2 p-2 rounded-lg"
              >
                <span className={cn('h-2 w-2 rounded-full', isInactive ? 'bg-emerald-500' : 'bg-slate-400')} />
                <span>Mark as {isInactive ? 'Active' : 'Inactive'}</span>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1" />
              <DropdownMenuItem
                onClick={handleDelete}
                className="text-xs cursor-pointer flex items-center gap-2 p-2 rounded-lg text-red-600 focus:text-red-700 focus:bg-red-50"
              >
                <span>Delete contact</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* 3. TABS: Overview & Assigned orders */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setActiveTab('overview')}
          className={cn(
            'px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer',
            activeTab === 'overview'
              ? 'bg-brand text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
          )}
        >
          Overview
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('assigned_orders')}
          className={cn(
            'px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer',
            activeTab === 'assigned_orders'
              ? 'bg-brand text-white shadow-xs'
              : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
          )}
        >
          Assigned orders
        </button>
      </div>

      {/* 4. TAB CONTENTS */}
      {activeTab === 'overview' ? (
        /* ── OVERVIEW TAB (Figma Screenshot 2 with v2 excluded) ── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 lg:gap-6">
          {/* ── Left Column ── */}
          <div className="space-y-5">
            {/* 1. Contact information card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-4">
              <h3 className="text-sm font-bold text-slate-900">Contact information</h3>

              <div className="divide-y divide-slate-100 text-xs">
                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">First name</span>
                  <span className="font-semibold text-slate-900">{contact.firstName}</span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Last name</span>
                  <span className="font-semibold text-slate-900">{contact.lastName}</span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Title</span>
                  <span className="font-semibold text-slate-900">{contact.title}</span>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Primary phone</span>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-slate-900">{contact.phone}</span>
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 text-[11px] font-medium">
                      {contact.phoneType}
                    </span>
                  </div>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Email</span>
                  <a
                    href={`mailto:${contact.email}`}
                    className="font-medium text-brand hover:underline"
                  >
                    {contact.email}
                  </a>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Tags</span>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {contact.tags?.map((t) => (
                      <span
                        key={t}
                        className="px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 text-[11px] font-medium"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="py-2.5 flex items-center justify-between">
                  <span className="text-slate-500 font-medium">Created</span>
                  <span className="font-medium text-slate-700">{contact.createdAt}</span>
                </div>
              </div>
            </div>

            {/* 2. Linked customer accounts card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Linked customer accounts</h3>
                <button
                  type="button"
                  onClick={() => setIsLinkModalOpen(true)}
                  className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>Link account</span>
                </button>
              </div>

              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="text-xs font-bold text-slate-500 py-2.5">
                        Customer account
                      </TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 py-2.5">
                        Roles
                      </TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 py-2.5 text-left">
                        Actions
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 text-xs">
                    {contact.linkedAccounts?.map((account) => (
                      <TableRow
                        key={account.customerId}
                        onClick={() => router.push(`/customers/${account.customerId}`)}
                        className="hover:bg-slate-50/50 cursor-pointer group"
                      >
                        <TableCell className="font-semibold text-brand py-2.5">
                          <Link
                            href={`/customers/${account.customerId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:underline"
                          >
                            {account.customerName}
                          </Link>
                        </TableCell>
                        <TableCell className="py-2.5">
                          <div className="flex items-center gap-1 flex-wrap">
                            {account.roles.map((r) => (
                              <span
                                key={r}
                                className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/50"
                              >
                                {r}
                              </span>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-left py-2.5">
                          <Link
                            href={`/customers/${account.customerId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
                          >
                            <span>View customer</span>
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <p className="text-[11px] text-slate-400">
                Roles apply to this customer account.
              </p>
            </div>

            {/* 3. Assigned orders (Summary) card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900">Assigned orders</h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('assigned_orders')}
                  className="text-xs font-semibold text-brand hover:underline cursor-pointer"
                >
                  View all
                </button>
              </div>

              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="text-xs font-bold text-slate-500 py-2.5">Order #</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 py-2.5">Job site</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 py-2.5">Date</TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 py-2.5">Status</TableHead>
                      <TableHead className="w-8 py-2.5" />
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 text-xs">
                    {(contact.assignedOrders || []).slice(0, 2).map((order) => (
                      <TableRow
                        key={order.orderId}
                        onClick={() => router.push(`/orders/${order.orderId}`)}
                        className="hover:bg-slate-50/50 cursor-pointer group"
                      >
                        <TableCell className="font-semibold text-brand py-2.5">
                          <Link
                            href={`/orders/${order.orderId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:underline"
                          >
                            {order.orderId}
                          </Link>
                        </TableCell>
                        <TableCell className="text-slate-700 py-2.5">
                          {order.jobSite}
                        </TableCell>
                        <TableCell className="text-slate-600 py-2.5">
                          {order.serviceDate}
                        </TableCell>
                        <TableCell className="py-2.5">
                          <span className="inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                            <span>{order.status}</span>
                          </span>
                        </TableCell>
                        <TableCell className="text-right py-2.5 pr-2">
                          <Link
                            href={`/orders/${order.orderId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-slate-400 hover:text-brand"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>

          {/* ── Right Column ── */}
          <div className="space-y-5">
            {/* 1. Notification preferences card */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Notification preferences</h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    For orders where {contact.firstName} is selected as a recipient.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsPrefModalOpen(true)}
                  className="text-xs font-semibold text-brand hover:underline cursor-pointer shrink-0"
                >
                  Edit preferences
                </button>
              </div>

              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                    <TableRow className="hover:bg-transparent border-slate-100">
                      <TableHead className="text-xs font-bold text-slate-500 py-2.5">
                        Notification
                      </TableHead>
                      <TableHead className="text-xs font-bold text-slate-500 py-2.5 text-right pr-4">
                        Channel
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="divide-y divide-slate-100 text-xs">
                    {(contact.notificationPreferences || []).map((pref) => (
                      <TableRow key={pref.id} className="hover:bg-slate-50/50">
                        <TableCell className="py-2.5">
                          <p className="font-semibold text-slate-900">{pref.title}</p>
                          <p className="text-[11px] text-slate-500 mt-0.5">{pref.description}</p>
                        </TableCell>
                        <TableCell className="py-2.5 text-right pr-4">
                          <span
                            className={cn(
                              'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-semibold border',
                              pref.channel === 'Email'
                                ? 'bg-slate-100 text-slate-700 border-slate-200'
                                : pref.channel === 'Text'
                                ? 'bg-slate-100 text-slate-700 border-slate-200'
                                : 'bg-slate-50 text-slate-400 border-slate-200/60'
                            )}
                          >
                            {pref.channel === 'Email' && <Mail className="h-3 w-3 text-slate-600" />}
                            {pref.channel === 'Text' && <MessageSquare className="h-3 w-3 text-slate-600" />}
                            {pref.channel === 'Off' && <Ban className="h-3 w-3 text-slate-400" />}
                            <span>{pref.channel}</span>
                          </span>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                <Info className="h-3.5 w-3.5 shrink-0" />
                <span>Preferences do not automatically add this contact to every order.</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── ASSIGNED ORDERS TAB (Figma Screenshot 3) ── */
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
          {/* Header */}
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Orders assigned to {contact.firstName}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Only orders where this contact is assigned.
            </p>
          </div>

          {/* Filter Pills */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setOrderStatusFilter('all')}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer',
                orderStatusFilter === 'all'
                  ? 'bg-brand text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              All assigned
            </button>

            <button
              type="button"
              onClick={() => setOrderStatusFilter('upcoming')}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer',
                orderStatusFilter === 'upcoming'
                  ? 'bg-brand text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              Upcoming
            </button>

            <button
              type="button"
              onClick={() => setOrderStatusFilter('completed')}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer',
                orderStatusFilter === 'completed'
                  ? 'bg-brand text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              Completed
            </button>

            <button
              type="button"
              onClick={() => setOrderStatusFilter('cancelled')}
              className={cn(
                'px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer',
                orderStatusFilter === 'cancelled'
                  ? 'bg-brand text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              )}
            >
              Cancelled
            </button>
          </div>

          {/* Search & Filters Row */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 items-center">
            {/* Search Input */}
            <div className="sm:col-span-6 relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
              <Input
                value={orderSearchQuery}
                onChange={(e) => setOrderSearchQuery(e.target.value)}
                placeholder="Search order # or job site"
                className="pl-9.5 pr-4 h-9.5 text-xs sm:text-sm bg-white border-slate-200 rounded-lg shadow-2xs focus-visible:border-brand"
              />
            </div>

            {/* Customer Filter */}
            <div className="sm:col-span-2">
              <AppSelect
                value={orderCustomerFilter}
                onChange={setOrderCustomerFilter}
                options={[
                  { value: 'all', label: 'Customer: All' },
                  { value: contact.company, label: contact.company },
                ]}
                className="h-9.5 text-xs rounded-lg border-slate-200 bg-white"
              />
            </div>

            {/* Date Filter */}
            <div className="sm:col-span-2">
              <AppSelect
                value={orderDateFilter}
                onChange={setOrderDateFilter}
                options={[
                  { value: 'all', label: 'Date: All dates' },
                  { value: 'recent', label: 'Last 30 days' },
                ]}
                className="h-9.5 text-xs rounded-lg border-slate-200 bg-white"
              />
            </div>

            {/* Status Filter */}
            <div className="sm:col-span-2">
              <AppSelect
                value={orderStatusDropdown}
                onChange={setOrderStatusDropdown}
                options={[
                  { value: 'all', label: 'Status: All' },
                  { value: 'Confirmed', label: 'Confirmed' },
                  { value: 'Pending', label: 'Pending' },
                  { value: 'Completed', label: 'Completed' },
                  { value: 'Cancelled', label: 'Cancelled' },
                ]}
                className="h-9.5 text-xs rounded-lg border-slate-200 bg-white"
              />
            </div>
          </div>

          {/* Counter */}
          <div className="pt-1">
            <span className="text-xs font-semibold text-slate-500">
              {filteredAssignedOrders.length} assigned {filteredAssignedOrders.length === 1 ? 'order' : 'orders'}
            </span>
          </div>

          {/* Master Assigned Orders Table */}
          {filteredAssignedOrders.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No assigned orders matching the filter.
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200/90 overflow-hidden shadow-2xs">
              <div className="overflow-x-auto">
                <Table className="min-w-[800px]">
                  <TableHeader className="bg-slate-50/70 border-b border-slate-100">
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      <TableHead className="text-xs font-semibold text-slate-500 pl-4 py-3">Order</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 py-3">
                        Service date &amp; Pour time
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 py-3">Job site</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 py-3">Contact role</TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 py-3">
                        Pump &amp; Operator
                      </TableHead>
                      <TableHead className="text-xs font-semibold text-slate-500 py-3">Job status</TableHead>
                      <TableHead className="w-10 pr-4" />
                    </TableRow>
                  </TableHeader>

                  <TableBody className="divide-y divide-slate-100 text-xs">
                    {filteredAssignedOrders.map((order) => (
                      <TableRow
                        key={order.orderId}
                        onClick={() => router.push(`/orders/${order.orderId}`)}
                        className="hover:bg-slate-50/80 cursor-pointer group"
                      >
                        {/* Order # */}
                        <TableCell className="pl-4 py-3 font-semibold text-brand">
                          <Link
                            href={`/orders/${order.orderId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="hover:underline"
                          >
                            {order.orderId}
                          </Link>
                        </TableCell>

                        {/* Service Date & Pour Time */}
                        <TableCell className="py-3">
                          <p className="font-semibold text-slate-900">{order.serviceDate}</p>
                          <p className="text-[11px] text-slate-500">{order.pourTime}</p>
                        </TableCell>

                        {/* Job Site */}
                        <TableCell className="py-3 font-medium text-slate-700">
                          {order.jobSite}
                        </TableCell>

                        {/* Contact Role */}
                        <TableCell className="py-3">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                            {order.contactRole}
                          </span>
                        </TableCell>

                        {/* Pump & Operator */}
                        <TableCell className="py-3">
                          <p className="font-semibold text-slate-900">{order.pump}</p>
                          <p className="text-[11px] text-slate-500">{order.operator}</p>
                        </TableCell>

                        {/* Job Status */}
                        <TableCell className="py-3">
                          {order.status === 'Confirmed' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              <span>Confirmed</span>
                            </span>
                          )}
                          {order.status === 'Pending' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-700 border border-amber-200/60">
                              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                              <span>Pending</span>
                            </span>
                          )}
                          {order.status === 'Completed' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                              <span>Completed</span>
                            </span>
                          )}
                          {order.status === 'Cancelled' && (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-50 text-red-700 border border-red-200/60">
                              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                              <span>Cancelled</span>
                            </span>
                          )}
                        </TableCell>

                        {/* Chevron */}
                        <TableCell className="py-3 text-right pr-4">
                          <Link
                            href={`/orders/${order.orderId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="text-slate-400 hover:text-brand inline-flex items-center"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Table Footer */}
              <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-slate-500">
                <div className="flex items-center gap-2">
                  <span>Show:</span>
                  <div className="w-28">
                    <AppSelect
                      value="all"
                      onChange={() => {}}
                      options={[{ value: 'all', label: 'All orders' }]}
                      className="h-7 text-xs bg-white border-slate-200 rounded-md"
                    />
                  </div>
                </div>

                <span>Showing all {filteredAssignedOrders.length} assigned orders</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 5. MODALS */}
      <EditContactModal
        key={`edit-${contact.id}`}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        contact={contact}
      />

      <LinkAccountModal
        key={`link-${contact.id}`}
        open={isLinkModalOpen}
        onOpenChange={setIsLinkModalOpen}
        contact={contact}
      />

      <EditNotificationPreferencesModal
        key={`pref-${contact.id}`}
        open={isPrefModalOpen}
        onOpenChange={setIsPrefModalOpen}
        contact={contact}
      />
    </div>
  );
}
