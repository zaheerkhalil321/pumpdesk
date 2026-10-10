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
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { formatUSPhone } from '@/lib/utils';
import { addOperator, OperatorItem, OperatorEmergencyContact } from '@/lib/operators-store';

interface AddOperatorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (created: OperatorItem) => void;
  defaultAssignedPump?: string;
}

const PUMP_OPTIONS = [
  { value: 'None', label: 'None (Unassigned / Optional)' },
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

interface FormEmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
}

export function AddOperatorModal({
  open,
  onOpenChange,
  onCreated,
  defaultAssignedPump = 'None',
}: AddOperatorModalProps) {
  const [name, setName] = useState('');
  const [role, setRole] = useState('Operator');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [branch, setBranch] = useState('Warren');
  const [defaultPump, setDefaultPump] = useState(defaultAssignedPump);
  const [emergencyContacts, setEmergencyContacts] = useState<FormEmergencyContact[]>([
    { id: '1', name: '', relationship: '', phone: '' },
  ]);
  const [nameError, setNameError] = useState<string | null>(null);

  const handleAddEmergencyContact = () => {
    setEmergencyContacts((prev) => [
      ...prev,
      { id: `contact-${Date.now()}`, name: '', relationship: '', phone: '' },
    ]);
  };

  const handleRemoveEmergencyContact = (id: string) => {
    setEmergencyContacts((prev) => prev.filter((c) => c.id !== id));
  };

  const handleContactChange = (
    id: string,
    field: 'name' | 'relationship' | 'phone',
    value: string
  ) => {
    setEmergencyContacts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, [field]: value } : c))
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setNameError('Operator name is required');
      return;
    }

    const formattedPhone = formatUSPhone(phone) || phone.trim() || '(207) 555-0100';

    const validContacts: OperatorEmergencyContact[] = emergencyContacts
      .filter((c) => c.name.trim() || c.relationship.trim() || c.phone.trim())
      .map((c) => ({
        name: c.name.trim() || 'Not provided',
        relationship: c.relationship.trim() || 'Not provided',
        phone: formatUSPhone(c.phone) || c.phone.trim() || 'Not provided',
      }));

    const created = addOperator({
      name: name.trim(),
      role,
      phone: formattedPhone,
      email: email.trim() || `${name.toLowerCase().replace(/[^a-z0-9]/g, '')}@midcoast.example`,
      branch: branch.trim() || 'Warren',
      defaultPump: defaultPump || 'None',
      todayStatus: {
        type: 'available',
        label: 'Available',
      },
      status: 'Active',
      emergencyContact: validContacts[0] || {
        name: 'Not provided',
        relationship: 'Not provided',
        phone: 'Not provided',
      },
      emergencyContacts: validContacts,
      credentialAlert: null,
    });

    toast.success('Operator added successfully', {
      description: `${created.name} (${created.role}) has been added to crew roster.`,
    });

    onCreated?.(created);

    // Reset & close
    setName('');
    setRole('Operator');
    setPhone('');
    setEmail('');
    setBranch('Warren');
    setDefaultPump('None');
    setEmergencyContacts([{ id: '1', name: '', relationship: '', phone: '' }]);
    setNameError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl">
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

          {/* Role & Default Pump (Optional) */}
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
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 block">
                  Default Pump
                </label>
                <span className="text-[10px] text-slate-400 font-medium">Optional</span>
              </div>
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

          {/* Multiple Emergency Contacts */}
          <div className="pt-3 border-t border-slate-100 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Emergency Contacts</h4>
                <p className="text-[11px] text-slate-500">
                  Add 1 or more emergency contacts for operator safety records.
                </p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddEmergencyContact}
                className="h-7 text-xs font-semibold gap-1 text-slate-700 border-slate-200 hover:border-brand/40 hover:text-brand cursor-pointer shadow-2xs"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>Add another</span>
              </Button>
            </div>

            <div className="space-y-3">
              {emergencyContacts.map((contact, index) => (
                <div
                  key={contact.id}
                  className="p-3 rounded-xl bg-slate-50/70 border border-slate-200/80 space-y-2.5 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-slate-600">
                      Contact #{index + 1} {index === 0 ? '(Primary)' : ''}
                    </span>
                    {emergencyContacts.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveEmergencyContact(contact.id)}
                        className="text-slate-400 hover:text-rose-600 p-1 rounded-md transition-colors cursor-pointer"
                        title="Remove contact"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-500 font-medium">Name</span>
                      <Input
                        value={contact.name}
                        onChange={(e) => handleContactChange(contact.id, 'name', e.target.value)}
                        placeholder="e.g. Sarah Black"
                        className="h-9 text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-500 font-medium">Relationship</span>
                      <Input
                        value={contact.relationship}
                        onChange={(e) => handleContactChange(contact.id, 'relationship', e.target.value)}
                        placeholder="e.g. Spouse"
                        className="h-9 text-xs bg-white"
                      />
                    </div>
                    <div className="space-y-1">
                      <span className="text-[11px] text-slate-500 font-medium">Phone</span>
                      <Input
                        type="tel"
                        value={contact.phone}
                        onChange={(e) =>
                          handleContactChange(contact.id, 'phone', formatUSPhone(e.target.value))
                        }
                        placeholder="(207) 555-0199"
                        maxLength={14}
                        className="h-9 text-xs bg-white"
                      />
                    </div>
                  </div>
                </div>
              ))}
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
