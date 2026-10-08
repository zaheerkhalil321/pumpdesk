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
import { addPump } from '@/lib/pumps-store';
import { useOperators } from '@/lib/operators-store';

interface AddPumpModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddPumpModal({ open, onOpenChange }: AddPumpModalProps) {
  const operators = useOperators();

  const [unitNumber, setUnitNumber] = useState('');
  const [make, setMake] = useState('Putzmeister');
  const [model, setModel] = useState('');
  const [type, setType] = useState<'boom_pump' | 'line_pump'>('boom_pump');
  const [boomLength, setBoomLength] = useState('');
  const [operatorId, setOperatorId] = useState(operators[0]?.id || 'rob-black');
  const [hourlyRate, setHourlyRate] = useState('$195 / hr');
  const [year, setYear] = useState('2024');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!unitNumber.trim()) {
      setError('Unit number is required (e.g., "05 · 38M")');
      return;
    }

    const matchedOp = operators.find((op) => op.id === operatorId) || {
      id: 'rob-black',
      name: 'Rob Black',
      role: 'Lead operator',
    };

    const typeLabel =
      type === 'boom_pump'
        ? `Boom pump · ${boomLength.trim() || '38M'}`
        : 'Line pump';

    addPump({
      unitNumber: unitNumber.trim(),
      make: make.trim() || 'Putzmeister',
      model: model.trim() || 'Custom Rig',
      type,
      typeLabel,
      boomLength: boomLength.trim() || (type === 'boom_pump' ? '38M (124 ft)' : 'Ground Line (500ft)'),
      defaultOperator: {
        id: matchedOp.id,
        name: matchedOp.name,
        role: matchedOp.role,
        badge: null,
      },
      todayStatus: {
        type: 'available',
        label: 'Available · Assign operator',
      },
      nextInspection: {
        date: 'Dec 15, 2026',
        dueSoon: false,
      },
      status: 'available',
      hourlyRate: hourlyRate.trim() || '$195 / hr',
      minHours: '4.0 hrs',
      inMaintenance: false,
      year: year.trim() || '2024',
    });

    toast.success('New pump added to fleet', {
      description: `${unitNumber.trim()} (${make} ${model.trim() || ''}) is ready for dispatch.`,
    });

    // Reset and close
    setUnitNumber('');
    setModel('');
    setBoomLength('');
    setError(null);
    onOpenChange(false);
  };

  const operatorOptions = operators.map((op) => ({
    value: op.id,
    label: `${op.name} (${op.role})`,
  }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md p-6 rounded-2xl border-slate-200">
        <DialogHeader className="space-y-1">
          <DialogTitle className="text-lg font-bold text-slate-900">
            Add New Pump Rig
          </DialogTitle>
          <p className="text-xs text-slate-500">
            Enter equipment specifications, boom length, and default operator assignment.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 pt-2">
          {/* Unit Number */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              Unit Number / Identifier <span className="text-rose-500">*</span>
            </label>
            <Input
              value={unitNumber}
              onChange={(e) => {
                setUnitNumber(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. 05 · 38M"
              className="h-9 text-xs"
              autoFocus
            />
            {error && <p className="text-[11px] text-rose-500 font-medium">{error}</p>}
          </div>

          {/* Make & Model */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Manufacturer</label>
              <AppSelect
                size="sm"
                value={make}
                onChange={setMake}
                options={[
                  { value: 'Putzmeister', label: 'Putzmeister' },
                  { value: 'Schwing', label: 'Schwing' },
                  { value: 'Alliance', label: 'Alliance' },
                  { value: 'Reed', label: 'Reed' },
                  { value: 'Trailer rig', label: 'Trailer rig' },
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Model</label>
              <Input
                value={model}
                onChange={(e) => setModel(e.target.value)}
                placeholder="e.g. 38Z or B50"
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Type & Boom Reach */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Equipment Type</label>
              <AppSelect
                size="sm"
                value={type}
                onChange={(val) => setType(val as 'boom_pump' | 'line_pump')}
                options={[
                  { value: 'boom_pump', label: 'Boom Pump' },
                  { value: 'line_pump', label: 'Line Pump' },
                ]}
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Boom Reach / Size</label>
              <Input
                value={boomLength}
                onChange={(e) => setBoomLength(e.target.value)}
                placeholder="e.g. 38M (124 ft)"
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Default Operator */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">Default Assigned Operator</label>
            <AppSelect
              size="sm"
              value={operatorId}
              onChange={setOperatorId}
              options={operatorOptions}
            />
          </div>

          {/* Hourly Rate & Model Year */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Hourly Rate</label>
              <Input
                value={hourlyRate}
                onChange={(e) => setHourlyRate(e.target.value)}
                placeholder="e.g. $195 / hr"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-700">Model Year</label>
              <Input
                value={year}
                onChange={(e) => setYear(e.target.value)}
                placeholder="2024"
                className="h-9 text-xs"
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="h-9 px-3.5 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="brand"
              size="sm"
              className="h-9 px-4 text-xs font-semibold cursor-pointer"
            >
              Add Rig
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
