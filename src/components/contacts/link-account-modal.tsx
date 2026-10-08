'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AppSelect } from '@/components/ui/app-select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { updateContact, ContactItem, LinkedCustomerAccount } from '@/lib/contacts-store';

interface LinkAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: ContactItem;
  onAccountLinked?: (contact: ContactItem) => void;
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

export function LinkAccountModal({
  open,
  onOpenChange,
  contact,
  onAccountLinked,
}: LinkAccountModalProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState('CUST-104');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['Site contact']);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleLink = (e: React.FormEvent) => {
    e.preventDefault();

    const customerObj = CUSTOMER_OPTIONS.find((c) => c.value === selectedCustomerId);
    const customerName = customerObj ? customerObj.label : 'Accurate Concrete';

    const newLink: LinkedCustomerAccount = {
      customerId: selectedCustomerId,
      customerName,
      roles: selectedRoles.length > 0 ? selectedRoles : ['Site contact'],
    };

    // Check if already linked
    const existingIndex = contact.linkedAccounts.findIndex(
      (a) => a.customerId === selectedCustomerId
    );

    const updatedAccounts = [...contact.linkedAccounts];
    if (existingIndex >= 0) {
      updatedAccounts[existingIndex] = newLink;
    } else {
      updatedAccounts.push(newLink);
    }

    const updated = updateContact(contact.id, {
      linkedAccounts: updatedAccounts,
    });

    if (updated) {
      toast.success(`Linked ${customerName} to ${contact.name}`);
      if (onAccountLinked) onAccountLinked(updated);
    }

    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-6 rounded-2xl bg-white shadow-xl border-slate-200">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">
            Link Customer Account
          </DialogTitle>
          <p className="text-xs text-slate-500 mt-1">
            Associate {contact.name} with an additional customer company and assign their roles.
          </p>
        </DialogHeader>

        <form onSubmit={handleLink} className="space-y-4 pt-2">
          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1">
              Select customer account
            </label>
            <AppSelect
              value={selectedCustomerId}
              onChange={setSelectedCustomerId}
              options={CUSTOMER_OPTIONS}
              className="h-9 text-xs rounded-lg border-slate-200 bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Assigned roles for this account
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
              Link account
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
