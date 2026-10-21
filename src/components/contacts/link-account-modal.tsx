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
import { AppSelect } from '@/components/ui/app-select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { linkContactToCustomer } from '@/features/crm/server/actions';
import { linkContactSchema } from '@/features/crm/schemas';
import { reportAction } from '@/lib/action-feedback';
import { CONTACT_ROLE_OPTIONS, type ContactItem, type CustomerOption } from '@/features/crm/types';

interface LinkAccountModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact: ContactItem;
  customerOptions: CustomerOption[];
}

export function LinkAccountModal({
  open,
  onOpenChange,
  contact,
  customerOptions,
}: LinkAccountModalProps) {
  const router = useRouter();
  const [isSaving, startSaving] = useTransition();
  const [selectedCustomerId, setSelectedCustomerId] = useState(customerOptions[0]?.value ?? '');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['Site contact']);

  const toggleRole = (role: string) => {
    setSelectedRoles((prev) =>
      prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]
    );
  };

  const handleLink = (e: React.FormEvent) => {
    e.preventDefault();

    const payload = {
      contactId: contact.id,
      customerId: selectedCustomerId,
      roles: selectedRoles,
    };
    const check = linkContactSchema.safeParse(payload);
    if (!check.success) {
      toast.error('Pick a customer account to link.');
      return;
    }

    startSaving(async () => {
      const result = await linkContactToCustomer(payload);
      if (!reportAction(result, { entity: 'contact', refresh: () => router.refresh() })) return;
      const customerName = customerOptions.find((c) => c.value === selectedCustomerId)?.label;
      toast.success(`Linked ${customerName ?? 'customer'} to ${contact.name}`);
      onOpenChange(false);
    });
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
              options={customerOptions}
              className="h-9 text-xs rounded-lg border-slate-200 bg-white"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 block mb-1.5">
              Assigned roles for this account
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
              {isSaving ? 'Saving...' : 'Link account'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
