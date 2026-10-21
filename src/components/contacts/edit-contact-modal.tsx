'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppSelect } from '@/components/ui/app-select';
import { StatusSwitch } from '@/components/ui/status-switch';
import { SegmentedControl } from '@/components/ui/segmented-control';
import { toast } from 'sonner';
import { cn, formatUSPhone } from '@/lib/utils';
import { updateContact, updateContactLink } from '@/features/crm/server/actions';
import { updateContactSchema } from '@/features/crm/schemas';
import { reportAction } from '@/lib/action-feedback';
import { CONTACT_ROLE_OPTIONS, type ContactItem } from '@/features/crm/types';

interface EditContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: ContactItem;
}

const PHONE_TYPE_OPTIONS = [
  { value: 'Mobile', label: 'Mobile' },
  { value: 'Office', label: 'Office' },
] as const;

export function EditContactModal({
  open,
  onOpenChange,
  contact,
}: EditContactModalProps) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [firstName, setFirstName] = useState(contact.firstName || '');
  const [lastName, setLastName] = useState(contact.lastName || '');
  const [title, setTitle] = useState(contact.title || '');
  const [selectedCustomerId, setSelectedCustomerId] = useState(contact.customerId);
  const [selectedRoles, setSelectedRoles] = useState<string[]>(contact.roles || ['Primary contact']);
  const [phone, setPhone] = useState(contact.phone || '');
  const [phoneType, setPhoneType] = useState<'Mobile' | 'Office'>(contact.phoneType || 'Mobile');
  const [email, setEmail] = useState(contact.email || '');
  const [status, setStatus] = useState<'Active' | 'Inactive'>(contact.status || 'Active');

  const [firstNameError, setFirstNameError] = useState(false);
  const [lastNameError, setLastNameError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [emailError, setEmailError] = useState(false);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let hasError = false;
    if (!firstName.trim()) {
      setFirstNameError(true);
      hasError = true;
    } else {
      setFirstNameError(false);
    }

    if (!lastName.trim()) {
      setLastNameError(true);
      hasError = true;
    } else {
      setLastNameError(false);
    }

    if (!phone.trim()) {
      setPhoneError(true);
      hasError = true;
    } else {
      setPhoneError(false);
    }

    if (!email.trim()) {
      setEmailError(true);
      hasError = true;
    } else {
      setEmailError(false);
    }

    if (hasError) return;

    const payload = {
      id: contact.id,
      firstName,
      lastName,
      jobTitle: title,
      phone,
      phoneType,
      email,
      isActive: status === 'Active',
    };
    const check = updateContactSchema.safeParse(payload);
    if (!check.success) {
      const first = Object.values(check.error.flatten().fieldErrors).flat()[0];
      toast.error(first ?? 'Please check the form.');
      return;
    }

    const refresh = () => router.refresh();
    startSaving(async () => {
      const result = await updateContact(payload);
      if (!reportAction(result, { entity: 'contact', refresh })) return;

      // Roles belong to the contact's link with this customer.
      const link = contact.linkedAccounts.find((a) => a.customerId === selectedCustomerId);
      if (link) {
        const roleResult = await updateContactLink({
          linkId: link.linkId,
          roles: selectedRoles,
          isPrimary: selectedRoles.includes('Primary contact'),
        });
        if (!reportAction(roleResult, { entity: 'contact', refresh })) return;
      }

      toast.success(`Updated contact: ${firstName.trim()} ${lastName.trim()}`);
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-2xl bg-white shadow-xl border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">
            Edit Contact
          </DialogTitle>
          <p className="text-xs text-slate-500 mt-1">
            Update personal information, roles, and status for {contact.name}.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} noValidate className="space-y-4 pt-2">
          {/* First & Last Name */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                First name <span className="text-red-500">*</span>
              </label>
              <Input
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value);
                  if (firstNameError && e.target.value.trim()) setFirstNameError(false);
                }}
                className={cn(
                  'h-9 text-xs rounded-lg transition-colors',
                  firstNameError
                    ? 'border-red-500 bg-red-50/20 text-red-900'
                    : 'border-slate-200 focus-visible:border-brand'
                )}
              />
              {firstNameError && (
                <p className="text-[11px] text-red-500 font-medium mt-1">
                  First name is required
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Last name <span className="text-red-500">*</span>
              </label>
              <Input
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value);
                  if (lastNameError && e.target.value.trim()) setLastNameError(false);
                }}
                className={cn(
                  'h-9 text-xs rounded-lg transition-colors',
                  lastNameError
                    ? 'border-red-500 bg-red-50/20 text-red-900'
                    : 'border-slate-200 focus-visible:border-brand'
                )}
              />
              {lastNameError && (
                <p className="text-[11px] text-red-500 font-medium mt-1">
                  Last name is required
                </p>
              )}
            </div>
          </div>

          {/* Job Title & Status */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Title / Position
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="h-9 text-xs rounded-lg border-slate-200 focus-visible:border-brand"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Status
              </label>
              <StatusSwitch
                compact
                ariaLabel="Contact is active"
                checked={status === 'Active'}
                onCheckedChange={(on) => setStatus(on ? 'Active' : 'Inactive')}
              />
            </div>
          </div>

          {/* Customer Account */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Customer account
            </label>
            <AppSelect
              value={selectedCustomerId}
              onChange={(customerId) => {
                setSelectedCustomerId(customerId);
                const link = contact.linkedAccounts.find((a) => a.customerId === customerId);
                if (link) setSelectedRoles(link.roles);
              }}
              options={contact.linkedAccounts.map((a) => ({ value: a.customerId, label: a.customerName }))}
              className="h-9 text-xs rounded-lg border-slate-200 bg-white"
            />
          </div>

          {/* Roles Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Contact roles
            </label>
            <div className="flex flex-wrap gap-1.5">
              {CONTACT_ROLE_OPTIONS.map((r) => {
                const isSelected = selectedRoles.includes(r);
                return (
                  <button
                    key={r}
                    type="button"
                    onClick={() => toggleRole(r)}
                    className={cn(
                      'text-xs px-2.5 py-1 rounded-full font-medium transition-all cursor-pointer border',
                      isSelected
                        ? 'bg-brand-light text-brand border-brand/30 shadow-2xs font-semibold'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    )}
                  >
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Phone & Type */}
          <div className="grid grid-cols-3 gap-2">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Phone number <span className="text-red-500">*</span>
              </label>
              <Input
                value={phone}
                onChange={(e) => {
                  const formatted = formatUSPhone(e.target.value);
                  setPhone(formatted);
                  if (phoneError && formatted.trim()) setPhoneError(false);
                }}
                className={cn(
                  'h-9 text-xs font-mono rounded-lg transition-colors',
                  phoneError
                    ? 'border-red-500 bg-red-50/20 text-red-900'
                    : 'border-slate-200 focus-visible:border-brand'
                )}
              />
              {phoneError && (
                <p className="text-[11px] text-red-500 font-medium mt-1">
                  Phone number is required
                </p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 block mb-1">
                Type
              </label>
              <SegmentedControl
                ariaLabel="Phone type"
                value={phoneType}
                onChange={setPhoneType}
                options={PHONE_TYPE_OPTIONS}
              />
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Email address <span className="text-red-500">*</span>
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (emailError && e.target.value.trim()) setEmailError(false);
              }}
              className={cn(
                'h-9 text-xs rounded-lg transition-colors',
                emailError
                  ? 'border-red-500 bg-red-50/20 text-red-900'
                  : 'border-slate-200 focus-visible:border-brand'
              )}
            />
            {emailError && (
              <p className="text-[11px] text-red-500 font-medium mt-1">
                Email address is required
              </p>
            )}
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 px-4 text-xs font-semibold cursor-pointer border-slate-200 text-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              disabled={isSaving}
              className="h-9 px-4 text-xs font-semibold cursor-pointer shadow-xs"
            >
              {isSaving ? 'Saving...' : 'Save changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
