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
import { SegmentedControl } from '@/components/ui/segmented-control';
import { toast } from 'sonner';
import { cn, formatUSPhone } from '@/lib/utils';
import { createContact } from '@/features/crm/server/actions';
import { createContactSchema } from '@/features/crm/schemas';
import { reportAction } from '@/features/crm/action-feedback';
import { CONTACT_ROLE_OPTIONS, type CustomerOption } from '@/features/crm/types';

interface NewContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  customerOptions: CustomerOption[];
}

const PHONE_TYPE_OPTIONS = [
  { value: 'Mobile', label: 'Mobile' },
  { value: 'Office', label: 'Office' },
] as const;

export function NewContactModal({
  open,
  onOpenChange,
  customerOptions,
}: NewContactModalProps) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [title, setTitle] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerOptions[0]?.value ?? '');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['Primary contact']);
  const [phone, setPhone] = useState('');
  const [phoneType, setPhoneType] = useState<'Mobile' | 'Office'>('Mobile');
  const [email, setEmail] = useState('');

  // Validation error states
  const [firstNameError, setFirstNameError] = useState(false);
  const [lastNameError, setLastNameError] = useState(false);
  const [phoneError, setPhoneError] = useState(false);
  const [emailError, setEmailError] = useState(false);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role)
        ? prev.filter((r) => r !== role)
        : [...prev, role]
    );
  };

  const resetForm = () => {
    setFirstName('');
    setLastName('');
    setTitle('');
    setSelectedCustomerId(customerOptions[0]?.value ?? '');
    setSelectedRoles(['Primary contact']);
    setPhone('');
    setPhoneType('Mobile');
    setEmail('');
    setFirstNameError(false);
    setLastNameError(false);
    setPhoneError(false);
    setEmailError(false);
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
      firstName,
      lastName,
      jobTitle: title,
      phone,
      phoneType,
      email,
      customerId: selectedCustomerId || undefined,
      roles: selectedRoles,
    };
    const check = createContactSchema.safeParse(payload);
    if (!check.success) {
      const first = Object.values(check.error.flatten().fieldErrors).flat()[0];
      toast.error(first ?? 'Please check the form.');
      return;
    }

    startSaving(async () => {
      const result = await createContact(payload);
      if (!reportAction(result, { entity: 'contact', refresh: () => router.refresh() })) return;

      const customerName = customerOptions.find((c) => c.value === selectedCustomerId)?.label;
      toast.success(`Contact created: ${firstName.trim()} ${lastName.trim()}`, {
        description: [title.trim(), customerName].filter(Boolean).join(' · '),
      });
      resetForm();
      onOpenChange(false);
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-2xl bg-white shadow-xl border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">
            Add New Contact
          </DialogTitle>
          <p className="text-xs text-slate-500 mt-1">
            Create a field supervisor, superintendent, or billing contact.
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
                placeholder="Alex"
                className={cn(
                  'h-9 text-xs rounded-lg transition-colors',
                  firstNameError
                    ? 'border-red-500 bg-red-50/20 text-red-900 focus-visible:border-red-500'
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
                placeholder="Morgan"
                className={cn(
                  'h-9 text-xs rounded-lg transition-colors',
                  lastNameError
                    ? 'border-red-500 bg-red-50/20 text-red-900 focus-visible:border-red-500'
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

          {/* Job Title / Role */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Title / Position
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Project manager, Superintendent"
              className="h-9 text-xs rounded-lg border-slate-200 focus-visible:border-brand"
            />
          </div>

          {/* Customer Account */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Customer account
            </label>
            <AppSelect
              value={selectedCustomerId}
              onChange={setSelectedCustomerId}
              options={customerOptions}
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

          {/* Phone & Phone Type */}
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
                placeholder="(207) 555-0100"
                className={cn(
                  'h-9 text-xs font-mono rounded-lg transition-colors',
                  phoneError
                    ? 'border-red-500 bg-red-50/20 text-red-900 focus-visible:border-red-500'
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
              placeholder="alex@accurate.example"
              className={cn(
                'h-9 text-xs rounded-lg transition-colors',
                emailError
                  ? 'border-red-500 bg-red-50/20 text-red-900 focus-visible:border-red-500'
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
              {isSaving ? 'Saving...' : 'Save contact'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
