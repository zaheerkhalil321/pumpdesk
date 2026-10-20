'use client';

import React, { useState, useTransition } from 'react';
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
  Copy,
  Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { unlinkContactFromCustomer, updateContact } from '@/features/crm/server/actions';
import { reportAction } from '@/features/crm/action-feedback';
import type { ContactItem, CustomerOption } from '@/features/crm/types';
import { EditContactModal } from '@/components/contacts/edit-contact-modal';
import { LinkAccountModal } from '@/components/contacts/link-account-modal';

interface ContactDetailViewProps {
  contact: ContactItem;
  customerOptions: CustomerOption[];
}

type TabMode = 'overview' | 'assigned_orders';

export function ContactDetailView({ contact, customerOptions }: ContactDetailViewProps) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const refresh = () => router.refresh();

  const [activeTab, setActiveTab] = useState<TabMode>('overview');

  // Modals state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);

  const isInactive = contact.status === 'Inactive';

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
    startSaving(async () => {
      const result = await updateContact({
        id: contact.id,
        firstName: contact.firstName,
        lastName: contact.lastName,
        jobTitle: contact.title,
        email: contact.email,
        phone: contact.phone,
        phoneType: contact.phoneType,
        isActive: isInactive,
      });
      if (!reportAction(result, { entity: 'contact', refresh })) return;
      toast.success(`Contact status changed to ${isInactive ? 'Active' : 'Inactive'}`);
    });
  };

  const handleUnlink = (linkId: string, customerName: string) => {
    startSaving(async () => {
      const result = await unlinkContactFromCustomer({ linkId });
      if (!reportAction(result, { entity: 'contact', refresh })) return;
      toast.success(`Unlinked ${customerName}`);
    });
  };

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
            {[contact.title, contact.company].filter(Boolean).join(' · ')}
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
                disabled={isSaving}
                className="text-xs cursor-pointer flex items-center gap-2 p-2 rounded-lg"
              >
                <span className={cn('h-2 w-2 rounded-full', isInactive ? 'bg-emerald-500' : 'bg-slate-400')} />
                <span>Mark as {isInactive ? 'Active' : 'Inactive'}</span>
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
                    {contact.linkedAccounts.map((account) => (
                      <TableRow
                        key={account.linkId}
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
                          <div className="flex items-center gap-3">
                            <Link
                              href={`/customers/${account.customerId}`}
                              onClick={(e) => e.stopPropagation()}
                              className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
                            >
                              <span>View customer</span>
                              <ChevronRight className="h-3 w-3" />
                            </Link>
                            <button
                              type="button"
                              disabled={isSaving}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleUnlink(account.linkId, account.customerName);
                              }}
                              className="font-semibold text-slate-500 hover:text-red-600 hover:underline cursor-pointer"
                            >
                              Unlink
                            </button>
                          </div>
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

              <p className="text-xs text-slate-400 italic py-1">
                No orders yet. Orders for this contact appear here once booking is live.
              </p>
            </div>
          </div>

          {/* ── Right Column ── */}
          <div className="space-y-5">
            {/* 1. Notification preferences (not saved in V1) */}
            <div className="bg-white rounded-2xl border border-slate-200/90 p-5 shadow-2xs space-y-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Notification preferences</h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  For orders where {contact.firstName} is selected as a recipient.
                </p>
              </div>
              <p className="text-xs text-slate-400 italic py-1">
                Notification preferences are coming with dispatch messaging.
              </p>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 pt-1">
                <Info className="h-3.5 w-3.5 shrink-0" />
                <span>Preferences do not automatically add this contact to every order.</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* ── ASSIGNED ORDERS TAB (fills in once booking is live) ── */
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-3">
          <div>
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Orders assigned to {contact.firstName}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Only orders where this contact is assigned.
            </p>
          </div>
          <div className="text-center py-12 text-slate-400 text-xs">
            No assigned orders yet.
          </div>
        </div>
      )}

      {/* 5. MODALS */}
      <EditContactModal
        key={`edit-${contact.id}-${isEditModalOpen}`}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        contact={contact}
      />

      <LinkAccountModal
        key={`link-${contact.id}`}
        open={isLinkModalOpen}
        onOpenChange={setIsLinkModalOpen}
        contact={contact}
        customerOptions={customerOptions.filter(
          (c) => !contact.linkedAccounts.some((a) => a.customerId === c.value),
        )}
      />
    </div>
  );
}
