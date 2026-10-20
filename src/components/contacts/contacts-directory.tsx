'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Search,
  Plus,
  Phone,
  MessageSquare,
  ChevronRight,
  LayoutGrid,
  Table as TableIcon,
  X,
  Copy,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import { AppSelect } from '@/components/ui/app-select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import type { ContactItem, CustomerOption } from '@/features/crm/types';
import { ContactTileCard } from '@/components/contacts/contact-tile-card';
import { NewContactModal } from '@/components/contacts/new-contact-modal';

type StatusTab = 'all' | 'active' | 'inactive';
type SortOption = 'name_asc' | 'name_desc' | 'customer_asc';
type ViewLayout = 'table' | 'tiles';

const ROLE_FILTER_OPTIONS = [
  { value: 'all', label: 'Role: All' },
  { value: 'Primary', label: 'Primary' },
  { value: 'Site', label: 'Site' },
  { value: 'Invoicing', label: 'Invoicing' },
  { value: 'Primary + Site', label: 'Primary + Site' },
];

const SORT_OPTIONS = [
  { value: 'name_asc', label: 'Name A – Z' },
  { value: 'name_desc', label: 'Name Z – A' },
  { value: 'customer_asc', label: 'Customer' },
];

export function ContactsDirectory({
  contacts,
  customerOptions,
}: {
  contacts: ContactItem[];
  customerOptions: CustomerOption[];
}) {
  const router = useRouter();
  const customerFilterOptions = [{ value: 'all', label: 'Customer: All' }, ...customerOptions];

  const [statusTab, setStatusTab] = useState<StatusTab>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [customerFilter, setCustomerFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [sortBy, setSortBy] = useState<SortOption>('name_asc');

  const [isNewContactOpen, setIsNewContactOpen] = useState(false);

  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [userLayout, setUserLayout] = useState<ViewLayout | null>(null);
  const currentLayout: ViewLayout = userLayout ?? (isMobile || isTablet ? 'tiles' : 'table');

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

  const activeCount = useMemo(() => contacts.filter((c) => c.status === 'Active').length, [contacts]);
  const inactiveCount = useMemo(() => contacts.filter((c) => c.status === 'Inactive').length, [contacts]);

  const filteredContacts = useMemo(() => {
    return contacts
      .filter((contact) => {
        // Status filter
        if (statusTab === 'active' && contact.status !== 'Active') return false;
        if (statusTab === 'inactive' && contact.status !== 'Inactive') return false;

        // Customer filter
        if (
          customerFilter !== 'all' &&
          !contact.linkedAccounts.some((a) => a.customerId === customerFilter)
        ) {
          return false;
        }

        // Role filter
        if (roleFilter !== 'all') {
          if (roleFilter === 'Primary + Site') {
            if (contact.roleDisplay !== 'Primary + Site') return false;
          } else if (roleFilter === 'Primary') {
            if (!contact.roles.includes('Primary contact') && contact.roleDisplay !== 'Primary') {
              return false;
            }
          } else if (roleFilter === 'Site') {
            if (!contact.roles.includes('Site contact') && contact.roleDisplay !== 'Site') {
              return false;
            }
          } else if (roleFilter === 'Invoicing') {
            if (!contact.roles.includes('Invoicing') && contact.roleDisplay !== 'Invoicing') {
              return false;
            }
          }
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchName = contact.name.toLowerCase().includes(q);
          const matchCompany = contact.company.toLowerCase().includes(q);
          const matchPhone = contact.phone.includes(q);
          const matchEmail = contact.email.toLowerCase().includes(q);
          const matchTitle = contact.title.toLowerCase().includes(q);
          if (!matchName && !matchCompany && !matchPhone && !matchEmail && !matchTitle) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name_asc') {
          return a.name.localeCompare(b.name);
        }
        if (sortBy === 'name_desc') {
          return b.name.localeCompare(a.name);
        }
        if (sortBy === 'customer_asc') {
          return a.company.localeCompare(b.company);
        }
        return 0;
      });
  }, [contacts, statusTab, customerFilter, roleFilter, searchQuery, sortBy]);

  const handleCall = (e: React.MouseEvent, phone: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info(`Calling ${name}`, { description: phone });
  };

  const handleText = (e: React.MouseEvent, phone: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    toast.info(`Opening SMS with ${name}`, { description: phone });
  };

  const handleCopyPhone = (e: React.MouseEvent, phone: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(phone);
      toast.success('Phone copied to clipboard', {
        description: `${phone} (${name})`,
      });
    }
  };

  const handleCopyEmail = (e: React.MouseEvent, email: string, name: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(email);
      toast.success('Email copied to clipboard', {
        description: `${email} (${name})`,
      });
    }
  };

  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 w-full">
      {/* ── 1. Page Header (Matching Customers Page Header) ── */}
      <PageHeader
        title="Contacts"
        description="Find the right person for a job or invoice."
        actions={
          <Button
            variant="brand"
            onClick={() => setIsNewContactOpen(true)}
            className="font-semibold gap-1.5 text-sm h-9 px-3.5"
          >
            <Plus className="h-4 w-4" />
            <span>New contact</span>
          </Button>
        }
      />

      {/* ── 2. Filters & Search Control Bar (Matching Customers Page Pattern) ── */}
      <div className="space-y-3">
        {/* Status Filter Tabs */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-slate-100/90 border border-slate-200/60 w-full sm:w-fit overflow-x-auto">
            <button
              type="button"
              onClick={() => setStatusTab('all')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5',
                statusTab === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              )}
            >
              <span>All contacts</span>
              <span className="px-1.5 py-0.2 rounded-md bg-slate-200/70 text-[10.5px] font-bold text-slate-700">
                {contacts.length}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setStatusTab('active')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5',
                statusTab === 'active'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
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
              onClick={() => setStatusTab('inactive')}
              className={cn(
                'px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer select-none flex items-center gap-1.5',
                statusTab === 'inactive'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
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
            <span>Showing {filteredContacts.length} of {contacts.length} contacts</span>
          </div>
        </div>

        {/* Search Bar & Dropdowns Row */}
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

          {/* Controls: Customer Filter, Role Filter, View Layout, Sort */}
          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0 flex-wrap">
            {/* Customer Dropdown Filter */}
            <div className="w-36 sm:w-44 shrink-0">
              <AppSelect
                size="sm"
                value={customerFilter}
                onChange={setCustomerFilter}
                options={customerFilterOptions}
              />
            </div>

            {/* Role Dropdown Filter */}
            <div className="w-32 sm:w-36 shrink-0">
              <AppSelect
                size="sm"
                value={roleFilter}
                onChange={setRoleFilter}
                options={ROLE_FILTER_OPTIONS}
              />
            </div>

            {/* View Mode Switcher: Tiles vs Table */}
            <div className="inline-flex items-center rounded-lg border border-slate-200 bg-slate-100/80 p-0.5 shadow-2xs shrink-0">
              <button
                type="button"
                onClick={() => setUserLayout('tiles')}
                className={cn(
                  'px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer',
                  currentLayout === 'tiles'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
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
                  'px-2.5 py-1 text-xs font-semibold rounded-md flex items-center gap-1.5 transition-all cursor-pointer',
                  currentLayout === 'table'
                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                    : 'text-slate-600 hover:text-slate-900'
                )}
                title="Table view"
                aria-label="Table view"
              >
                <TableIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Table</span>
              </button>
            </div>

            {/* Sort Selector */}
            <div className="w-36 sm:w-40 shrink-0">
              <AppSelect
                size="sm"
                value={sortBy}
                onChange={(val) => setSortBy(val as SortOption)}
                options={SORT_OPTIONS}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── 3. Contacts Master Directory (Tiles Grid vs Table) ── */}
      {filteredContacts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs py-14 px-4 text-center text-slate-400">
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No contacts found</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No matching records found for "${searchQuery}". Check spelling or try a different filter.`
              : 'Try adjusting your filters.'}
          </p>
          {(searchQuery || customerFilter !== 'all' || roleFilter !== 'all' || statusTab !== 'all') && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchQuery('');
                setCustomerFilter('all');
                setRoleFilter('all');
                setStatusTab('all');
              }}
              className="mt-3.5 h-8 text-xs font-semibold cursor-pointer"
            >
              Reset filters
            </Button>
          )}
        </div>
      ) : currentLayout === 'tiles' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-3.5 sm:gap-4">
          {filteredContacts.map((contact) => (
            <ContactTileCard key={contact.id} contact={contact} />
          ))}
        </div>
      ) : (
        /* Master Table — styled exactly as Customers Master Table */
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/70 text-slate-500 font-semibold select-none">
                  <th className="py-3 px-4 sm:px-6 w-[24%]">Contact</th>
                  <th className="py-3 px-4 w-[20%]">Customer account</th>
                  <th className="py-3 px-4 w-[14%]">Role</th>
                  <th className="py-3 px-4 w-[20%]">Phone &amp; email</th>
                  <th className="py-3 px-4 w-[10%]">Status</th>
                  <th className="py-3 px-4 text-left sm:pr-6 w-[12%]">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredContacts.map((contact) => {
                  const isInactive = contact.status === 'Inactive';

                  return (
                    <tr
                      key={contact.id}
                      onClick={() => router.push(`/contacts/${contact.id}`)}
                      className={cn(
                        'hover:bg-slate-50/80 transition-colors group cursor-pointer',
                        isInactive ? 'opacity-70 bg-slate-50/30' : ''
                      )}
                    >
                      {/* 1. Contact (Name & Title with Monogram Avatar) */}
                      <td className="py-3.5 px-4 sm:px-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8.5 w-8.5 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0 group-hover:border-brand/40 group-hover:bg-brand-light/50 group-hover:text-brand transition-colors">
                            {getInitials(contact.name)}
                          </div>
                          <div className="flex flex-col min-w-0">
                            <Link
                              href={`/contacts/${contact.id}`}
                              onClick={(e) => e.stopPropagation()}
                              className="font-semibold text-slate-900 group-hover:text-brand underline underline-offset-2 transition-colors truncate"
                            >
                              {contact.name}
                            </Link>
                            <span className="text-[11px] text-slate-500 mt-0.5 truncate">
                              {contact.title}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* 2. Customer Account */}
                      <td className="py-3.5 px-4">
                        {contact.customerId ? (
                          <Link
                            href={`/customers/${contact.customerId}`}
                            onClick={(e) => e.stopPropagation()}
                            className="font-medium text-slate-900 hover:text-brand hover:underline transition-colors"
                          >
                            {contact.company}
                          </Link>
                        ) : (
                          <span className="text-slate-400">{contact.company}</span>
                        )}
                      </td>

                      {/* 3. Role */}
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200/60">
                          {contact.roleDisplay}
                        </span>
                      </td>

                      {/* 4. Phone & Email */}
                      <td className="py-3.5 px-4">
                        <div className="flex flex-col text-xs space-y-1">
                          <button
                            type="button"
                            onClick={(e) => handleCopyPhone(e, contact.phone, contact.name)}
                            className="inline-flex items-center gap-1.5 text-slate-700 hover:text-brand font-mono text-xs cursor-pointer group/phone text-left"
                            title="Click to copy phone"
                          >
                            <span>{contact.phone}</span>
                            <Copy className="h-3 w-3 opacity-0 group-hover/phone:opacity-100 text-slate-400 transition-opacity" />
                          </button>
                          <div className="inline-flex items-center gap-1.5 group/email">
                            <a
                              href={`mailto:${contact.email}`}
                              onClick={(e) => e.stopPropagation()}
                              className="text-slate-500 hover:text-slate-900 hover:underline transition-colors truncate max-w-[200px]"
                              title={`Send email to ${contact.email}`}
                            >
                              {contact.email}
                            </a>
                            <button
                              type="button"
                              onClick={(e) => handleCopyEmail(e, contact.email, contact.name)}
                              className="opacity-0 group-hover/email:opacity-100 p-0.5 hover:bg-slate-200/60 rounded text-slate-400 hover:text-slate-700 transition-all cursor-pointer"
                              title="Copy email address"
                            >
                              <Copy className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </td>

                      {/* 5. Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {!isInactive ? (
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

                      {/* 6. Actions Column — Left/Start aligned */}
                      <td
                        className="py-3.5 px-4 text-left sm:pr-6 whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <div className="inline-flex items-center justify-start gap-1.5">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleCall(e, contact.phone, contact.name)}
                            className="h-8 px-2.5 text-xs font-medium text-slate-700 border-slate-200 bg-white hover:bg-brand-light hover:text-brand hover:border-brand/30 cursor-pointer shadow-2xs gap-1.5 transition-all"
                            title={`Call ${contact.phone}`}
                          >
                            <Phone className="h-3.5 w-3.5 text-brand" />
                            <span>Call</span>
                          </Button>

                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleText(e, contact.phone, contact.name)}
                            className="h-8 px-2.5 text-xs font-medium text-slate-700 border-slate-200 bg-white hover:bg-brand-light hover:text-brand hover:border-brand/30 cursor-pointer shadow-2xs gap-1.5 transition-all"
                            title={`Text ${contact.phone}`}
                          >
                            <MessageSquare className="h-3.5 w-3.5 text-brand" />
                            <span>Text</span>
                          </Button>

                          <Link
                            href={`/contacts/${contact.id}`}
                            className="h-8 w-8 rounded-lg flex items-center justify-center text-slate-400 hover:text-brand hover:bg-brand-light transition-colors ml-0.5"
                            title="View contact details"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 4. Modals ── */}
      <NewContactModal
        open={isNewContactOpen}
        onOpenChange={setIsNewContactOpen}
        customerOptions={customerOptions}
      />
    </div>
  );
}
