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
import { formatUSPhone } from '@/lib/utils';
import { OperatorItem, updateOperator } from '@/lib/operators-store';

interface EditOperatorModalProps {
  operator: OperatorItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (updated: OperatorItem) => void;
}

const PUMP_OPTIONS = [
  { value: '01 · 34M', label: '01 · 34M Putzmeister' },
  { value: '02 · 28M', label: '02 · 28M Putzmeister' },
  { value: '03 · 47M', label: '03 · 47M Schwing' },
  { value: '04 · Line pump', label: '04 · Trailer Line Pump' },
  { value: 'No default pump', label: 'No default pump (Relief)' },
];

const ROLE_OPTIONS = [
  { value: 'Operator', label: 'Operator' },
  { value: 'Lead operator', label: 'Lead operator' },
  { value: 'Relief operator', label: 'Relief operator' },
];

export function EditOperatorModal({
  operator,
  open,
  onOpenChange,
  onSaved,
}: EditOperatorModalProps) {
  if (!operator) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">
            Edit Operator Profile
          </DialogTitle>
          <p className="text-xs text-slate-500 mt-0.5">
            Update contact details, pump assignment, and emergency contact.
          </p>
        </DialogHeader>

        <EditOperatorForm
          key={`${operator.id}-${open}`}
          operator={operator}
          onClose={() => onOpenChange(false)}
          onSaved={onSaved}
        />
      </DialogContent>
    </Dialog>
  );
}

interface EditOperatorFormProps {
  operator: OperatorItem;
  onClose: () => void;
  onSaved?: (updated: OperatorItem) => void;
}

function EditOperatorForm({ operator, onClose, onSaved }: EditOperatorFormProps) {
  const [name, setName] = useState(operator.name);
  const [role, setRole] = useState(operator.role);
  const [phone, setPhone] = useState(operator.phone);
  const [email, setEmail] = useState(operator.email);
  const [branch, setBranch] = useState(operator.branch || 'Warren');
  const [defaultPump, setDefaultPump] = useState(operator.defaultPump);
  const [status, setStatus] = useState<'Active' | 'Inactive'>(operator.status);
  const [emergencyName, setEmergencyName] = useState(
    operator.emergencyContact?.name === 'Not provided' ? '' : operator.emergencyContact?.name || ''
  );
  const [emergencyRel, setEmergencyRel] = useState(
    operator.emergencyContact?.relationship === 'Not provided' ? '' : operator.emergencyContact?.relationship || ''
  );
  const [emergencyPhone, setEmergencyPhone] = useState(
    operator.emergencyContact?.phone === 'Not provided' ? '' : operator.emergencyContact?.phone || ''
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Name is required');
      return;
    }

    const updated = updateOperator(operator.id, {
      name: name.trim(),
      role,
      phone: formatUSPhone(phone) || phone.trim(),
      email: email.trim(),
      branch: branch.trim(),
      defaultPump,
      status,
      emergencyContact: {
        name: emergencyName.trim() || 'Not provided',
        relationship: emergencyRel.trim() || 'Not provided',
        phone: formatUSPhone(emergencyPhone) || emergencyPhone.trim() || 'Not provided',
      },
    });

    if (updated) {
      toast.success('Profile updated', {
        description: `${updated.name}'s details have been saved.`,
      });
      onSaved?.(updated);
    }

    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      {/* Full Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-slate-700 block">
          Full Name
        </label>
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="h-10 text-xs sm:text-sm font-medium text-slate-900 border-slate-200 bg-white placeholder:text-slate-400 focus-visible:border-brand rounded-lg shadow-2xs"
        />
      </div>

      {/* Role & Default Pump */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            Role
          </label>
          <AppSelect
            size="lg"
            value={role}
            onChange={setRole}
            options={ROLE_OPTIONS}
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            Default Pump
          </label>
          <AppSelect
            size="lg"
            value={defaultPump}
            onChange={setDefaultPump}
            options={PUMP_OPTIONS}
          />
        </div>
      </div>

      {/* Phone & Email */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            Phone Number
          </label>
          <Input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(formatUSPhone(e.target.value))}
            maxLength={14}
            className="h-10 text-xs sm:text-sm font-medium text-slate-900 border-slate-200 bg-white placeholder:text-slate-400 focus-visible:border-brand rounded-lg shadow-2xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            Email
          </label>
          <Input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-10 text-xs sm:text-sm font-medium text-slate-900 border-slate-200 bg-white placeholder:text-slate-400 focus-visible:border-brand rounded-lg shadow-2xs"
          />
        </div>
      </div>

      {/* Branch & Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            Branch Yard
          </label>
          <Input
            value={branch}
            onChange={(e) => setBranch(e.target.value)}
            className="h-10 text-xs sm:text-sm font-medium text-slate-900 border-slate-200 bg-white placeholder:text-slate-400 focus-visible:border-brand rounded-lg shadow-2xs"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-700 block">
            Status
          </label>
          <AppSelect
            size="lg"
            value={status}
            onChange={(v) => setStatus(v as 'Active' | 'Inactive')}
            options={['Active', 'Inactive']}
          />
        </div>
      </div>

      {/* Emergency Contact Header */}
      <div className="pt-2 border-t border-slate-100">
        <h4 className="text-xs font-bold text-slate-900">Emergency Contact</h4>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 mt-2">
          <div className="space-y-1">
            <span className="text-[11px] text-slate-500 font-medium">Name</span>
            <Input
              value={emergencyName}
              onChange={(e) => setEmergencyName(e.target.value)}
              placeholder="e.g. Sarah Black"
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] text-slate-500 font-medium">Relationship</span>
            <Input
              value={emergencyRel}
              onChange={(e) => setEmergencyRel(e.target.value)}
              placeholder="e.g. Spouse"
              className="h-9 text-xs"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[11px] text-slate-500 font-medium">Phone</span>
            <Input
              type="tel"
              value={emergencyPhone}
              onChange={(e) => setEmergencyPhone(formatUSPhone(e.target.value))}
              placeholder="(207) 555-0199"
              maxLength={14}
              className="h-9 text-xs"
            />
          </div>
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onClose}
          className="h-9 px-4 text-xs font-semibold cursor-pointer"
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="brand"
          size="sm"
          className="h-9 px-5 text-xs font-semibold cursor-pointer"
        >
          Save Changes
        </Button>
      </div>
    </form>
  );
}
