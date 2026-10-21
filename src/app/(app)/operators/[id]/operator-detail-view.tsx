'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  ChevronRight,
  Phone,
  MessageSquare,
  Pencil,
  AlertTriangle,
  Copy,
  UserCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import type { BranchOption, OperatorItem, PumpItem } from '@/features/fleet/types';
import { EditOperatorModal } from '@/components/operators/edit-operator-modal';

interface OperatorDetailViewProps {
  operator: OperatorItem;
  pumps: PumpItem[];
  branchOptions: BranchOption[];
}

export function OperatorDetailView({ operator, pumps, branchOptions }: OperatorDetailViewProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleCopy = (text: string, label: string) => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success(`${label} copied to clipboard`, { description: text });
    }
  };

  const handleCall = () => {
    toast.info(`Calling ${operator.name}`, { description: operator.phone });
  };

  const handleText = () => {
    toast.info(`Opening SMS with ${operator.name}`, { description: operator.phone });
  };

  const isActive = operator.status === 'Active';

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-5 sm:space-y-6 max-w-6xl w-full">
      {/* ── 1. Top Breadcrumbs ── */}
      <nav className="flex items-center gap-1.5 text-xs font-medium text-slate-500">
        <Link
          href="/operators"
          className="hover:text-slate-900 hover:underline transition-colors"
        >
          Operators
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-400 shrink-0" />
        <span className="text-slate-900 font-semibold truncate">{operator.name}</span>
      </nav>

      {/* ── 2. Header: Name + Active Badge + Actions ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Operator Name & Status */}
        <div className="flex items-center gap-3 flex-wrap">
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            {operator.name}
          </h1>

          {isActive ? (
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
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleCall}
            className="h-9 px-3 text-xs font-semibold text-slate-700 border-slate-200 bg-white hover:bg-brand-light hover:text-brand hover:border-brand/30 cursor-pointer shadow-2xs gap-1.5 transition-all"
          >
            <Phone className="h-3.5 w-3.5 text-brand" />
            <span>Call</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleText}
            className="h-9 px-3 text-xs font-semibold text-slate-700 border-slate-200 bg-white hover:bg-brand-light hover:text-brand hover:border-brand/30 cursor-pointer shadow-2xs gap-1.5 transition-all"
          >
            <MessageSquare className="h-3.5 w-3.5 text-brand" />
            <span>Text</span>
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setIsEditModalOpen(true)}
            className="h-9 px-3.5 text-xs font-semibold text-slate-700 border-slate-200 bg-white hover:bg-slate-50 cursor-pointer shadow-2xs gap-1.5 transition-all"
          >
            <Pencil className="h-3.5 w-3.5 text-slate-500" />
            <span>Edit profile</span>
          </Button>
        </div>
      </div>

      {/* ── 3. Credential Alert Banner (Figma Image 2) ── */}
      {operator.credentialAlert && (
        <div className="p-3 sm:p-3.5 rounded-xl bg-amber-50/80 border border-amber-200/90 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 shadow-2xs">
          <div className="flex items-center gap-2.5 text-xs sm:text-sm text-amber-950 font-medium">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>
              <strong className="font-semibold">{operator.credentialAlert.title}</strong> &bull; {operator.credentialAlert.date}
            </span>
          </div>

          <button
            type="button"
            onClick={() => toast.info('Review credential details in driver file')}
            className="text-xs font-semibold text-amber-900 hover:text-amber-950 hover:underline inline-flex items-center gap-1 cursor-pointer self-start sm:self-auto shrink-0"
          >
            <span>Review credential</span>
            <ChevronRight className="h-3 w-3" />
          </button>
        </div>
      )}

      {/* ── 4. Profile Tab (Figma Image 2: Credentials and Work history hidden as requested) ── */}
      <div className="flex items-center gap-2 border-b border-slate-200/80 pt-1">
        <button
          type="button"
          className="px-4 py-2 text-xs font-bold text-brand border-b-2 border-brand bg-brand-light/40 rounded-t-lg transition-colors cursor-pointer select-none"
        >
          Profile
        </button>
      </div>

      {/* ── 5. Main Cards (Credentials, Work history & Time & availability excluded as requested) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Card 1: Contact & Assignment */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <h2 className="text-sm sm:text-base font-bold text-slate-900">
              Contact &amp; assignment
            </h2>
            <span className="text-[11px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
              {operator.role}
            </span>
          </div>

          <div className="divide-y divide-slate-100 text-xs sm:text-sm">
            {/* Phone */}
            <div className="py-3 flex items-center justify-between gap-4">
              <span className="text-slate-500 font-medium">Phone</span>
              <button
                type="button"
                onClick={() => handleCopy(operator.phone, 'Phone number')}
                className="font-mono text-slate-900 hover:text-brand font-medium inline-flex items-center gap-1.5 cursor-pointer group/phone text-right"
                title="Click to copy phone"
              >
                <span>{operator.phone}</span>
                <Copy className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover/phone:opacity-100 transition-opacity" />
              </button>
            </div>

            {/* Email */}
            <div className="py-3 flex items-center justify-between gap-4">
              <span className="text-slate-500 font-medium">Email</span>
              <a
                href={`mailto:${operator.email}`}
                className="text-slate-900 hover:text-brand hover:underline font-medium text-right truncate max-w-[260px]"
                title={`Send email to ${operator.email}`}
              >
                {operator.email}
              </a>
            </div>

            {/* Branch */}
            <div className="py-3 flex items-center justify-between gap-4">
              <span className="text-slate-500 font-medium">Branch</span>
              <span className="text-slate-900 font-medium text-right">
                {operator.branch || 'Not set'}
              </span>
            </div>

            {/* Default Pump */}
            <div className="py-3 flex items-center justify-between gap-4">
              <span className="text-slate-500 font-medium">Default pump</span>
              {operator.defaultPump && operator.defaultPump !== 'None' && operator.defaultPump !== 'No default pump' ? (
                <span className="font-semibold text-slate-900 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200/80 text-xs">
                  {operator.defaultPump}
                </span>
              ) : (
                <span className="text-slate-500 text-xs px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200/60 font-medium">
                  None (Unassigned)
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Card 2: Emergency Contacts */}
        <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center gap-2">
              <h2 className="text-sm sm:text-base font-bold text-slate-900">
                Emergency contacts
              </h2>
              {operator.emergencyContacts && operator.emergencyContacts.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                  {operator.emergencyContacts.length}
                </span>
              )}
            </div>
            <UserCheck className="h-4 w-4 text-slate-400" />
          </div>

          {operator.emergencyContacts && operator.emergencyContacts.length > 0 ? (
            <div className="divide-y divide-slate-100 space-y-3">
              {operator.emergencyContacts.map((contact, index) => (
                <div key={index} className={index > 0 ? 'pt-3 space-y-2' : 'space-y-2'}>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">
                      {contact.name || 'Not provided'}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {index === 0 && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                          Primary
                        </span>
                      )}
                      {contact.relationship && contact.relationship !== 'Not provided' && (
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200/60">
                          {contact.relationship}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="text-slate-500 font-medium">Emergency Phone</span>
                    {contact.phone && contact.phone !== 'Not provided' ? (
                      <button
                        type="button"
                        onClick={() => handleCopy(contact.phone, `${contact.name}'s phone`)}
                        className="font-mono text-slate-900 hover:text-brand font-medium inline-flex items-center gap-1.5 cursor-pointer group/em text-right"
                        title="Click to copy emergency phone"
                      >
                        <span>{contact.phone}</span>
                        <Copy className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover/em:opacity-100 transition-opacity" />
                      </button>
                    ) : (
                      <span className="text-slate-400 font-medium text-right">Not provided</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : operator.emergencyContact && operator.emergencyContact.name !== 'Not provided' ? (
            <div className="divide-y divide-slate-100 text-xs sm:text-sm">
              <div className="py-3 flex items-center justify-between gap-4">
                <span className="text-slate-500 font-medium">Name</span>
                <span className="text-slate-900 font-medium text-right">
                  {operator.emergencyContact.name}
                </span>
              </div>
              <div className="py-3 flex items-center justify-between gap-4">
                <span className="text-slate-500 font-medium">Relationship</span>
                <span className="text-slate-900 font-medium text-right">
                  {operator.emergencyContact.relationship || 'Not provided'}
                </span>
              </div>
              <div className="py-3 flex items-center justify-between gap-4">
                <span className="text-slate-500 font-medium">Phone</span>
                {operator.emergencyContact.phone && operator.emergencyContact.phone !== 'Not provided' ? (
                  <button
                    type="button"
                    onClick={() => handleCopy(operator.emergencyContact.phone, 'Emergency phone')}
                    className="font-mono text-slate-900 hover:text-brand font-medium inline-flex items-center gap-1.5 cursor-pointer group/em text-right"
                    title="Click to copy emergency phone"
                  >
                    <span>{operator.emergencyContact.phone}</span>
                    <Copy className="h-3.5 w-3.5 text-slate-400 opacity-0 group-hover/em:opacity-100 transition-opacity" />
                  </button>
                ) : (
                  <span className="text-slate-400 font-medium text-right">Not provided</span>
                )}
              </div>
            </div>
          ) : (
            <div className="py-6 text-center text-xs text-slate-500">
              <p>No emergency contacts on file.</p>
              <p className="text-[11px] text-slate-400 mt-1">Emergency contacts are coming in a later release.</p>
            </div>
          )}
        </div>
      </div>

      {/* ── 5. Edit Operator Modal ── */}
      <EditOperatorModal
        operator={operator}
        open={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        pumps={pumps}
        branchOptions={branchOptions}
      />
    </div>
  );
}
