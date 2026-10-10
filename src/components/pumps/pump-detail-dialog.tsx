'use client';

import React, { useState, useRef } from 'react';
import Link from 'next/link';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AppSelect } from '@/components/ui/app-select';
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
  Plus,
  FileText,
  Download,
  X,
  FileCheck,
  UserPlus,
  UploadCloud,
} from 'lucide-react';
import {
  PumpItem,
  usePumps,
  updatePump,
  deletePump,
  addPumpDocument,
  deletePumpDocument,
} from '@/lib/pumps-store';
import { useOperators, OperatorItem } from '@/lib/operators-store';
import { AddOperatorModal } from '@/components/operators/add-operator-modal';
import { EditOperatorModal } from '@/components/operators/edit-operator-modal';
import { toast } from 'sonner';

interface PumpDetailDialogProps {
  pump: PumpItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  inspectionMode?: boolean;
}

const DOCUMENT_TYPES = [
  'DOT Inspection',
  'Boom Certificate',
  'Insurance Policy',
  'Vehicle Registration',
  'Maintenance Log',
  'Safety Certification',
  'Other',
];

export function PumpDetailDialog({
  pump,
  open,
  onOpenChange,
  inspectionMode = false,
}: PumpDetailDialogProps) {
  const allPumps = usePumps();
  const operators = useOperators();

  // Always bind to the active reactive pump instance from store
  const currentPump = (pump ? allPumps.find((p) => p.id === pump.id) : null) || pump;

  const [activeTab, setActiveTab] = useState<'specs' | 'documents'>('specs');
  const [isEditing, setIsEditing] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isAddingDoc, setIsAddingDoc] = useState(false);

  // Operator Modals
  const [isAddOperatorOpen, setIsAddOperatorOpen] = useState(false);
  const [editingOperator, setEditingOperator] = useState<OperatorItem | null>(null);

  // Edit form state
  const [editUnitNumber, setEditUnitNumber] = useState('');
  const [editMake, setEditMake] = useState('');
  const [editModel, setEditModel] = useState('');
  const [editYear, setEditYear] = useState('');
  const [editType, setEditType] = useState<PumpItem['type']>('boom_pump');
  const [editBoomLength, setEditBoomLength] = useState('');
  const [editHourlyRate, setEditHourlyRate] = useState('');
  const [editMinHours, setEditMinHours] = useState('');
  const [editStatus, setEditStatus] = useState<PumpItem['status']>('available');
  const [editOperatorId, setEditOperatorId] = useState('none');
  const [editMaintenanceNote, setEditMaintenanceNote] = useState('');
  const [editInspectionDate, setEditInspectionDate] = useState('');

  // New Document Form state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [docName, setDocName] = useState('');
  const [docType, setDocType] = useState('DOT Inspection');
  const [docIssueDate, setDocIssueDate] = useState('');
  const [docExpiryDate, setDocExpiryDate] = useState('');
  const [selectedFileName, setSelectedFileName] = useState('');
  const [selectedFileSize, setSelectedFileSize] = useState('1.8 MB');

  // Sync edit state whenever entering edit mode or pump changes
  const startEditing = () => {
    if (!currentPump) return;
    setEditUnitNumber(currentPump.unitNumber);
    setEditMake(currentPump.make);
    setEditModel(currentPump.model);
    setEditYear(currentPump.year || '2024');
    setEditType(currentPump.type);
    setEditBoomLength(currentPump.boomLength);
    setEditHourlyRate(currentPump.hourlyRate);
    setEditMinHours(currentPump.minHours);
    setEditStatus(currentPump.status);
    setEditOperatorId(currentPump.defaultOperator?.id || 'none');
    setEditMaintenanceNote(currentPump.maintenanceNote || '');
    setEditInspectionDate(currentPump.nextInspection?.date || 'Dec 15, 2026');
    setIsEditing(true);
  };

  const handleSaveEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPump) return;
    if (!editUnitNumber.trim()) {
      toast.error('Unit number is required');
      return;
    }

    const matchedOp = editOperatorId !== 'none'
      ? operators.find((op) => op.id === editOperatorId)
      : null;

    const assignedOp = matchedOp
      ? {
          id: matchedOp.id,
          name: matchedOp.name,
          role: matchedOp.role,
          badge: null,
        }
      : editOperatorId === 'none'
      ? {
          id: 'unassigned',
          name: 'Unassigned',
          role: 'None',
          badge: null,
        }
      : currentPump.defaultOperator;

    const typeLabel =
      editType === 'boom_pump'
        ? `Boom pump · ${editBoomLength.split(' ')[0] || 'Standard'}`
        : 'Line pump';

    const inMaintenance = editStatus === 'maintenance';
    const todayStatus =
      editStatus === 'booked'
        ? { type: 'booked' as const, label: 'Booked · On Job' }
        : editStatus === 'maintenance'
        ? { type: 'maintenance' as const, label: 'Maintenance · Unavailable' }
        : { type: 'available' as const, label: 'Available · Yard Ready' };

    updatePump(currentPump.id, {
      unitNumber: editUnitNumber.trim(),
      make: editMake.trim() || currentPump.make,
      model: editModel.trim() || currentPump.model,
      year: editYear.trim() || currentPump.year,
      type: editType,
      typeLabel,
      boomLength: editBoomLength.trim() || currentPump.boomLength,
      hourlyRate: editHourlyRate.trim() || currentPump.hourlyRate,
      minHours: editMinHours.trim() || currentPump.minHours,
      status: editStatus,
      inMaintenance,
      maintenanceNote: inMaintenance ? editMaintenanceNote.trim() : undefined,
      defaultOperator: assignedOp,
      todayStatus,
      nextInspection: {
        date: editInspectionDate.trim() || currentPump.nextInspection?.date || 'Dec 15, 2026',
        dueSoon: currentPump.nextInspection?.dueSoon || false,
      },
    });

    toast.success('Equipment details updated', {
      description: `Unit ${editUnitNumber} specifications have been saved.`,
    });
    setIsEditing(false);
  };

  const handleDeleteEquipment = () => {
    if (!currentPump) return;
    const unit = currentPump.unitNumber;
    deletePump(currentPump.id);
    setIsDeleteDialogOpen(false);
    onOpenChange(false);
    toast.success('Equipment deleted', {
      description: `Unit ${unit} has been removed from fleet.`,
    });
  };

  // Direct Operator assignment in view mode
  const handleAssignOperator = (operatorIdToAssign: string) => {
    if (!currentPump) return;
    if (operatorIdToAssign === 'none') {
      updatePump(currentPump.id, {
        defaultOperator: {
          id: 'unassigned',
          name: 'Unassigned',
          role: 'None',
          badge: null,
        },
      });
      toast.info('Operator unassigned from pump');
      return;
    }

    const op = operators.find((o) => o.id === operatorIdToAssign);
    if (op) {
      updatePump(currentPump.id, {
        defaultOperator: {
          id: op.id,
          name: op.name,
          role: op.role,
          badge: null,
        },
      });
      toast.success('Operator assigned', {
        description: `${op.name} is now the primary operator for unit ${currentPump.unitNumber}.`,
      });
    }
  };

  // Open Edit Operator modal for current operator
  const handleEditCurrentOperator = () => {
    if (!currentPump) return;
    const op = operators.find((o) => o.id === currentPump.defaultOperator?.id);
    if (op) {
      setEditingOperator(op);
    } else {
      // If operator not found in roster (e.g. legacy name), create mock object
      setEditingOperator({
        id: currentPump.defaultOperator?.id || `op-${Date.now()}`,
        name: currentPump.defaultOperator?.name || 'Operator',
        role: currentPump.defaultOperator?.role || 'Operator',
        phone: '(207) 555-0100',
        email: `${(currentPump.defaultOperator?.name || 'operator').toLowerCase().replace(/\s+/g, '')}@midcoast.example`,
        branch: 'Warren',
        defaultPump: currentPump.unitNumber,
        todayStatus: { type: 'available', label: 'Available' },
        status: 'Active',
        emergencyContact: { name: 'Not provided', relationship: 'Not provided', phone: 'Not provided' },
        emergencyContacts: [],
      });
    }
  };

  // File picker handler
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSelectedFileName(file.name);
    const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
    setSelectedFileSize(Number(sizeMb) > 0 ? `${sizeMb} MB` : `${Math.round(file.size / 1024)} KB`);
    if (!docName.trim()) {
      setDocName(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleAddDocument = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPump) return;

    const finalDocName =
      docName.trim() ||
      selectedFileName ||
      `${docType} - ${currentPump.unitNumber} (${new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })})`;

    addPumpDocument(currentPump.id, {
      name: finalDocName,
      type: docType,
      issueDate:
        docIssueDate.trim() ||
        new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
      expiryDate: docExpiryDate.trim() || undefined,
      fileSize: selectedFileSize || '1.8 MB',
    });

    toast.success('Document uploaded successfully', {
      description: `${finalDocName} has been attached to unit ${currentPump.unitNumber}.`,
    });

    setDocName('');
    setDocType('DOT Inspection');
    setDocIssueDate('');
    setDocExpiryDate('');
    setSelectedFileName('');
    setIsAddingDoc(false);
    setActiveTab('documents');
  };

  const handleDeleteDoc = (docId: string, docTitle: string) => {
    if (!currentPump) return;
    deletePumpDocument(currentPump.id, docId);
    toast.success('Document removed', {
      description: `${docTitle} has been deleted.`,
    });
  };

  const handleDownloadDoc = (docTitle: string) => {
    toast.info(`Downloading ${docTitle}`, {
      description: 'Document file package generated from compliance repository.',
    });
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
            setIsEditing(false);
            setIsAddingDoc(false);
          }
          onOpenChange(val);
        }}
      >
        <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto p-0 gap-0 rounded-2xl border-slate-200">
          {/* Header */}
          <div className="p-5 sm:p-6 pr-14 sm:pr-16 bg-slate-50/70 border-b border-slate-100 flex items-start justify-between gap-3.5">
            <div className="flex items-start gap-3.5 min-w-0 flex-1">
              <div className="h-11 w-11 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-center text-brand shrink-0 mt-0.5">
                <Truck className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-lg sm:text-xl font-bold text-slate-900 truncate">
                    {currentPump.unitNumber}
                  </DialogTitle>
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-200/70 text-slate-700">
                    {currentPump.make} {currentPump.model}
                  </span>

                  {/* Status Badge */}
                  {currentPump.todayStatus?.type === 'booked' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-800 border border-teal-200/70 shadow-2xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-teal-600" />
                      <span>{currentPump.todayStatus?.label || 'Booked'}</span>
                    </span>
                  ) : currentPump.todayStatus?.type === 'available' ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/70 shadow-2xs">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <span>{currentPump.todayStatus?.label || 'Available'}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/80 shadow-2xs">
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

            {/* Quick Edit button right at top header */}
            {!isEditing && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={startEditing}
                className="h-8 px-2.5 text-xs font-semibold gap-1 text-slate-700 border-slate-200 hover:border-brand/40 hover:text-brand bg-white shrink-0 cursor-pointer shadow-2xs"
              >
                <Pencil className="h-3 w-3" />
                <span>Edit Rig</span>
              </Button>
            )}
          </div>

          {/* Navigation Tabs (Specifications vs Documents) */}
          {!isEditing && (
            <div className="flex items-center border-b border-slate-100 px-6 bg-white gap-4 pt-2">
              <button
                type="button"
                onClick={() => setActiveTab('specs')}
                className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
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
                className={`pb-2.5 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                  activeTab === 'documents'
                    ? 'border-brand text-brand'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                <FileText className="h-3.5 w-3.5" />
                <span>Documents &amp; Records</span>
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                  {currentPump.documents?.length || 0}
                </span>
              </button>
            </div>
          )}

          {/* Body Content */}
          <div className="p-6 space-y-5 text-xs sm:text-sm">
            {isEditing ? (
              /* ── EDIT PUMP FORM ── */
              <form onSubmit={handleSaveEdit} className="space-y-4">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <h3 className="font-bold text-slate-900 text-sm">Edit Rig Information</h3>
                  <span className="text-[11px] text-brand font-semibold">Updating specifications</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Unit Number *</label>
                    <Input
                      value={editUnitNumber}
                      onChange={(e) => setEditUnitNumber(e.target.value)}
                      placeholder="e.g. 01 · 34M"
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
                    <label className="text-xs font-semibold text-slate-700 block">Make</label>
                    <Input
                      value={editMake}
                      onChange={(e) => setEditMake(e.target.value)}
                      placeholder="e.g. Putzmeister"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Model</label>
                    <Input
                      value={editModel}
                      onChange={(e) => setEditModel(e.target.value)}
                      placeholder="e.g. BSF 36-4.16 H"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Model Year</label>
                    <Input
                      value={editYear}
                      onChange={(e) => setEditYear(e.target.value)}
                      placeholder="e.g. 2024"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Boom Reach / Size</label>
                    <Input
                      value={editBoomLength}
                      onChange={(e) => setEditBoomLength(e.target.value)}
                      placeholder="e.g. 34M (112 ft)"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Hourly Rate</label>
                    <Input
                      value={editHourlyRate}
                      onChange={(e) => setEditHourlyRate(e.target.value)}
                      placeholder="e.g. $195 / hr"
                      className="h-9 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 block">Min Callout Hours</label>
                    <Input
                      value={editMinHours}
                      onChange={(e) => setEditMinHours(e.target.value)}
                      placeholder="e.g. 4.0 hrs"
                      className="h-9 text-xs"
                    />
                  </div>
                </div>

                {/* Operator Selector + Add/Edit Operator buttons */}
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-brand" />
                      <span>Default Operator Assignment</span>
                    </label>
                    <div className="flex items-center gap-2">
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
                      { value: 'booked', label: 'Booked (On Job)' },
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
                  <Input
                    value={editInspectionDate}
                    onChange={(e) => setEditInspectionDate(e.target.value)}
                    placeholder="e.g. Dec 8, 2026"
                    className="h-9 text-xs"
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
                    className="h-8 text-xs font-semibold cursor-pointer"
                  >
                    Save Specifications
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
                <div className="rounded-xl border border-slate-200/80 p-4 bg-white shadow-2xs space-y-3">
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
                      <span className="text-slate-400 block text-[11px]">Boom Reach / Type</span>
                      <span className="font-semibold text-slate-800">{currentPump.boomLength}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Equipment Type</span>
                      <span className="font-semibold text-slate-800 capitalize">
                        {currentPump.type.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Hourly Billing Rate</span>
                      <span className="font-semibold text-slate-800">{currentPump.hourlyRate}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[11px]">Minimum Callout</span>
                      <span className="font-semibold text-slate-800">{currentPump.minHours}</span>
                    </div>
                  </div>
                </div>

                {/* Section 2: Assigned Operator (Fully Functionally Complete) */}
                <div className="rounded-xl border border-slate-200/80 p-4 bg-white shadow-2xs space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-slate-900 flex items-center gap-2 text-xs">
                      <User className="h-3.5 w-3.5 text-brand" />
                      <span>Default Operator Assignment</span>
                    </h4>

                    {/* Operator Action Buttons */}
                    <div className="flex items-center gap-1.5">
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
                    <div className="flex items-start justify-between gap-3 p-3 rounded-lg bg-slate-50/70 border border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="h-9 w-9 rounded-full bg-brand-light text-brand flex items-center justify-center font-bold text-xs border border-brand/20 shrink-0">
                          {currentPump.defaultOperator?.name?.charAt(0) || 'O'}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-900 text-sm">
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
                          <p className="text-xs text-slate-500 mt-0.5">
                            {currentPump.defaultOperator?.role || 'Operator'} &bull;{' '}
                            {currentOpInRoster?.phone || '(207) 555-0168'}
                          </p>
                        </div>
                      </div>

                      {/* Quick Reassign Dropdown */}
                      <div className="w-36 shrink-0">
                        <AppSelect
                          size="sm"
                          value={currentPump.defaultOperator?.id || 'none'}
                          onChange={handleAssignOperator}
                          options={operatorSelectOptions}
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-amber-50/50 border border-amber-200/60 text-xs">
                      <div className="flex items-center gap-2 text-amber-900">
                        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                        <span>No default operator assigned to this rig.</span>
                      </div>
                      <div className="w-40 shrink-0">
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
                      ? 'border-amber-300 ring-2 ring-amber-200/60'
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
              /* ── DOCUMENTS & RECORDS TAB ── */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-slate-900 text-xs sm:text-sm">Equipment Documents</h4>
                    <p className="text-[11px] text-slate-500">
                      DOT inspection certs, boom structural reports, and registration.
                    </p>
                  </div>

                  {!isAddingDoc && (
                    <Button
                      type="button"
                      variant="brand"
                      size="sm"
                      onClick={() => setIsAddingDoc(true)}
                      className="h-8 text-xs font-semibold gap-1.5 cursor-pointer shadow-2xs"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      <span>Add Document</span>
                    </Button>
                  )}
                </div>

                {/* Add Document Expandable Form */}
                {isAddingDoc && (
                  <form
                    onSubmit={handleAddDocument}
                    className="p-4 rounded-xl bg-slate-50/90 border border-slate-200 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                        <FileCheck className="h-4 w-4 text-brand" />
                        <span>Upload New Document</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setIsAddingDoc(false)}
                        className="text-slate-400 hover:text-slate-600 p-0.5 rounded cursor-pointer"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    {/* Hidden actual file input */}
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      className="hidden"
                    />

                    {/* File Attachment selector */}
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border border-dashed border-slate-300 rounded-lg p-3 bg-white text-center hover:border-brand cursor-pointer transition-colors"
                    >
                      <UploadCloud className="h-5 w-5 text-slate-400 mx-auto mb-1" />
                      {selectedFileName ? (
                        <p className="text-xs font-semibold text-brand">
                          Attached: {selectedFileName} ({selectedFileSize})
                        </p>
                      ) : (
                        <p className="text-xs text-slate-600">
                          Click to choose file or leave to attach simulated certificate
                        </p>
                      )}
                    </div>

                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-700 block">
                        Document Title (Optional &bull; Defaults to document type)
                      </label>
                      <Input
                        value={docName}
                        onChange={(e) => setDocName(e.target.value)}
                        placeholder={`e.g. ${docType} 2026`}
                        className="h-8 text-xs bg-white"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-700 block">Type</label>
                        <AppSelect
                          size="sm"
                          value={docType}
                          onChange={setDocType}
                          options={DOCUMENT_TYPES.map((t) => ({ value: t, label: t }))}
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-700 block">Issue Date</label>
                        <Input
                          value={docIssueDate}
                          onChange={(e) => setDocIssueDate(e.target.value)}
                          placeholder="e.g. Oct 10, 2026"
                          className="h-8 text-xs bg-white"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[11px] font-semibold text-slate-700 block">Expiration Date</label>
                        <Input
                          value={docExpiryDate}
                          onChange={(e) => setDocExpiryDate(e.target.value)}
                          placeholder="e.g. Oct 10, 2027"
                          className="h-8 text-xs bg-white"
                        />
                      </div>
                    </div>

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200/60">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsAddingDoc(false)}
                        className="h-7 text-xs font-semibold cursor-pointer"
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        variant="brand"
                        size="sm"
                        className="h-7 text-xs font-semibold cursor-pointer"
                      >
                        Upload Document
                      </Button>
                    </div>
                  </form>
                )}

                {/* Documents List */}
                {currentPump.documents && currentPump.documents.length > 0 ? (
                  <div className="space-y-2">
                    {currentPump.documents.map((doc) => (
                      <div
                        key={doc.id}
                        className="p-3 rounded-xl bg-white border border-slate-200/80 shadow-2xs hover:border-slate-300 transition-all flex items-center justify-between gap-3"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="h-9 w-9 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-slate-700 shrink-0">
                            <FileText className="h-4.5 w-4.5 text-brand" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h5 className="font-semibold text-xs sm:text-sm text-slate-900 truncate">
                              {doc.name}
                            </h5>
                            <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500 flex-wrap">
                              <span className="font-semibold px-1.5 py-0.2 rounded bg-slate-100 text-slate-700">
                                {doc.type}
                              </span>
                              <span>&bull;</span>
                              <span>{doc.fileSize}</span>
                              {doc.expiryDate && (
                                <>
                                  <span>&bull;</span>
                                  <span className="text-slate-600">Expires: {doc.expiryDate}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleDownloadDoc(doc.name)}
                            className="p-1.5 text-slate-400 hover:text-brand hover:bg-brand-light rounded-md transition-colors cursor-pointer"
                            title="Download document"
                          >
                            <Download className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDoc(doc.id, doc.name)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                            title="Delete document"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200 space-y-2">
                    <FileText className="h-8 w-8 text-slate-300 mx-auto" />
                    <p className="text-xs font-semibold text-slate-700">No documents on file for this rig</p>
                    <p className="text-[11px] text-slate-500">
                      Upload DOT inspections, annual boom tests, or registration papers.
                    </p>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setIsAddingDoc(true)}
                      className="mt-2 h-7 text-xs font-semibold cursor-pointer"
                    >
                      <Plus className="h-3 w-3 mr-1" />
                      Add first document
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
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
                className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1 mr-2"
              >
                <Calendar className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Dispatch schedule</span>
              </Link>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onOpenChange(false)}
                className="h-8 text-xs font-semibold cursor-pointer"
              >
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Equipment Confirmation Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md p-6 rounded-2xl bg-white border border-slate-200 shadow-2xl">
          <DialogHeader>
            <div className="h-10 w-10 rounded-xl bg-rose-50 border border-rose-200 text-rose-600 flex items-center justify-center mb-2">
              <Trash2 className="h-5 w-5" />
            </div>
            <DialogTitle className="text-base sm:text-lg font-bold text-slate-900">
              Delete Unit {currentPump.unitNumber}?
            </DialogTitle>
            <p className="text-xs text-slate-500 mt-1 leading-relaxed">
              Are you sure you want to delete <strong>{currentPump.unitNumber} ({currentPump.make} {currentPump.model})</strong>? This will permanently remove this equipment from your active fleet and dispatch scheduling.
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
              onClick={handleDeleteEquipment}
              className="h-9 px-4 text-xs font-semibold cursor-pointer bg-rose-600 hover:bg-rose-700 text-white"
            >
              Delete Equipment
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nested Add Operator Modal */}
      <AddOperatorModal
        open={isAddOperatorOpen}
        onOpenChange={setIsAddOperatorOpen}
        defaultAssignedPump={currentPump.unitNumber}
        onCreated={(newOp) => {
          handleAssignOperator(newOp.id);
          if (isEditing) {
            setEditOperatorId(newOp.id);
          }
        }}
      />

      {/* Nested Edit Operator Modal */}
      <EditOperatorModal
        operator={editingOperator}
        open={!!editingOperator}
        onOpenChange={(val) => {
          if (!val) setEditingOperator(null);
        }}
        onSaved={(updatedOp) => {
          if (currentPump.defaultOperator?.id === updatedOp.id) {
            updatePump(currentPump.id, {
              defaultOperator: {
                id: updatedOp.id,
                name: updatedOp.name,
                role: updatedOp.role,
                badge: null,
              },
            });
          }
        }}
      />
    </>
  );
}
