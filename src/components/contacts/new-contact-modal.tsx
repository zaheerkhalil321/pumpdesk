'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppSelect } from '@/components/ui/app-select';
import { toast } from 'sonner';
import { cn, formatUSPhone } from '@/lib/utils';
import { addContact, ContactItem } from '@/lib/contacts-store';

interface NewContactModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onContactCreated?: (contact: ContactItem) => void;
}

const CUSTOMER_OPTIONS = [
  { value: 'CUST-101', label: 'Accurate Concrete' },
  { value: 'CUST-104', label: 'Coastal Foundations' },
  { value: 'CUST-105', label: 'Granite State Builders' },
  { value: 'CUST-106', label: 'Harbor Builders' },
  { value: 'CUST-107', label: 'Pine Tree Concrete' },
  { value: 'CUST-108', label: 'Turner Construction' },
];

const ROLE_OPTIONS = [
  'Primary contact',
  'Site contact',
  'Invoicing',
  'Additional contact',
];

export function NewContactModal({
  open,
  onOpenChange,
  onContactCreated,
}: NewContactModalProps) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [title, setTitle] = useState('');
  const [selectedCustomerId, setSelectedCustomerId] = useState('CUST-101');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['Primary contact']);
  const [phone, setPhone] = useState('');
  const [phoneType, setPhoneType] = useState<'Mobile' | 'Office'>('Mobile');
  const [email, setEmail] = useState('');
  const [tag, setTag] = useState('');

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
    setSelectedCustomerId('CUST-101');
    setSelectedRoles(['Primary contact']);
    setPhone('');
    setPhoneType('Mobile');
    setEmail('');
    setTag('');
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

    const customerObj = CUSTOMER_OPTIONS.find((c) => c.value === selectedCustomerId);
    const customerName = customerObj ? customerObj.label : 'Accurate Concrete';

    // Compute role display string
    let roleDisplay = 'Contact';
    if (selectedRoles.includes('Primary contact') && selectedRoles.includes('Site contact')) {
      roleDisplay = 'Primary + Site';
    } else if (selectedRoles.includes('Primary contact')) {
      roleDisplay = 'Primary';
    } else if (selectedRoles.includes('Invoicing')) {
      roleDisplay = 'Invoicing';
    } else if (selectedRoles.includes('Site contact')) {
      roleDisplay = 'Site';
    } else if (selectedRoles.length > 0) {
      roleDisplay = selectedRoles[0];
    }

    const created = addContact({
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      name: `${firstName.trim()} ${lastName.trim()}`,
      title: title.trim() || 'Project manager',
      company: customerName,
      customerId: selectedCustomerId,
      roles: selectedRoles.length > 0 ? selectedRoles : ['Site contact'],
      roleDisplay,
      phone: phone.trim(),
      phoneType,
      email: email.trim().toLowerCase(),
      status: 'Active',
      tags: tag.trim() ? [tag.trim()] : ['Site coordination'],
      createdAt: 'Today',
      linkedAccounts: [
        {
          customerId: selectedCustomerId,
          customerName,
          roles: selectedRoles.length > 0 ? selectedRoles : ['Site contact'],
        },
      ],
      notificationPreferences: [
        { id: 'pref-1', title: 'Order confirmation', description: 'Request confirmation or updated details', channel: 'Email' },
        { id: 'pref-2', title: 'Operator details', description: 'Share assigned operator information', channel: 'Text' },
        { id: 'pref-3', title: 'Pump en route', description: 'Notify when the pump is on its way', channel: 'Text' },
        { id: 'pref-4', title: 'Pre-work authorization', description: 'Request approval to begin setup', channel: 'Off' },
        { id: 'pref-5', title: 'Work ticket review', description: 'Request review after the pour', channel: 'Email' },
        { id: 'pref-6', title: 'Missing order details', description: 'Request outstanding job information', channel: 'Email' },
      ],
      assignedOrders: [],
    });

    toast.success(`Contact created: ${created.name}`, {
      description: `${created.title} · ${created.company}`,
    });

    if (onContactCreated) {
      onContactCreated(created);
    }

    resetForm();
    onOpenChange(false);
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
              options={CUSTOMER_OPTIONS}
              className="h-9 text-xs rounded-lg border-slate-200 bg-white"
            />
          </div>

          {/* Roles Selection */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Contact roles
            </label>
            <div className="flex flex-wrap gap-1.5">
              {ROLE_OPTIONS.map((r) => {
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
              <AppSelect
                value={phoneType}
                onChange={(v) => setPhoneType(v as 'Mobile' | 'Office')}
                options={[
                  { value: 'Mobile', label: 'Mobile' },
                  { value: 'Office', label: 'Office' },
                ]}
                className="h-9 text-xs rounded-lg border-slate-200 bg-white"
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

          {/* Tag */}
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Tag / Specialization
            </label>
            <Input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="e.g. Site coordination, High-rise, VIP"
              className="h-9 text-xs rounded-lg border-slate-200 focus-visible:border-brand"
            />
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
              className="h-9 px-4 text-xs font-semibold cursor-pointer shadow-xs"
            >
              Save contact
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
