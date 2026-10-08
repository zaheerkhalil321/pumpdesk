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
import { addOperator } from '@/lib/operators-store';

interface AddOperatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
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

export function AddOperatorModal({ open, onOpenChange }: AddOperatorModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Operator');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [branch, setBranch] = useState('Warren');
  const [defaultPump, setDefaultPump] = useState('01 · 34M');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRel, setEmergencyRel] = useState('');
  const [emergencyPhone, setEmergencyPhone] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Operator name is required');
      return;
    }

    const formattedPhone = formatUSPhone(phone) || phone.trim() || '(207) 555-0100';
    const formattedEmergencyPhone = formatUSPhone(emergencyPhone) || emergencyPhone.trim();

    const created = addOperator({
      name: name.trim(),
      role,
      phone: formattedPhone,
      email: email.trim() || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@midcoast.example`,
      branch: branch.trim() || 'Warren',
      defaultPump,
      todayStatus: {
        type: 'available',
        label: 'Available',
      },
      status: 'Active',
      emergencyContact: {
        name: emergencyName.trim() || 'Not provided',
        relationship: emergencyRel.trim() || 'Not provided',
        phone: formattedEmergencyPhone || 'Not provided',
      },
      credentialAlert: null,
    });

    toast.success('Operator added successfully', {
      description: `${created.name} (${created.role}) has been added to crew roster.`,
    });

    // Reset & close
    setName('');
    setRole('Operator');
    setPhone('');
    setEmail('');
    setBranch('Warren');
    setDefaultPump('01 · 34M');
    setEmergencyName('');
    setEmergencyRel('');
    setEmergencyPhone('');
    setNameError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 tracking-tight">
            Add New Operator
          </DialogTitle>
          <p className="text-xs text-slate-500 mt-0.5">
            Register a pump operator to the Midcoast Pumping fleet roster.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Full Name */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Full Name <span className="text-red-500">*</span>
            </label>
            <Input
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (nameError) setNameError(null);
              }}
              placeholder="e.g. Rob Black"
              className="h-10 text-xs sm:text-sm font-medium text-slate-900 border-slate-200 bg-white placeholder:text-slate-400 focus-visible:border-brand rounded-lg shadow-2xs"
            />
            {nameError && (
              <p className="text-[11px] text-red-500 font-medium">{nameError}</p>
            )}
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
                placeholder="(207) 555-0168"
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
                placeholder="rob@midcoast.example"
                className="h-10 text-xs sm:text-sm font-medium text-slate-900 border-slate-200 bg-white placeholder:text-slate-400 focus-visible:border-brand rounded-lg shadow-2xs"
              />
            </div>
          </div>

          {/* Branch */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700 block">
              Branch Yard
            </label>
            <Input
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              placeholder="Warren"
              className="h-10 text-xs sm:text-sm font-medium text-slate-900 border-slate-200 bg-white placeholder:text-slate-400 focus-visible:border-brand rounded-lg shadow-2xs"
            />
          </div>

          {/* Emergency Contact Header */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-900">Emergency Contact (Optional)</h4>
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
              onClick={() => onOpenChange(false)}
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
              Add Operator
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
