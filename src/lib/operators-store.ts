'use client';

import { useSyncExternalStore } from 'react';

export interface OperatorEmergencyContact {
  name: string;
  relationship: string;
  phone: string;
}

export interface OperatorItem {
  id: string;
  name: string;
  role: string;
  phone: string;
  email: string;
  branch: string;
  defaultPump: string;
  todayStatus: {
    type: 'assigned' | 'available' | 'time_off';
    label: string;
  };
  status: 'Active' | 'Inactive';
  emergencyContact: OperatorEmergencyContact;
  credentialAlert?: {
    title: string;
    date: string;
    daysRemaining: number;
  } | null;
}

export const INITIAL_OPERATORS: OperatorItem[] = [
  {
    id: 'rob-black',
    name: 'Rob Black',
    role: 'Lead operator',
    phone: '(207) 555-0168',
    email: 'rob@midcoast.example',
    branch: 'Warren',
    defaultPump: '01 · 34M',
    todayStatus: {
      type: 'assigned',
      label: 'Assigned · 7:00 AM – 3:00 PM',
    },
    status: 'Active',
    emergencyContact: {
      name: 'Sarah Black',
      relationship: 'Spouse',
      phone: '(207) 555-0199',
    },
    credentialAlert: {
      title: 'CDL expires in 20 days',
      date: 'Oct 15, 2026',
      daysRemaining: 20,
    },
  },
  {
    id: 'dave-smith',
    name: 'Dave Smith',
    role: 'Operator',
    phone: '(207) 555-0169',
    email: 'dave@midcoast.example',
    branch: 'Warren',
    defaultPump: '03 · 47M',
    todayStatus: {
      type: 'available',
      label: 'Available',
    },
    status: 'Active',
    emergencyContact: {
      name: 'Not provided',
      relationship: 'Not provided',
      phone: 'Not provided',
    },
    credentialAlert: null,
  },
  {
    id: 'tony-perez',
    name: 'Tony Perez',
    role: 'Operator',
    phone: '(207) 555-0170',
    email: 'tony@midcoast.example',
    branch: 'Warren',
    defaultPump: '04 · Line pump',
    todayStatus: {
      type: 'assigned',
      label: 'Assigned · 8:00 AM – 2:00 PM',
    },
    status: 'Active',
    emergencyContact: {
      name: 'Elena Perez',
      relationship: 'Sister',
      phone: '(207) 555-0182',
    },
    credentialAlert: null,
  },
  {
    id: 'jordan-miles',
    name: 'Jordan Miles',
    role: 'Operator',
    phone: '(207) 555-0171',
    email: 'jordan@midcoast.example',
    branch: 'Warren',
    defaultPump: '02 · 28M',
    todayStatus: {
      type: 'time_off',
      label: 'Time off · Approved',
    },
    status: 'Active',
    emergencyContact: {
      name: 'Marcus Miles',
      relationship: 'Brother',
      phone: '(207) 555-0178',
    },
    credentialAlert: {
      title: 'Medical Examiner Cert expires in 45 days',
      date: 'Nov 10, 2026',
      daysRemaining: 45,
    },
  },
  {
    id: 'casey-reed',
    name: 'Casey Reed',
    role: 'Relief operator',
    phone: '(207) 555-0172',
    email: 'casey@midcoast.example',
    branch: 'Warren',
    defaultPump: 'No default pump',
    todayStatus: {
      type: 'available',
      label: 'Available',
    },
    status: 'Active',
    emergencyContact: {
      name: 'Not provided',
      relationship: 'Not provided',
      phone: 'Not provided',
    },
    credentialAlert: null,
  },
];

// Reactive Store using useSyncExternalStore
let operatorsState: OperatorItem[] = [...INITIAL_OPERATORS];
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

export function getOperators(): OperatorItem[] {
  return operatorsState;
}

export function getOperatorById(id: string): OperatorItem | undefined {
  return operatorsState.find((op) => op.id === id || op.id === id.toLowerCase());
}

export function addOperator(newOp: Omit<OperatorItem, 'id'>): OperatorItem {
  const id = newOp.name.toLowerCase().replace(/[^a-z0-9]/g, '-') || `op-${Date.now()}`;
  const created: OperatorItem = {
    ...newOp,
    id,
  };
  operatorsState = [created, ...operatorsState];
  notify();
  return created;
}

export function updateOperator(id: string, updates: Partial<OperatorItem>): OperatorItem | null {
  const index = operatorsState.findIndex((op) => op.id === id);
  if (index === -1) return null;

  const current = operatorsState[index];
  const updated: OperatorItem = {
    ...current,
    ...updates,
    emergencyContact: {
      ...current.emergencyContact,
      ...(updates.emergencyContact || {}),
    },
  };

  operatorsState = [
    ...operatorsState.slice(0, index),
    updated,
    ...operatorsState.slice(index + 1),
  ];
  notify();
  return updated;
}

export function deleteOperator(id: string): boolean {
  const index = operatorsState.findIndex((op) => op.id === id);
  if (index === -1) return false;

  operatorsState = operatorsState.filter((op) => op.id !== id);
  notify();
  return true;
}

export function useOperators(): OperatorItem[] {
  return useSyncExternalStore(
    (callback) => {
      listeners.add(callback);
      return () => listeners.delete(callback);
    },
    () => operatorsState,
    () => INITIAL_OPERATORS
  );
}
