'use client';

import { useSyncExternalStore } from 'react';

export type EquipmentType = 'all' | 'boom_pump' | 'line_pump';
export type EquipmentStatus = 'all' | 'available' | 'booked' | 'maintenance';

export interface DefaultOperatorInfo {
  id: string;
  name: string;
  role: string;
  badge?: string | null;
}

export interface TodayAvailability {
  type: 'booked' | 'available' | 'maintenance';
  label: string;
}

export interface NextInspectionInfo {
  date: string;
  dueSoon?: boolean;
}

export interface PumpDocument {
  id: string;
  name: string;
  type: string;
  issueDate?: string;
  expiryDate?: string;
  fileSize?: string;
  uploadedAt: string;
}

export interface PumpItem {
  id: string;
  unitNumber: string; // Alphanumeric unit identifier (e.g. '01', '02', 'P-04'), max 15 chars
  make: string;
  model: string;
  type: 'boom_pump' | 'line_pump';
  typeLabel: string;
  boomSize?: number; // Boom size in meters (e.g. 34, 28, 47)
  horizontalReach?: number; // Horizontal reach in feet (e.g. 111, 91, 154, 500)
  boomLength: string; // Formatted reach summary (e.g. "34M (111 ft)")
  defaultOperator: DefaultOperatorInfo;
  todayStatus: TodayAvailability;
  nextInspection: NextInspectionInfo;
  status: 'available' | 'booked' | 'maintenance';
  hourlyRate: number | string; // Number only (e.g. 195)
  minHours: string | number; // Number of hours (e.g. 4.0)
  inMaintenance: boolean;
  maintenanceNote?: string;
  year?: string;
  documents?: PumpDocument[];
}

/**
 * Returns dynamic pump display label (e.g. "01 · 34M", "02 · 28M", or "04 · Line")
 * derived directly from Unit Number and Boom Size number as requested.
 */
export function getPumpDisplayName(pump: {
  unitNumber: string;
  boomSize?: number;
  type?: string;
  boomLength?: string;
}): string {
  if (!pump) return '';
  const rawUnit = pump.unitNumber || '';
  const cleanUnit = rawUnit.includes('·')
    ? rawUnit.split('·')[0].trim()
    : rawUnit.trim();

  if (pump.boomSize && Number(pump.boomSize) > 0) {
    return `${cleanUnit} · ${pump.boomSize}M`;
  }
  const match = pump.boomLength?.match(/(\d+)\s*M/i);
  if (match) {
    return `${cleanUnit} · ${match[1]}M`;
  }
  if (pump.type === 'line_pump' || pump.boomLength?.toLowerCase().includes('line')) {
    return `${cleanUnit} · Line`;
  }
  return cleanUnit;
}

/**
 * Formats numeric or string hourly rate to standard display string (e.g. "$195 / hr")
 */
export function formatHourlyRate(rate: number | string | undefined | null): string {
  if (rate === undefined || rate === null || rate === '') return '$0 / hr';
  if (typeof rate === 'number') return `$${rate} / hr`;
  const clean = String(rate).replace(/[^0-9.]/g, '');
  return clean ? `$${clean} / hr` : '$0 / hr';
}

/**
 * Parses numeric hourly rate from number or string
 */
export function parseHourlyRate(rate: number | string | undefined | null): number {
  if (typeof rate === 'number') return rate;
  if (!rate) return 0;
  const num = parseFloat(String(rate).replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 0 : num;
}

/**
 * Formats minimum callout hours (e.g. "4.0 hrs")
 */
export function formatMinHours(hours: number | string | undefined | null): string {
  if (hours === undefined || hours === null || hours === '') return '4.0 hrs';
  if (typeof hours === 'number') return `${hours.toFixed(1)} hrs`;
  const num = parseFloat(String(hours).replace(/[^0-9.]/g, ''));
  return isNaN(num) ? '4.0 hrs' : `${num.toFixed(1)} hrs`;
}

/**
 * Parses numeric minimum callout hours from number or string
 */
export function parseMinHours(hours: number | string | undefined | null): number {
  if (typeof hours === 'number') return hours;
  if (!hours) return 4.0;
  const num = parseFloat(String(hours).replace(/[^0-9.]/g, ''));
  return isNaN(num) ? 4.0 : num;
}

export interface MaintenanceRecord {
  id: string;
  pumpId: string;
  pumpUnit: string;
  pumpMake: string;
  service: string;
  date: string;
  status: 'Unavailable for dispatch' | 'In progress' | 'Completed';
  notes: string;
}

export const INITIAL_PUMPS: PumpItem[] = [
  {
    id: '01-34m',
    unitNumber: '01',
    boomSize: 34,
    horizontalReach: 111,
    make: 'Putzmeister',
    model: '34Z',
    type: 'boom_pump',
    typeLabel: 'Boom pump · 34M',
    boomLength: '34M (111 ft)',
    defaultOperator: {
      id: 'rob-black',
      name: 'Rob Black',
      role: 'Lead operator',
      badge: null,
    },
    todayStatus: {
      type: 'booked',
      label: 'Booked · 7:00 AM – 3:00 PM',
    },
    nextInspection: {
      date: 'Nov 12, 2026',
      dueSoon: false,
    },
    status: 'booked',
    hourlyRate: 195,
    minHours: '4.0 hrs',
    inMaintenance: false,
    year: '2023',
    documents: [],
  },
  {
    id: '02-28m',
    unitNumber: '02',
    boomSize: 28,
    horizontalReach: 91,
    make: 'Putzmeister',
    model: '28Z',
    type: 'boom_pump',
    typeLabel: 'Boom pump · 28M',
    boomLength: '28M (91 ft)',
    defaultOperator: {
      id: 'jordan-miles',
      name: 'Jordan Miles',
      role: 'Operator',
      badge: 'Time off today',
    },
    todayStatus: {
      type: 'available',
      label: 'Available · Assign operator',
    },
    nextInspection: {
      date: 'Oct 1, 2026',
      dueSoon: true,
    },
    status: 'available',
    hourlyRate: 175,
    minHours: '4.0 hrs',
    inMaintenance: false,
    year: '2021',
    documents: [],
  },
  {
    id: '03-47m',
    unitNumber: '03',
    boomSize: 47,
    horizontalReach: 154,
    make: 'Schwing',
    model: 'S 47 SX',
    type: 'boom_pump',
    typeLabel: 'Boom pump · 47M',
    boomLength: '47M (154 ft)',
    defaultOperator: {
      id: 'dave-smith',
      name: 'Dave Smith',
      role: 'Operator',
      badge: null,
    },
    todayStatus: {
      type: 'maintenance',
      label: 'Maintenance · Unavailable',
    },
    nextInspection: {
      date: 'Dec 8, 2026',
      dueSoon: false,
    },
    status: 'maintenance',
    hourlyRate: 245,
    minHours: '4.0 hrs',
    inMaintenance: true,
    maintenanceNote: 'Scheduled service • Hydraulic pump & boom inspection',
    year: '2024',
    documents: [],
  },
  {
    id: '04-line-pump',
    unitNumber: '04',
    boomSize: undefined,
    horizontalReach: 500,
    make: 'Trailer rig',
    model: 'Reed B50',
    type: 'line_pump',
    typeLabel: 'Line pump',
    boomLength: 'Ground Line (500ft)',
    defaultOperator: {
      id: 'tony-perez',
      name: 'Tony Perez',
      role: 'Operator',
      badge: null,
    },
    todayStatus: {
      type: 'booked',
      label: 'Booked · 8:00 AM – 2:00 PM',
    },
    nextInspection: {
      date: 'Nov 20, 2026',
      dueSoon: false,
    },
    status: 'booked',
    hourlyRate: 145,
    minHours: '4.0 hrs',
    inMaintenance: false,
    year: '2022',
    documents: [],
  },
];

export const INITIAL_MAINTENANCE: MaintenanceRecord[] = [
  {
    id: 'maint-03-47m',
    pumpId: '03-47m',
    pumpUnit: '03 · 47M',
    pumpMake: 'Schwing',
    service: 'Scheduled service',
    date: 'Sep 25, 2026 · All day',
    status: 'Unavailable for dispatch',
    notes: '250-hour service, hydraulic filter change and boom safety inspection.',
  },
];

// Reactive Store using useSyncExternalStore
let pumpsState: PumpItem[] = [...INITIAL_PUMPS];
const maintenanceState: MaintenanceRecord[] = [...INITIAL_MAINTENANCE];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function getPumps(): PumpItem[] {
  return pumpsState;
}

export function getPumpById(id: string): PumpItem | undefined {
  return pumpsState.find((p) => p.id === id || p.unitNumber.toLowerCase().includes(id.toLowerCase()));
}

export function getMaintenanceRecords(): MaintenanceRecord[] {
  return maintenanceState;
}

export function addPump(newPump: Omit<PumpItem, 'id'>): PumpItem {
  const id = newPump.unitNumber.toLowerCase().replace(/[^a-z0-9]/g, '-') || `pump-${Date.now()}`;
  const created: PumpItem = {
    ...newPump,
    id,
    documents: newPump.documents || [],
  };
  pumpsState = [created, ...pumpsState];
  notify();
  return created;
}

export function updatePump(id: string, updates: Partial<PumpItem>): PumpItem | null {
  const index = pumpsState.findIndex((p) => p.id === id);
  if (index === -1) return null;

  const current = pumpsState[index];
  const updated: PumpItem = {
    ...current,
    ...updates,
  };

  pumpsState = [
    ...pumpsState.slice(0, index),
    updated,
    ...pumpsState.slice(index + 1),
  ];
  notify();
  return updated;
}

export function deletePump(id: string): boolean {
  const index = pumpsState.findIndex((p) => p.id === id);
  if (index === -1) return false;

  pumpsState = pumpsState.filter((p) => p.id !== id);
  notify();
  return true;
}

export function addPumpDocument(
  pumpId: string,
  doc: Omit<PumpDocument, 'id' | 'uploadedAt'>
): PumpDocument | null {
  const pump = pumpsState.find((p) => p.id === pumpId);
  if (!pump) return null;

  const newDoc: PumpDocument = {
    ...doc,
    id: `doc-${Date.now()}`,
    uploadedAt: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  };

  const existingDocs = pump.documents || [];
  updatePump(pumpId, {
    documents: [newDoc, ...existingDocs],
  });

  return newDoc;
}

export function deletePumpDocument(pumpId: string, docId: string): boolean {
  const pump = pumpsState.find((p) => p.id === pumpId);
  if (!pump) return false;

  const updatedDocs = (pump.documents || []).filter((d) => d.id !== docId);
  updatePump(pumpId, {
    documents: updatedDocs,
  });

  return true;
}

export function usePumps(): PumpItem[] {
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => pumpsState,
    () => INITIAL_PUMPS
  );
}

export function useMaintenanceRecords(): MaintenanceRecord[] {
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => maintenanceState,
    () => INITIAL_MAINTENANCE
  );
}
