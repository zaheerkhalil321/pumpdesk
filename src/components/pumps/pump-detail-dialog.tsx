'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  ModalCloseButton,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppSelect } from '@/components/ui/app-select';
import { DatePicker } from '@/components/ui/date-picker';
import {
  Truck,
  User,
  Calendar,
  Wrench,
  ShieldCheck,
  AlertTriangle,
  ExternalLink,
  Pencil,
  Trash2,
  FileText,
  UserPlus,
} from 'lucide-react';
import {
  getPumpDisplayName,
  formatHourlyRate,
  parseHourlyRate,
  formatMinHours,
  parseMinHours,
} from '@/features/fleet/format';
import type { BranchOption, OperatorItem, PumpItem } from '@/features/fleet/types';
import { assignPumpOperator, deletePump, updatePump } from '@/features/fleet/server/actions';
import { updatePumpSchema } from '@/features/fleet/schemas';
import { reportAction } from '@/lib/action-feedback';
import { AddOperatorModal } from '@/components/operators/add-operator-modal';
import { EditOperatorModal } from '@/components/operators/edit-operator-modal';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface PumpDetailDialogProps {
  pump: PumpItem | null;
  pumps: PumpItem[];
  operators: OperatorItem[];
  branchOptions: BranchOption[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspectionMode?: boolean;
}

export function PumpDetailDialog({
  pump,
  pumps,
  operators,
  branchOptions,
  open,
  onOpenChange,
  inspectionMode = false,
}: PumpDetailDialogProps) {
  const router = useRouter();
  const [isSaving, setIsSaving] = useState(false);
  const refresh = () => router.refresh();

  const currentPump = pump;

  const [activeTab, setActiveTab] = useState<'specs' | 'documents'>('specs');
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  // Reset edit mode and child dialog states whenever dialog closes or active pump changes
  const [prevPumpId, setPrevPumpId] = useState(pump?.id);
  const [prevOpen, setPrevOpen] = useState(open);

  if (pump?.id !== prevPumpId || open !== prevOpen) {
    setPrevPumpId(pump?.id);
    setPrevOpen(open);
    if (!open || pump?.id !== prevPumpId) {
      setIsEditing(false);
      setIsDeleteDialogOpen(false);
      setActiveTab('specs');
    }
  }

  const handleClose = () => {
    setIsEditing(false);
    setIsDeleteDialogOpen(false);
    onOpenChange(false);
  };

  // Operator Modals
  const [isAddOperatorOpen, setIsAddOperatorOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<OperatorItem | null>(null);

  // Edit form state
  const [editUnitNumber, setEditUnitNumber] = useState('');
  const [editMake, setEditMake] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editType, setEditType] = useState<PumpItem['type']>('boom_pump');
  const [editBoomSize, setEditBoomSize] = useState('');
  const [editHorizontalReach, setEditHorizontalReach] = useState('');
  const [editHourlyRate, setEditHourlyRate] = useState('');
  const [editMinHours, setEditMinHours] = useState('');
  const [editStatus, setEditStatus] = useState<PumpItem['status']>('available');
  const [editOperatorId, setEditOperatorId] = useState('none');
  const [editMaintenanceNote, setEditMaintenanceNote] = useState('');
  const [editInspectionDate, setEditInspectionDate] = useState('');

  // Manual numeric bounds validation flags for Edit mode
  const isEditBoomInvalid =
    editType === 'boom_pump' &&
    (editBoomSize.trim() === '' ||
      isNaN(Number(editBoomSize)) ||
      Number(editBoomSize) < 1 ||
      Number(editBoomSize) > 100);

  const isEditReachInvalid =
    editHorizontalReach.trim() !== '' &&
    (isNaN(Number(editHorizontalReach)) ||
      Number(editHorizontalReach) < 0 ||
      Number(editHorizontalReach) > 500);

  const isEditRateInvalid =
    editHourlyRate.trim() !== '' &&
    (isNaN(Number(editHourlyRate)) ||
      Number(editHourlyRate) < 0 ||
      Number(editHourlyRate) > 5000);

  const isEditMinHoursInvalid =
    editMinHours.trim() !== '' &&
    (isNaN(Number(editMinHours)) ||
      Number(editMinHours) < 1 ||
      Number(editMinHours) > 24);

  const isEditYearInvalid =
    editYear.trim() !== '' &&
    (isNaN(Number(editYear)) ||
      Number(editYear) < 1980 ||
      Number(editYear) > 2030);

  // Sync edit state whenever entering edit mode or pump changes
  const startEditing = () => {
    if (!currentPump) return;
    setEditUnitNumber(currentPump.unitNumber);
    setEditMake(currentPump.make);
    setEditModel(currentPump.model);
    setEditYear(currentPump.year || '2024');
    setEditType(currentPump.type);
    setEditBoomSize(
      currentPump.boomSize
        ? String(currentPump.boomSize)
        : currentPump.boomLength?.match(/(\d+)\s*M/i)?.[1] || '38'
    );
    setEditHorizontalReach(
      currentPump.horizontalReach
        ? String(currentPump.horizontalReach)
        : currentPump.boomLength?.match(/\((\d+)\s*ft\)/i)?.[1] || '124'
    );
    setEditHourlyRate(String(parseHourlyRate(currentPump.hourlyRate) || 195));
    setEditMinHours(String(parseMinHours(currentPump.minHours)));
    setEditStatus(currentPump.status);
    setEditOperatorId(
      currentPump.defaultOperator && currentPump.defaultOperator.id !== 'unassigned'
        ? currentPump.defaultOperator.id
        : 'none'
    );
    setEditMaintenanceNote(currentPump.maintenanceNote || '');
    setEditInspectionDate(currentPump.nextInspection?.iso || '');
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPump) return;

    const parse = (value: string) => (value.trim() === '' ? null : Number(value));
    const payload = {
      id: currentPump.id,
      unitNumber: editUnitNumber,
      make: editMake,
      model: editModel,
      year: parse(editYear),
      type: editType,
      boomSize: editType === 'boom_pump' ? parse(editBoomSize) : null,
      horizontalReach: parse(editHorizontalReach),
      hourlyRate: parse(editHourlyRate),
      minHours: parse(editMinHours),
      defaultOperatorId: editOperatorId === 'none' ? null : editOperatorId,
      status: editStatus,
      maintenanceNote: editMaintenanceNote,
      inspectionDate: editInspectionDate,
    };

    const check = updatePumpSchema.safeParse(payload);
    if (!check.success) {
      const first = Object.values(check.error.flatten().fieldErrors).flat()[0];
      toast.error(first ?? 'Please check the form.');
      return;
    }

    setIsSaving(true);
    updatePump(payload)
      .then((result) => {
        if (!reportAction(result, { entity: 'pump', refresh })) return;
        const displayCode =
          editType === 'boom_pump' && editBoomSize.trim()
            ? `${editUnitNumber.trim()} · ${editBoomSize.trim()}M`
            : editUnitNumber.trim();
        toast.success('Equipment details updated', {
          description: `Unit ${displayCode} specifications have been saved.`,
        });
        setIsEditing(false);
      })
      .finally(() => setIsSaving(false));
  };

  const handleDeleteEquipment = () => {
    if (!currentPump) return;
    const unit = currentPump.unitNumber;
    setIsSaving(true);
    deletePump({ id: currentPump.id })
      .then((result) => {
        if (!reportAction(result, { entity: 'pump', refresh })) return;
        setIsDeleteDialogOpen(false);
        onOpenChange(false);
        toast.success('Pump deleted', {
          description: `Unit ${unit} was removed from the active fleet.`,
        });
      })
      .finally(() => setIsSaving(false));
  };

  // Direct operator assignment in view mode
  const handleAssignOperator = (operatorIdToAssign: string) => {
    if (!currentPump) return;
    const operatorId = operatorIdToAssign === 'none' ? null : operatorIdToAssign;
    assignPumpOperator({ id: currentPump.id, operatorId }).then((result) => {
      if (!reportAction(result, { entity: 'pump', refresh })) return;
      const op = operators.find((o) => o.id === operatorId);
      if (op) {
        toast.success('Operator assigned', {
          description: `${op.name} is now the primary operator for unit ${currentPump.unitNumber}.`,
        });
      } else {
        toast.info('Operator unassigned from pump');
      }
    });
  };

  // Open Edit Operator modal for current operator
  const handleEditCurrentOperator = () => {
    if (!currentPump) return;
    const op = operators.find((o) => o.id === currentPump.defaultOperator?.id);
    if (op) setEditingOperator(op);
  };

  if (!currentPump) return null;

  const currentOpInRoster = operators.find((o) => o.id === currentPump.defaultOperator?.id);
  const isUnassigned =
    !currentPump.defaultOperator ||
    currentPump.defaultOperator.id === 'unassigned' ||
    currentPump.defaultOperator.name === 'Unassigned' ||
    currentPump.defaultOperator.name === 'None';

  const operatorSelectOptions = [
    { value: 'none', label: 'None (Unassigned)' },
    ...operators.map((op) => ({
      value: op.id,
      label: `${op.name} (${op.role})`,
    })),
  ];

  return (
    <>
      <Dialog
        open={open}
        onOpenChange={(val) => {
          if (!val) {
            handleClose();
          } else {
            onOpenChange(true);
          }
        }}
      >
        <DialogContent
          showCloseButton={false}
          className="w-full max-w-[calc(100%-1.5rem)] sm:max-w-xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border-slate-200"
        >
          {/* Header */}
          <div className="p-4 sm:p-6 bg-slate-50/70 border-b border-slate-100 flex items-start justify-between gap-3">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-brand shrink-0 mt-0.5">
                <Truck className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                  <DialogTitle className="text-base sm:text-xl font-bold text-slate-900 truncate">
                    {getPumpDisplayName(currentPump)}
                  </DialogTitle>
                  <span className="text-[11px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                    {currentPump.make} {currentPump.model}
                  </span>

                  {/* Status Badge */}
                  {currentPump.todayStatus?.type === 'booked' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200/70 shadow-2xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                      <span>{currentPump.todayStatus?.label || 'Booked'}</span>
                    </span>
                  ) : currentPump.todayStatus?.type === 'available' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 shadow-2xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>{currentPump.todayStatus?.label || 'Available'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-rose-500" />
                      <span>{currentPump.todayStatus?.label || 'Maintenance'}</span>
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {currentPump.typeLabel} &bull; Model Year {currentPump.year || '2024'}
                </p>
              </div>
            </div>

            {/* Header Action Buttons: Prominent Circle Close Cross on top, Edit Rig button directly under it */}
            <div className="flex flex-col items-end gap-2 shrink-0 self-start">
              <ModalCloseButton
                onClick={handleClose}
                aria-label="Close dialog"
              />
              {!isEditing ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={startEditing}
                  className="h-7.5 px-2.5 text-xs font-semibold gap-1 text-slate-700 border-slate-200 hover:border-brand/40 hover:text-brand bg-white shrink-0 cursor-pointer shadow-2xs whitespace-nowrap active:scale-95 transition-all"
                >
                  <Pencil className="h-3 w-3" />
                  <span>Edit Rig</span>
                </Button>
              ) : (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsEditing(false)}
                  className="h-7 px-2 text-xs font-medium text-slate-500 hover:text-slate-800 bg-slate-100 hover:bg-slate-200/80 shrink-0 cursor-pointer whitespace-nowrap active:scale-95 transition-all"
                >
                  <span>Cancel</span>
                </Button>
              )}
            </div>
          </div>

          {/* Navigation Tabs (Specifications vs Documents) */}
          {!isEditing && (
            <div className="flex items-center border-b border-slate-100 px-4 sm:px-6 bg-white gap-3 sm:gap-4 pt-2 overflow-x-auto scrollbar-none">
              <button
                type="button"
                onClick={() => setActiveTab('specs')}
                className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'specs'
                    ? 'border-brand text-brand'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <Truck className="h-3.5 w-3.5" />
                <span>Rig Specifications</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('documents')}
                className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 shrink-0 ${
                  activeTab === 'documents'
                    ? 'border-brand text-brand'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Documents &amp; Records</span>
              </button>
            </div>
          )}

          {/* Body Content */}
          <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 text-xs sm:text-sm">
            {isEditing ? (
              /* ── EDIT PUMP FORM ── */
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-900 text-sm">Edit Rig Information</h3>
                  <span className="text-[11px] text-brand font-semibold">Updating specifications</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 block">Unit Number *</label>
                      <span
                        className={cn(
                          'text-[10px] font-mono transition-colors',
                          editUnitNumber.length >= 15 ? 'text-rose-600 font-bold' : 'text-slate-400'
                        )}
                      >
                        {editUnitNumber.length}/15 chars
                      </span>
                    </div>
                    <Input
                      value={editUnitNumber}
                      maxLength={15}
                      onChange={(e) => setEditUnitNumber(e.target.value)}
                      placeholder="e.g. 01 or P-04"
                      className="h-9 text-xs"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Equipment Type</label>
                    <AppSelect
                      size="sm"
                      value={editType}
                      onChange={(val) => setEditType(val as PumpItem['type'])}
                      options={[
                        { value: 'boom_pump', label: 'Boom Pump' },
                        { value: 'line_pump', label: 'Line Pump' },
                      ]}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center h-5">
                      <label className="text-xs font-semibold text-slate-700 block">Make</label>
                    </div>
                    <Input
                      value={editMake}
                      onChange={(e) => setEditMake(e.target.value)}
                      placeholder="e.g. Putzmeister"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center h-5">
                      <label className="text-xs font-semibold text-slate-700 block">Model</label>
                    </div>
                    <Input
                      value={editModel}
                      onChange={(e) => setEditModel(e.target.value)}
                      placeholder="e.g. BSF 36-4.16 H"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1 h-5">
                      <label className="text-xs font-semibold text-slate-700 block truncate">Model Year</label>
                      <span
                        className={cn(
                          'text-[10px] font-mono transition-colors shrink-0 whitespace-nowrap',
                          isEditYearInvalid ? 'text-rose-600 font-bold' : 'text-slate-400'
                        )}
                      >
                        1980–2030
                      </span>
                    </div>
                    <Input
                      type="number"
                      min={1980}
                      max={2030}
                      value={editYear}
                      onChange={(e) => setEditYear(e.target.value)}
                      placeholder="e.g. 2024"
                      className={cn(
                        'h-9 text-xs',
                        isEditYearInvalid && 'border-rose-500 focus-visible:border-rose-500 bg-rose-50/20'
                      )}
                    />
                    {isEditYearInvalid && (
                      <p className="text-[10px] text-rose-500 font-medium">1980–2030</p>
                    )}
                  </div>
                </div>

                {/* Separate Boom Size, Horizontal Reach, and Numeric Hourly Rate */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1 h-5">
                      <label className="text-xs font-semibold text-slate-700 truncate">Boom Size (M)</label>
                      <span
                        className={cn(
                          'text-[10px] font-mono transition-colors shrink-0 whitespace-nowrap',
                          isEditBoomInvalid ? 'text-rose-600 font-bold' : 'text-slate-400'
                        )}
                      >
                        1–100 M
                      </span>
                    </div>
                    <Input
                      type="number"
                      min={1}
                      max={100}
                      value={editBoomSize}
                      onChange={(e) => setEditBoomSize(e.target.value)}
                      placeholder={editType === 'boom_pump' ? 'e.g. 34' : 'N/A'}
                      disabled={editType === 'line_pump'}
                      className={cn(
                        'h-9 text-xs',
                        isEditBoomInvalid && 'border-rose-500 focus-visible:border-rose-500 bg-rose-50/20'
                      )}
                    />
                    {isEditBoomInvalid && (
                      <p className="text-[11px] text-rose-500 font-medium">1 to 100 meters</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1 h-5">
                      <label className="text-xs font-semibold text-slate-700 truncate">Horiz. Reach (ft)</label>
                      <span
                        className={cn(
                          'text-[10px] font-mono transition-colors shrink-0 whitespace-nowrap',
                          isEditReachInvalid ? 'text-rose-600 font-bold' : 'text-slate-400'
                        )}
                      >
                        0–500 ft
                      </span>
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={500}
                      value={editHorizontalReach}
                      onChange={(e) => setEditHorizontalReach(e.target.value)}
                      placeholder="e.g. 112"
                      className={cn(
                        'h-9 text-xs',
                        isEditReachInvalid && 'border-rose-500 focus-visible:border-rose-500 bg-rose-50/20'
                      )}
                    />
                    {isEditReachInvalid && (
                      <p className="text-[11px] text-rose-500 font-medium">Must be 0 to 500 ft</p>
                    )}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1 h-5">
                      <label className="text-xs font-semibold text-slate-700 truncate">Hourly Rate ($)</label>
                      <span
                        className={cn(
                          'text-[10px] font-mono transition-colors shrink-0 whitespace-nowrap',
                          isEditRateInvalid ? 'text-rose-600 font-bold' : 'text-slate-400'
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
                      value={editHourlyRate}
                      onChange={(e) => setEditHourlyRate(e.target.value)}
                      placeholder="195"
                      className={cn(
                        'h-9 text-xs',
                        isEditRateInvalid && 'border-rose-500 focus-visible:border-rose-500 bg-rose-50/20'
                      )}
                    />
                    {isEditRateInvalid && (
                      <p className="text-[10px] text-rose-500 font-medium">Max $5,000</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between gap-1 h-5">
                      <label className="text-xs font-semibold text-slate-700 block truncate">Min Callout (hrs)</label>
                      <span
                        className={cn(
                          'text-[10px] font-mono transition-colors shrink-0 whitespace-nowrap',
                          isEditMinHoursInvalid ? 'text-rose-600 font-bold' : 'text-slate-400'
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
                      value={editMinHours}
                      onChange={(e) => setEditMinHours(e.target.value)}
                      placeholder="4.0"
                      className={cn(
                        'h-9 text-xs',
                        isEditMinHoursInvalid && 'border-rose-500 focus-visible:border-rose-500 bg-rose-50/20'
                      )}
                    />
                    {isEditMinHoursInvalid && (
                      <p className="text-[10px] text-rose-500 font-medium">1–24 hrs</p>
                    )}
                  </div>
                  <div className="flex flex-col justify-end">
                    <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-50 border border-slate-200/80 text-xs h-9">
                      <span className="text-slate-500 font-medium">Identifier Preview:</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {editUnitNumber.trim()
                          ? (editType === 'boom_pump' && editBoomSize.trim()
                              ? `${editUnitNumber.trim()} · ${editBoomSize.trim()}M`
                              : `${editUnitNumber.trim()} · Line`)
                          : '—'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Operator Selector + Add/Edit Operator buttons */}
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-brand" />
                      <span>Default Operator Assignment</span>
                    </label>
                    <div className="flex items-center gap-2 flex-wrap">
                      {editOperatorId !== 'none' && (
                        <button
                          type="button"
                          onClick={() => {
                            const opToEdit = operators.find((o) => o.id === editOperatorId);
                            if (opToEdit) setEditingOperator(opToEdit);
                          }}
                          className="text-xs font-semibold text-slate-600 hover:text-brand hover:underline inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Pencil className="h-3 w-3" />
                          <span>Edit Operator</span>
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsAddOperatorOpen(true)}
                        className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1 cursor-pointer"
                      >
                        <UserPlus className="h-3 w-3" />
                        <span>+ New Operator</span>
                      </button>
                    </div>
                  </div>

                  <AppSelect
                    size="sm"
                    value={editOperatorId}
                    onChange={setEditOperatorId}
                    options={operatorSelectOptions}
                  />
                </div>

                {/* Equipment Status */}
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Equipment Status</label>
                  <AppSelect
                    size="sm"
                    value={editStatus}
                    onChange={(val) => setEditStatus(val as PumpItem['status'])}
                    options={[
                      { value: 'available', label: 'Available (Yard Ready)' },
                      { value: 'maintenance', label: 'In Maintenance' },
                    ]}
                  />
                </div>

                {editStatus === 'maintenance' && (
                  <div className="space-y-1 p-3 rounded-xl bg-amber-50/70 border border-amber-200/80">
                    <label className="text-xs font-semibold text-amber-900 block">Maintenance Service Note</label>
                    <Input
                      value={editMaintenanceNote}
                      onChange={(e) => setEditMaintenanceNote(e.target.value)}
                      placeholder="e.g. Hydraulic pump service & annual boom ultrasonic check"
                      className="h-9 text-xs bg-white"
                    />
                  </div>
                )}

                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-700 block">Next DOT Inspection Date</label>
                  <DatePicker
                    size="sm"
                    ariaLabel="Next DOT inspection date"
                    value={editInspectionDate}
                    onChange={setEditInspectionDate}
                    placeholder="Pick an inspection date"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsEditing(false)}
                    className="h-8 text-xs font-semibold cursor-pointer"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="brand"
                    size="sm"
                    disabled={isSaving}
                    className="h-8 text-xs font-semibold cursor-pointer"
                  >
                    {isSaving ? 'Saving...' : 'Save specifications'}
                  </Button>
                </div>
              </form>
            ) : activeTab === 'specs' ? (
              /* ── SPECIFICATIONS TAB ── */
              <div className="space-y-5">
                {/* Inspection Alert if in Inspection Mode */}
                {inspectionMode && (
                  <div className="p-4 rounded-xl bg-amber-50/90 border border-amber-200/90 flex items-start gap-3 shadow-2xs">
                    <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <h5 className="font-bold text-amber-950 text-xs sm:text-sm">
                        Inspection Due Soon &bull; Action Required
                      </h5>
                      <p className="text-xs text-amber-900/90 mt-1 leading-relaxed">
                        <strong>{currentPump.unitNumber}</strong> is scheduled for mandatory DOT inspection on{' '}
                        <strong>{currentPump.nextInspection?.date || 'Upcoming'}</strong>. Ensure rig is available at Warren Yard.
                      </p>
                    </div>
                  </div>
                )}

                {/* Maintenance Notice if in Maintenance */}
                {currentPump.inMaintenance && (
                  <div className="p-3.5 rounded-xl bg-amber-50/90 border border-amber-200/90 flex items-start gap-2.5 text-xs text-amber-950">
                    <Wrench className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-amber-900">In Maintenance</p>
                      <p className="text-amber-800/90 mt-0.5">
                        {currentPump.maintenanceNote || 'Currently flagged for scheduled maintenance service.'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Section 1: Specifications */}
                <div className="rounded-xl border border-slate-200/80 p-3.5 sm:p-4 bg-white shadow-2xs space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                      <Truck className="h-3.5 w-3.5 text-brand" />
                      <span>Rig Specifications</span>
                    </h4>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={startEditing}
                      className="h-7 px-2 text-xs text-brand hover:text-brand hover:bg-brand-light gap-1 font-semibold cursor-pointer"
                    >
                      <Pencil className="h-3 w-3" />
                      <span>Edit</span>
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Boom Size (Meters)</span>
                      <span className="font-semibold text-slate-800">
                        {currentPump.boomSize ? `${currentPump.boomSize}M` : 'N/A'}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Horizontal Reach (Feet)</span>
                      <span className="font-semibold text-slate-800">
                        {currentPump.horizontalReach ? `${currentPump.horizontalReach} ft` : currentPump.boomLength}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Hourly Billing Rate</span>
                      <span className="font-semibold text-slate-800 font-mono">
                        {currentPump.hourlyRate === '' ? 'Not set' : formatHourlyRate(currentPump.hourlyRate)}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Minimum Callout</span>
                      <span className="font-semibold text-slate-800">{formatMinHours(currentPump.minHours)}</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Assigned Operator (Fully Functionally Complete) */}
                <div className="rounded-xl border border-slate-200/80 p-3.5 sm:p-4 bg-white shadow-2xs space-y-3 sm:space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                      <User className="h-3.5 w-3.5 text-brand" />
                      <span>Default Operator Assignment</span>
                    </h4>

                    {/* Operator Action Buttons */}
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {!isUnassigned && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={handleEditCurrentOperator}
                          className="h-7 px-2 text-xs text-slate-700 hover:text-brand hover:bg-brand-light gap-1 font-semibold cursor-pointer"
                        >
                          <Pencil className="h-3 w-3 text-slate-500" />
                          <span>Edit operator</span>
                        </Button>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsAddOperatorOpen(true)}
                        className="h-7 px-2 text-xs text-brand hover:text-brand hover:bg-brand-light gap-1 font-semibold cursor-pointer"
                      >
                        <UserPlus className="h-3 w-3" />
                        <span>+ New operator</span>
                      </Button>
                    </div>
                  </div>

                  {!isUnassigned ? (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-lg bg-slate-50/70 border border-slate-100">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="h-9 w-9 rounded-full bg-brand-light text-brand flex items-center justify-center font-bold text-xs border border-brand/20 shrink-0">
                          {currentPump.defaultOperator?.name?.charAt(0) || 'O'}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-slate-900 text-sm truncate">
                              {currentPump.defaultOperator?.name}
                            </span>
                            {currentOpInRoster && (
                              <Link
                                href={`/operators/${currentOpInRoster.id}`}
                                className="text-slate-400 hover:text-brand p-0.5"
                                title="Open full operator dossier"
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Link>
                            )}
                          </div>
                          <p className="text-xs text-slate-500 mt-0.5 truncate">
                            {currentPump.defaultOperator?.role || 'Operator'} &bull;{' '}
                            {currentOpInRoster?.phone || '(207) 555-0168'}
                          </p>
                        </div>
                      </div>

                      {/* Quick Reassign Dropdown */}
                      <div className="w-full sm:w-36 shrink-0">
                        <AppSelect
                          size="sm"
                          value={currentPump.defaultOperator?.id || 'none'}
                          onChange={handleAssignOperator}
                          options={operatorSelectOptions}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 p-3 rounded-lg bg-amber-50/50 border border-amber-200/60 text-xs">
                      <div className="flex items-center gap-2 text-amber-900">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>No default operator assigned to this rig.</span>
                      </div>
                      <div className="w-full sm:w-40 shrink-0">
                        <AppSelect
                          size="sm"
                          value="none"
                          onChange={handleAssignOperator}
                          options={operatorSelectOptions}
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Section 3: Inspections */}
                <div
                  className={`rounded-xl border p-4 bg-white shadow-2xs space-y-3 transition-all ${
                    inspectionMode
                      ? 'border-2 border-amber-400 bg-amber-50/20'
                      : 'border-slate-200/80'
                  }`}
                >
                  <h4 className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
                    <span>Compliance &amp; Next Inspection</span>
                  </h4>
                  <div className="flex items-center justify-between text-xs">
                    <div>
                      <span className="text-slate-400 block text-[11px]">Scheduled Date</span>
                      <span className="font-semibold text-slate-800">
                        {currentPump.nextInspection?.date || 'Dec 15, 2026'}
                      </span>
                    </div>
                    {currentPump.nextInspection?.dueSoon ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                        <AlertTriangle className="h-3 w-3 text-amber-600" />
                        <span>Due soon</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                        <ShieldCheck className="h-3 w-3 text-emerald-600" />
                        <span>Compliant</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              /* ── DOCUMENTS & RECORDS TAB (not saved in V1) ── */
              <div className="space-y-4">
                <div>
                  <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Equipment documents</h4>
                  <p className="text-[11px] text-slate-500">
                    DOT inspection certs, boom structural reports, and registration.
                  </p>
                </div>
                <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-2">
                  <FileText className="h-8 w-8 text-slate-300 mx-auto" />
                  <p className="text-xs font-semibold text-slate-700">No documents on file for this rig</p>
                  <p className="text-[11px] text-slate-500">
                    Document uploads are coming in a later release.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-3.5 sm:p-4 bg-slate-50 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2.5">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setIsDeleteDialogOpen(true)}
                className="h-8 text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-1.5 cursor-pointer"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete pump</span>
              </Button>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href="/schedule"
                className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1 mr-1 sm:mr-2"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span className="hidden xs:inline sm:inline">Dispatch schedule</span>
              </Link>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 px-3 text-xs font-semibold cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Equipment Confirmation Dialog (soft delete: the record is kept) */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl">
          <DialogHeader>
            <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-2">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
              Delete unit {currentPump.unitNumber}?
            </DialogTitle>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              <strong>
                {currentPump.unitNumber} ({currentPump.make} {currentPump.model})
              </strong>{' '}
              will be removed from the active fleet. Its history is kept.
            </p>
          </DialogHeader>

          <div className="flex items-center justify-end gap-2.5 pt-4 border-t border-slate-100">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteDialogOpen(false)}
              className="h-9 px-4 text-xs font-semibold cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              size="sm"
              disabled={isSaving}
              onClick={handleDeleteEquipment}
              className="h-9 px-4 text-xs font-semibold cursor-pointer bg-rose-600 hover:bg-rose-700 text-white"
            >
              {isSaving ? 'Deleting...' : 'Delete pump'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nested Add Operator Modal */}
      <AddOperatorModal
        open={isAddOperatorOpen}
        onOpenChange={setIsAddOperatorOpen}
        pumps={pumps}
        branchOptions={branchOptions}
        initialPumpId={currentPump.id}
        onCreated={(newOpId) => {
          if (isEditing) setEditOperatorId(newOpId);
        }}
      />

      {/* Nested Edit Operator Modal */}
      <EditOperatorModal
        operator={editingOperator}
        open={!!editingOperator}
        onOpenChange={(val) => {
          if (!val) setEditingOperator(null);
        }}
        pumps={pumps}
        branchOptions={branchOptions}
      />
    </>
  );
}
