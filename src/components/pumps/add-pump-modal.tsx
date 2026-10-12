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
import { UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { addPump } from '@/lib/pumps-store';
import { useOperators } from '@/lib/operators-store';
import { AddOperatorModal } from '@/components/operators/add-operator-modal';
import { cn } from '@/lib/utils';

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
  const [boomSize, setBoomSize] = useState<string>('38'); // in meters
  const [horizontalReach, setHorizontalReach] = useState<string>('124'); // in feet
  const [operatorId, setOperatorId] = useState('none');
  const [isAddOperatorOpen, setIsAddOperatorOpen] = useState(false);
  const [hourlyRate, setHourlyRate] = useState<string>('195'); // number only
  const [minHours, setMinHours] = useState<string>('4.0'); // number of hours
  const [year, setYear] = useState('2024');
  const [error, setError] = useState<string | null>(null);

  // Manual numeric bounds validation flags
  const isBoomInvalid =
    type === 'boom_pump' &&
    (boomSize.trim() === '' ||
      isNaN(Number(boomSize)) ||
      Number(boomSize) < 1 ||
      Number(boomSize) > 100);

  const isReachInvalid =
    horizontalReach.trim() !== '' &&
    (isNaN(Number(horizontalReach)) ||
      Number(horizontalReach) < 0 ||
      Number(horizontalReach) > 500);

  const isRateInvalid =
    hourlyRate.trim() !== '' &&
    (isNaN(Number(hourlyRate)) ||
      Number(hourlyRate) < 0 ||
      Number(hourlyRate) > 5000);

  const isMinHoursInvalid =
    minHours.trim() !== '' &&
    (isNaN(Number(minHours)) ||
      Number(minHours) < 1 ||
      Number(minHours) > 24);

  const isYearInvalid =
    year.trim() !== '' &&
    (isNaN(Number(year)) ||
      Number(year) < 1980 ||
      Number(year) > 2030);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanUnit = unitNumber.trim();
    if (!cleanUnit) {
      setError('Unit number is required (e.g. "05", "P-04")');
      return;
    }
    if (cleanUnit.length > 15) {
      setError('Unit number must be 15 characters or fewer');
      return;
    }
    if (isBoomInvalid) {
      setError('Boom size must be between 1 and 100 meters');
      return;
    }
    if (isReachInvalid) {
      setError('Horizontal reach must be between 0 and 500 feet');
      return;
    }
    if (isRateInvalid) {
      setError('Hourly rate must be between $0 and $5,000 / hr');
      return;
    }
    if (isMinHoursInvalid) {
      setError('Minimum callout must be between 1 and 24 hours');
      return;
    }
    if (isYearInvalid) {
      setError('Model year must be between 1980 and 2030');
      return;
    }

    const matchedOp = operatorId !== 'none' ? operators.find((op) => op.id === operatorId) : null;
    const defaultOperator = matchedOp
      ? {
          id: matchedOp.id,
          name: matchedOp.name,
          role: matchedOp.role,
          badge: null,
        }
      : {
          id: 'unassigned',
          name: 'Unassigned',
          role: 'None',
          badge: null,
        };

    const parsedBoomSize = boomSize.trim() ? Number(boomSize) : undefined;
    const parsedReach = horizontalReach.trim() ? Number(horizontalReach) : undefined;
    const parsedRate = hourlyRate.trim() ? Number(hourlyRate) : 195;

    const typeLabel =
      type === 'boom_pump'
        ? (parsedBoomSize ? `Boom pump · ${parsedBoomSize}M` : 'Boom pump')
        : 'Line pump';

    const boomLength =
      type === 'boom_pump'
        ? (parsedBoomSize
            ? `${parsedBoomSize}M${parsedReach ? ` (${parsedReach} ft)` : ''}`
            : '38M (124 ft)')
        : (parsedReach ? `Ground Line (${parsedReach}ft)` : 'Ground Line (500ft)');

    addPump({
      unitNumber: cleanUnit,
      make: make.trim() || 'Putzmeister',
      model: model.trim() || 'Custom Rig',
      type,
      typeLabel,
      boomSize: parsedBoomSize,
      horizontalReach: parsedReach,
      boomLength,
      defaultOperator,
      todayStatus: {
        type: 'available',
        label: 'Available · Assign operator',
      },
      nextInspection: {
        date: 'Dec 15, 2026',
        dueSoon: false,
      },
      status: 'available',
      hourlyRate: parsedRate,
      minHours: `${(minHours.trim() ? Number(minHours) : 4.0).toFixed(1)} hrs`,
      inMaintenance: false,
      year: year.trim() || '2024',
      documents: [],
    });

    const displayCode = parsedBoomSize ? `${cleanUnit} · ${parsedBoomSize}M` : cleanUnit;

    toast.success('New pump added to fleet', {
      description: `${displayCode} (${make} ${model.trim() || ''}) is ready for dispatch.`,
    });

    // Reset and close
    setUnitNumber('');
    setModel('');
    setBoomSize('38');
    setHorizontalReach('124');
    setHourlyRate('195');
    setMinHours('4.0');
    setOperatorId('none');
    setError(null);
    onOpenChange(false);
  };

  const operatorOptions = [
    { value: 'none', label: 'None (Unassigned)' },
    ...operators.map((op) => ({
      value: op.id,
      label: `${op.name} (${op.role})`,
    })),
  ];

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
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">
                Unit Number / Identifier <span className="text-rose-500">*</span>
              </label>
              <span
                className={cn(
                  'text-[10px] font-mono transition-colors',
                  unitNumber.length >= 15 ? 'text-rose-600 font-bold' : 'text-slate-400'
                )}
              >
                {unitNumber.length}/15 chars
              </span>
            </div>
            <Input
              value={unitNumber}
              maxLength={15}
              onChange={(e) => {
                setUnitNumber(e.target.value);
                if (error) setError(null);
              }}
              placeholder="e.g. 05 or P-04"
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

          {/* Equipment Type */}
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

          {/* Separate Boom Size (Meters) & Horizontal Reach (Feet) */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-1 h-5">
                <label className="text-xs font-semibold text-slate-700 truncate">
                  Boom Size (M)
                </label>
                <span
                  className={cn(
                    'text-[10px] font-mono transition-colors shrink-0 whitespace-nowrap',
                    isBoomInvalid ? 'text-rose-600 font-bold' : 'text-slate-400'
                  )}
                >
                  1–100 M
                </span>
              </div>
              <Input
                type="number"
                min={1}
                max={100}
                value={boomSize}
                onChange={(e) => {
                  setBoomSize(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={type === 'boom_pump' ? 'e.g. 38' : 'N/A'}
                disabled={type === 'line_pump'}
                className={cn(
                  'h-9 text-xs',
                  isBoomInvalid && 'border-rose-400 focus-visible:ring-rose-400 bg-rose-50/20'
                )}
              />
              {isBoomInvalid && (
                <p className="text-[11px] text-rose-500 font-medium">1 to 100 meters</p>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-1 h-5">
                <label className="text-xs font-semibold text-slate-700 truncate">
                  Horiz. Reach (ft)
                </label>
                <span
                  className={cn(
                    'text-[10px] font-mono transition-colors shrink-0 whitespace-nowrap',
                    isReachInvalid ? 'text-rose-600 font-bold' : 'text-slate-400'
                  )}
                >
                  0–500 ft
                </span>
              </div>
              <Input
                type="number"
                min={0}
                max={500}
                value={horizontalReach}
                onChange={(e) => {
                  setHorizontalReach(e.target.value);
                  if (error) setError(null);
                }}
                placeholder={type === 'boom_pump' ? 'e.g. 124' : 'e.g. 500'}
                className={cn(
                  'h-9 text-xs',
                  isReachInvalid && 'border-rose-400 focus-visible:ring-rose-400 bg-rose-50/20'
                )}
              />
              {isReachInvalid && (
                <p className="text-[11px] text-rose-500 font-medium">Must be 0 to 500 ft</p>
              )}
            </div>
          </div>

          {/* Default Operator */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700">Default Assigned Operator</label>
              <button
                type="button"
                onClick={() => setIsAddOperatorOpen(true)}
                className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1 cursor-pointer"
              >
                <UserPlus className="h-3 w-3" />
                <span>+ New Operator</span>
              </button>
            </div>
            <AppSelect
              size="sm"
              value={operatorId}
              onChange={setOperatorId}
              options={operatorOptions}
            />
          </div>

          {/* Hourly Rate, Min Callout Hours & Model Year */}
          <div className="grid grid-cols-3 gap-2.5">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-1 h-5">
                <label className="text-xs font-semibold text-slate-700 truncate">Hourly Rate ($)</label>
                <span
                  className={cn(
                    'text-[10px] font-mono transition-colors shrink-0 whitespace-nowrap',
                    isRateInvalid ? 'text-rose-600 font-bold' : 'text-slate-400'
                  )}
                >
                  $0–$5k
                </span>
              </div>
              <Input
                type="number"
                min={0}
                max={5000}
                step={5}
                value={hourlyRate}
                onChange={(e) => {
                  setHourlyRate(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="195"
                className={cn(
                  'h-9 text-xs',
                  isRateInvalid && 'border-rose-400 focus-visible:ring-rose-400 bg-rose-50/20'
                )}
              />
              {isRateInvalid && (
                <p className="text-[10px] text-rose-500 font-medium">Max $5,000</p>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-1 h-5">
                <label className="text-xs font-semibold text-slate-700 truncate">Min Callout (hrs)</label>
                <span
                  className={cn(
                    'text-[10px] font-mono transition-colors shrink-0 whitespace-nowrap',
                    isMinHoursInvalid ? 'text-rose-600 font-bold' : 'text-slate-400'
                  )}
                >
                  1–24h
                </span>
              </div>
              <Input
                type="number"
                min={1}
                max={24}
                step={0.5}
                value={minHours}
                onChange={(e) => {
                  setMinHours(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="4.0"
                className={cn(
                  'h-9 text-xs',
                  isMinHoursInvalid && 'border-rose-400 focus-visible:ring-rose-400 bg-rose-50/20'
                )}
              />
              {isMinHoursInvalid && (
                <p className="text-[10px] text-rose-500 font-medium">1–24 hrs</p>
              )}
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between gap-1 h-5">
                <label className="text-xs font-semibold text-slate-700 truncate">Model Year</label>
                <span
                  className={cn(
                    'text-[10px] font-mono transition-colors shrink-0 whitespace-nowrap',
                    isYearInvalid ? 'text-rose-600 font-bold' : 'text-slate-400'
                  )}
                >
                  1980–2030
                </span>
              </div>
              <Input
                type="number"
                min={1980}
                max={2030}
                value={year}
                onChange={(e) => {
                  setYear(e.target.value);
                  if (error) setError(null);
                }}
                placeholder="2024"
                className={cn(
                  'h-9 text-xs',
                  isYearInvalid && 'border-rose-400 focus-visible:ring-rose-400 bg-rose-50/20'
                )}
              />
              {isYearInvalid && (
                <p className="text-[10px] text-rose-500 font-medium">1980–2030</p>
              )}
            </div>
          </div>

          {/* Dynamic Preview */}
          <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/80 text-xs">
            <span className="text-slate-500 font-medium">Schedule Display Code:</span>
            <span className="font-bold text-slate-900 font-mono">
              {unitNumber.trim()
                ? (type === 'boom_pump' && boomSize.trim()
                    ? `${unitNumber.trim()} · ${boomSize.trim()}M`
                    : `${unitNumber.trim()} · Line`)
                : '—'}
            </span>
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

      {/* Nested Add Operator Modal */}
      <AddOperatorModal
        open={isAddOperatorOpen}
        onOpenChange={setIsAddOperatorOpen}
        defaultAssignedPump={unitNumber}
        onCreated={(createdOp) => {
          setOperatorId(createdOp.id);
        }}
      />
    </Dialog>
  );
}
