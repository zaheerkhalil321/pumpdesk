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
  defaultPump?: string;
  todayStatus: {
    type: 'assigned' | 'available' | 'time_off';
    label: string;
  };
  status: 'Active' | 'Inactive';
  emergencyContact: OperatorEmergencyContact;
  emergencyContacts?: OperatorEmergencyContact[];
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
    emergencyContacts: [
      {
        name: 'Sarah Black',
        relationship: 'Spouse',
        phone: '(207) 555-0199',
      },
      {
        name: 'Kevin Black',
        relationship: 'Brother',
        phone: '(207) 555-0192',
      },
    ],
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
    emergencyContacts: [],
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
    emergencyContacts: [
      {
        name: 'Elena Perez',
        relationship: 'Sister',
        phone: '(207) 555-0182',
      },
      {
        name: 'Carlos Perez',
        relationship: 'Father',
        phone: '(207) 555-0185',
      },
    ],
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
    emergencyContacts: [
      {
        name: 'Marcus Miles',
        relationship: 'Brother',
        phone: '(207) 555-0178',
      },
      {
        name: 'Clara Miles',
        relationship: 'Mother',
        phone: '(207) 555-0179',
      },
    ],
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
    defaultPump: 'None',
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
    emergencyContacts: [],
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
  const contactsList = newOp.emergencyContacts && newOp.emergencyContacts.length > 0
    ? newOp.emergencyContacts
    : (newOp.emergencyContact ? [newOp.emergencyContact] : []);

  const primaryContact = contactsList[0] || {
    name: 'Not provided',
    relationship: 'Not provided',
    phone: 'Not provided',
  };

  const created: OperatorItem = {
    ...newOp,
    id,
    defaultPump: newOp.defaultPump || 'None',
    emergencyContact: primaryContact,
    emergencyContacts: contactsList,
  };
  operatorsState = [created, ...operatorsState];
  notify();
  return created;
}

export function updateOperator(id: string, updates: Partial<OperatorItem>): OperatorItem | null {
  const index = operatorsState.findIndex((op) => op.id === id);
  if (index === -1) return null;

  const current = operatorsState[index];
  
  let updatedContacts = current.emergencyContacts || (current.emergencyContact ? [current.emergencyContact] : []);
  if (updates.emergencyContacts !== undefined) {
    updatedContacts = updates.emergencyContacts;
  } else if (updates.emergencyContact) {
    updatedContacts = [updates.emergencyContact];
  }

  const primaryContact = updatedContacts[0] || {
    name: 'Not provided',
    relationship: 'Not provided',
    phone: 'Not provided',
  };

  const updated: OperatorItem = {
    ...current,
    ...updates,
    emergencyContacts: updatedContacts,
    emergencyContact: primaryContact,
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
