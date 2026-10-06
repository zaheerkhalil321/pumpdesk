'use client';

import { useState, useMemo } from 'react';
import {
  Search,
  Download,
  Plus,
  Filter,
  Phone,
  Mail,
  UserCheck,
  LayoutGrid,
  Table as TableIcon,
  Copy,
  MessageSquare,
  Building2,
  HardHat,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PageHeader } from '@/components/ui/page-header';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useIsMobile, useIsTablet } from '@/hooks/use-mobile';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

const mockContacts = [
  {
    id: 'CONT-201',
    name: 'Rob Black',
    role: 'Superintendent & Partner',
    company: 'Midcoast Concrete Pumping',
    mobile: '(214) 555-0192',
    email: 'rob@midcoastpumping.com',
    activePours: 18,
    status: 'Active',
    statusVariant: 'active',
  },
  {
    id: 'CONT-202',
    name: 'Mike Vance',
    role: 'Lead Field Superintendent',
    company: 'Turner Construction',
    mobile: '(972) 555-8834',
    email: 'mvance@turnerconstruction.com',
    activePours: 14,
    status: 'Active',
    statusVariant: 'active',
  },
  {
    id: 'CONT-203',
    name: 'Sarah Jenkins',
    role: 'Senior Project Manager',
    company: 'Top Tier Commercial',
    mobile: '(469) 555-4311',
    email: 'sjenkins@toptierbuilders.com',
    activePours: 9,
    status: 'Active',
    statusVariant: 'active',
  },
  {
    id: 'CONT-204',
    name: 'Carlos Mendez',
    role: 'Foundation Lead',
    company: 'DFW Foundation Pros',
    mobile: '(817) 555-9012',
    email: 'carlos@dfwfoundation.com',
    activePours: 6,
    status: 'Active',
    statusVariant: 'active',
  },
  {
    id: 'CONT-205',
    name: 'Dave Wilson',
    role: 'Former Lead Superintendent',
    company: 'Lone Star Civil',
    mobile: '(214) 555-7788',
    email: 'dwilson@lonestarcivil.com',
    activePours: 0,
    status: 'Inactive',
    statusVariant: 'inactive',
  },
];

export default function ContactsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyActive, setOnlyActive] = useState(false);

  const isMobile = useIsMobile();
  const isTablet = useIsTablet();
  const [userLayout, setUserLayout] = useState<'table' | 'tiles' | null>(null);
  const currentLayout = userLayout ?? (isMobile || isTablet ? 'tiles' : 'tiles');

  const filteredContacts = useMemo(() => {
    return mockContacts.filter((c) => {
      if (onlyActive && c.statusVariant !== 'active') return false;
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase().trim();
      return (
        c.name.toLowerCase().includes(q) ||
        c.company.toLowerCase().includes(q) ||
        c.role.toLowerCase().includes(q) ||
        c.mobile.includes(q) ||
        c.email.toLowerCase().includes(q)
      );
    });
  }, [searchQuery, onlyActive]);

  const activeCount = useMemo(
    () => mockContacts.filter((c) => c.statusVariant === 'active').length,
    []
  );

  const handleCopy = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`, { description: text });
    }
  };

  const handleCall = (phone: string, name: string) => {
    toast.info(`Calling ${name}`, { description: phone });
  };

  const handleText = (phone: string, name: string) => {
    toast.info(`Opening SMS with ${name}`, { description: phone });
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
      {/* 1. HEADER */}
      <PageHeader
        title="Contacts & Superintendents"
        description="Directory of field superintendents, project managers, and dispatch alert recipients."
        actions={
          <Button
            variant="brand"
            onClick={() => toast.info('New Contact form modal')}
            className="font-semibold gap-1.5 text-sm h-9 px-3.5"
          >
            <Plus className="h-4 w-4" />
            <span>Add New Contact</span>
          </Button>
        }
      />

      {/* 2. FILTER & SEARCH BAR */}
      <div className="bg-white p-2.5 rounded-xl border border-slate-200/90 shadow-2xs flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 sm:gap-3">
        <div className="relative flex-1 group">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none group-focus-within:text-brand transition-colors" />
          <Input
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by contact name, phone, or company..."
            className="pl-9.5 pr-4 h-10 text-xs sm:text-sm bg-slate-50/50 border-slate-200 focus-visible:bg-white focus-visible:border-brand outline-none rounded-lg shadow-none transition-all placeholder:text-slate-400"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end shrink-0">
          {/* Active Filter Toggle */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => setOnlyActive((prev) => !prev)}
            className={cn(
              'h-9 px-2.5 sm:px-3 text-xs font-semibold gap-1.5 shrink-0 transition-colors',
              onlyActive
                ? 'bg-brand-light text-brand border-brand/30'
                : 'text-slate-600 border-slate-200 bg-white hover:bg-slate-50'
            )}
          >
            <Filter className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Active Contacts</span>
            <span className="sm:hidden">Active</span>
            <span className="px-1.5 py-0.2 rounded-md bg-slate-100 text-[10.5px] font-bold text-slate-700">
              {activeCount}/{mockContacts.length}
            </span>
          </Button>

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
        </div>
      </div>

      {/* 3. CONTACTS CONTENT: TILES vs TABLE */}
      {filteredContacts.length === 0 ? (
        <div className="rounded-2xl border border-slate-200/90 bg-white shadow-2xs py-14 px-4 text-center text-slate-400">
          <div className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center mx-auto mb-3 text-slate-400">
            <Search className="h-5 w-5" />
          </div>
          <p className="text-sm font-semibold text-slate-700">No contacts found</p>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchQuery
              ? `No matching records found for "${searchQuery}".`
              : 'No contact records available.'}
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
          {filteredContacts.map((contact) => {
            const isInactive = contact.statusVariant === 'inactive';

            return (
              <div
                key={contact.id}
                className={cn(
                  'group relative bg-white rounded-2xl border transition-all duration-200 flex flex-col justify-between shadow-2xs hover:shadow-md hover:border-brand/40 overflow-hidden',
                  isInactive
                    ? 'border-slate-200/60 bg-slate-50/40 opacity-90'
                    : 'border-slate-200/90'
                )}
              >
                <div className="p-4 sm:p-4.5 space-y-3">
                  {/* Top Header: Monogram Avatar + Contact Name + Status Badge */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          'h-10 w-10 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors shadow-2xs',
                          isInactive
                            ? 'bg-slate-100 text-slate-500 border border-slate-200'
                            : 'bg-slate-100 border border-slate-200/90 text-slate-800 group-hover:bg-brand-light group-hover:border-brand/40 group-hover:text-brand'
                        )}
                      >
                        {getInitials(contact.name)}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="font-mono text-[10.5px] font-bold text-slate-400 bg-slate-100/90 px-1.5 py-0.5 rounded">
                            #{contact.id}
                          </span>
                        </div>
                        <h3 className="font-bold text-sm text-slate-900 group-hover:text-brand transition-colors truncate mt-0.5">
                          {contact.name}
                        </h3>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {!isInactive ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-brand-light text-brand border border-brand/25 shadow-2xs">
                          <span className="h-1.5 w-1.5 rounded-full bg-brand animate-pulse" />
                          <span>Active</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
                          <span>Inactive</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Company & Role Details */}
                  <div className="space-y-1.5 pt-0.5 text-xs">
                    <div className="flex items-center gap-2 text-slate-700 min-w-0 font-medium">
                      <Building2 className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{contact.company}</span>
                    </div>

                    <div className="flex items-center gap-2 text-slate-500 min-w-0 text-[11.5px]">
                      <HardHat className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">{contact.role}</span>
                    </div>

                    {/* Mobile with copy */}
                    <div className="flex items-center justify-between text-xs pt-1">
                      <div
                        className="flex items-center gap-2 text-slate-700 font-mono text-[11.5px] cursor-pointer hover:text-brand transition-colors"
                        onClick={() => handleCopy(contact.mobile, 'Phone')}
                        title="Click to copy phone"
                      >
                        <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                        <span>{contact.mobile}</span>
                        <Copy className="h-3 w-3 text-slate-400 hover:text-brand" />
                      </div>

                      {/* Active Pours Badge */}
                      <div className="flex items-center gap-1 text-[11px] font-medium text-slate-500 bg-slate-50 px-2 py-0.5 rounded-md border border-slate-200/60">
                        <UserCheck className="h-3 w-3 text-brand shrink-0" />
                        <span>{contact.activePours} pours</span>
                      </div>
                    </div>

                    {/* Email */}
                    <div className="flex items-center gap-2 text-slate-500 truncate text-[11.5px]">
                      <Mail className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <a
                        href={`mailto:${contact.email}`}
                        className="hover:underline hover:text-brand truncate"
                      >
                        {contact.email}
                      </a>
                    </div>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div className="px-4 py-2.5 bg-slate-50/70 border-t border-slate-100 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleCall(contact.mobile, contact.name)}
                      className="h-7.5 px-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-brand-light hover:text-brand hover:border-brand/30 border-slate-200 cursor-pointer shadow-2xs gap-1.5 transition-colors"
                    >
                      <Phone className="h-3 w-3 text-brand" />
                      <span>Call</span>
                    </Button>

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => handleText(contact.mobile, contact.name)}
                      className="h-7.5 px-2.5 text-xs font-semibold text-slate-700 bg-white hover:bg-brand-light hover:text-brand hover:border-brand/30 border-slate-200 cursor-pointer shadow-2xs gap-1.5 transition-colors"
                    >
                      <MessageSquare className="h-3 w-3 text-brand" />
                      <span>Text</span>
                    </Button>
                  </div>

                  <a
                    href={`mailto:${contact.email}`}
                    className="text-xs font-semibold text-slate-600 hover:text-brand hover:underline inline-flex items-center gap-1"
                  >
                    <Mail className="h-3.5 w-3.5 text-slate-400 group-hover:text-brand" />
                    <span>Email</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200/90 bg-white overflow-hidden shadow-xs">
          <Table>
            <TableHeader className="bg-slate-50/70">
              <TableRow className="border-slate-100">
                <TableHead className="text-xs font-bold text-slate-500">Contact Name</TableHead>
                <TableHead className="text-xs font-bold text-slate-500">Role &amp; Company</TableHead>
                <TableHead className="text-xs font-bold text-slate-500">Direct Mobile</TableHead>
                <TableHead className="text-xs font-bold text-slate-500">Work Email</TableHead>
                <TableHead className="text-xs font-bold text-slate-500">Pours Logged</TableHead>
                <TableHead className="w-24 text-right text-xs font-bold text-slate-500">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-slate-100">
              {filteredContacts.map((contact) => {
                const isInactive = contact.statusVariant === 'inactive';

                return (
                  <TableRow
                    key={contact.id}
                    className={cn(
                      'hover:bg-slate-50/80 transition-colors cursor-pointer border-slate-100 group',
                      isInactive ? 'opacity-60 bg-slate-50/40 text-slate-500' : ''
                    )}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2.5">
                        <div className="h-8 w-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs group-hover:bg-brand-light group-hover:text-brand transition-colors">
                          {getInitials(contact.name)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-semibold text-xs text-slate-900 group-hover:text-brand transition-colors">
                            {contact.name}
                          </span>
                          <span className="text-[10.5px] font-mono text-slate-400">{contact.id}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-medium text-slate-800">{contact.company}</span>
                        <span className="text-[11px] text-slate-400">{contact.role}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-xs font-mono text-slate-700">
                      <span className="flex items-center gap-1.5">
                        <Phone className="h-3 w-3 text-brand" />
                        {contact.mobile}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-slate-500">
                      <span className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3 text-brand" />
                        {contact.email}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold text-slate-900 font-mono">
                      {contact.activePours}
                    </TableCell>
                    <TableCell className="text-right">
                      <span
                        className={cn(
                          'inline-flex items-center px-2 py-0.5 rounded-full text-[10.5px] font-bold',
                          contact.statusVariant === 'active'
                            ? 'bg-brand-light text-brand border border-brand/25'
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                        )}
                      >
                        ● {contact.status}
                      </span>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>

          {/* 4. FOOTER WITH CSV EXPORT */}
          <div className="p-3 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs text-slate-500">
            <span>Showing {filteredContacts.length} field superintendents</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => toast.info('Exporting contacts CSV')}
              className="h-7 text-xs font-medium gap-1 text-slate-600 hover:text-slate-900 cursor-pointer"
            >
              <Download className="h-3.5 w-3.5" />
              <span>Export CSV</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
