'use client';

import { useSyncExternalStore } from 'react';

export interface AssignedOrder {
  orderId: string;
  serviceDate: string;
  pourTime: string;
  jobSite: string;
  contactRole: string;
  pump: string;
  operator: string;
  status: 'Confirmed' | 'Pending' | 'Completed' | 'Cancelled';
}

export interface LinkedCustomerAccount {
  customerId: string;
  customerName: string;
  roles: string[];
}

export interface NotificationPreference {
  id: string;
  title: string;
  description: string;
  channel: 'Email' | 'Text' | 'Off';
}

export interface ContactItem {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  title: string;
  company: string;
  customerId: string;
  roles: string[];
  roleDisplay: string;
  phone: string;
  phoneType: 'Mobile' | 'Office';
  email: string;
  status: 'Active' | 'Inactive';
  tags: string[];
  createdAt: string;
  linkedAccounts: LinkedCustomerAccount[];
  notificationPreferences: NotificationPreference[];
  assignedOrders: AssignedOrder[];
}

export const INITIAL_CONTACTS: ContactItem[] = [
  {
    id: 'c1',
    firstName: 'Alex',
    lastName: 'Morgan',
    name: 'Alex Morgan',
    title: 'Project manager',
    company: 'Accurate Concrete',
    customerId: 'CUST-101',
    roles: ['Primary contact', 'Site contact'],
    roleDisplay: 'Primary + Site',
    phone: '(207) 555-0110',
    phoneType: 'Mobile',
    email: 'alex@accurate.example',
    status: 'Active',
    tags: ['Site coordination'],
    createdAt: 'September 10, 2026',
    linkedAccounts: [
      {
        customerId: 'CUST-101',
        customerName: 'Accurate Concrete',
        roles: ['Primary contact', 'Site contact'],
      },
    ],
    notificationPreferences: [
      {
        id: 'pref-1',
        title: 'Order confirmation',
        description: 'Request confirmation or updated details',
        channel: 'Email',
      },
      {
        id: 'pref-2',
        title: 'Operator details',
        description: 'Share assigned operator information',
        channel: 'Text',
      },
      {
        id: 'pref-3',
        title: 'Pump en route',
        description: 'Notify when the pump is on its way',
        channel: 'Text',
      },
      {
        id: 'pref-4',
        title: 'Pre-work authorization',
        description: 'Request approval to begin setup',
        channel: 'Off',
      },
      {
        id: 'pref-5',
        title: 'Work ticket review',
        description: 'Request review after the pour',
        channel: 'Email',
      },
      {
        id: 'pref-6',
        title: 'Missing order details',
        description: 'Request outstanding job information',
        channel: 'Email',
      },
    ],
    assignedOrders: [
      {
        orderId: 'ORD-1530',
        serviceDate: 'Sep 30, 2026',
        pourTime: '7:30 AM',
        jobSite: 'Appleton, ME',
        contactRole: 'Site contact',
        pump: '02 · 28M',
        operator: 'Rob Black',
        status: 'Confirmed',
      },
      {
        orderId: 'ORD-1528',
        serviceDate: 'Sep 28, 2026',
        pourTime: '8:00 AM',
        jobSite: 'Main Street, Winthrop',
        contactRole: 'Additional contact',
        pump: '01 · 34M',
        operator: 'Dave Smith',
        status: 'Pending',
      },
      {
        orderId: 'ORD-1514',
        serviceDate: 'Sep 10, 2026',
        pourTime: '8:00 AM',
        jobSite: 'Main Street, Winthrop',
        contactRole: 'Site contact',
        pump: '01 · 34M',
        operator: 'Rob Black',
        status: 'Completed',
      },
      {
        orderId: 'ORD-1482',
        serviceDate: 'Aug 28, 2026',
        pourTime: '7:00 AM',
        jobSite: 'Main Street, Winthrop',
        contactRole: 'Site contact',
        pump: '01 · 34M',
        operator: 'Dave Smith',
        status: 'Completed',
      },
      {
        orderId: 'ORD-1460',
        serviceDate: 'Aug 18, 2026',
        pourTime: '9:00 AM',
        jobSite: 'Appleton, ME',
        contactRole: 'Additional contact',
        pump: '02 · 28M',
        operator: 'Rob Black',
        status: 'Cancelled',
      },
      {
        orderId: 'ORD-1442',
        serviceDate: 'Aug 5, 2026',
        pourTime: '7:30 AM',
        jobSite: 'Appleton, ME',
        contactRole: 'Site contact',
        pump: '02 · 28M',
        operator: 'Rob Black',
        status: 'Completed',
      },
    ],
  },
  {
    id: 'c2',
    firstName: 'Casey',
    lastName: 'Brooks',
    name: 'Casey Brooks',
    title: 'Owner',
    company: 'Harbor Builders',
    customerId: 'CUST-106',
    roles: ['Primary contact'],
    roleDisplay: 'Primary',
    phone: '(207) 555-0113',
    phoneType: 'Mobile',
    email: 'casey@harbor.example',
    status: 'Active',
    tags: ['Owner', 'VIP Client'],
    createdAt: 'August 14, 2026',
    linkedAccounts: [
      {
        customerId: 'CUST-106',
        customerName: 'Harbor Builders',
        roles: ['Primary contact'],
      },
    ],
    notificationPreferences: [
      { id: 'pref-1', title: 'Order confirmation', description: 'Request confirmation or updated details', channel: 'Email' },
      { id: 'pref-2', title: 'Operator details', description: 'Share assigned operator information', channel: 'Text' },
      { id: 'pref-3', title: 'Pump en route', description: 'Notify when the pump is on its way', channel: 'Text' },
      { id: 'pref-4', title: 'Pre-work authorization', description: 'Request approval to begin setup', channel: 'Off' },
      { id: 'pref-5', title: 'Work ticket review', description: 'Request review after the pour', channel: 'Email' },
      { id: 'pref-6', title: 'Missing order details', description: 'Request outstanding job information', channel: 'Email' },
    ],
    assignedOrders: [
      {
        orderId: 'ORD-1523',
        serviceDate: 'Sep 16, 2026',
        pourTime: '9:30 AM',
        jobSite: '9 Water Street, Belfast',
        contactRole: 'Primary contact',
        pump: '01 · 34M',
        operator: 'Dave Smith',
        status: 'Confirmed',
      },
      {
        orderId: 'ORD-1520',
        serviceDate: 'Sep 13, 2026',
        pourTime: '8:00 AM',
        jobSite: '27 Bay Road, Camden',
        contactRole: 'Primary contact',
        pump: '01 · 34M',
        operator: 'Rob Black',
        status: 'Cancelled',
      },
    ],
  },
  {
    id: 'c3',
    firstName: 'Dana',
    lastName: 'Reed',
    name: 'Dana Reed',
    title: 'Accounts payable',
    company: 'Coastal Foundations',
    customerId: 'CUST-104',
    roles: ['Invoicing'],
    roleDisplay: 'Invoicing',
    phone: '(207) 555-0114',
    phoneType: 'Office',
    email: 'dana@coastal.example',
    status: 'Active',
    tags: ['Accounting', 'Billing'],
    createdAt: 'July 19, 2026',
    linkedAccounts: [
      {
        customerId: 'CUST-104',
        customerName: 'Coastal Foundations',
        roles: ['Invoicing'],
      },
    ],
    notificationPreferences: [
      { id: 'pref-1', title: 'Order confirmation', description: 'Request confirmation or updated details', channel: 'Email' },
      { id: 'pref-2', title: 'Operator details', description: 'Share assigned operator information', channel: 'Off' },
      { id: 'pref-3', title: 'Pump en route', description: 'Notify when the pump is on its way', channel: 'Off' },
      { id: 'pref-4', title: 'Pre-work authorization', description: 'Request approval to begin setup', channel: 'Off' },
      { id: 'pref-5', title: 'Work ticket review', description: 'Request review after the pour', channel: 'Email' },
      { id: 'pref-6', title: 'Missing order details', description: 'Request outstanding job information', channel: 'Email' },
    ],
    assignedOrders: [
      {
        orderId: 'ORD-1525',
        serviceDate: 'Sep 18, 2026',
        pourTime: '8:00 AM',
        jobSite: '18 Main Street, Rockland',
        contactRole: 'Invoicing contact',
        pump: 'Unassigned',
        operator: 'Operator needed',
        status: 'Pending',
      },
    ],
  },
  {
    id: 'c4',
    firstName: 'Jamie',
    lastName: 'Lee',
    name: 'Jamie Lee',
    title: 'Accounts payable',
    company: 'Accurate Concrete',
    customerId: 'CUST-101',
    roles: ['Invoicing'],
    roleDisplay: 'Invoicing',
    phone: '(207) 555-0111',
    phoneType: 'Office',
    email: 'billing@accurate.example',
    status: 'Active',
    tags: ['Finance', 'Invoicing'],
    createdAt: 'January 14, 2026',
    linkedAccounts: [
      {
        customerId: 'CUST-101',
        customerName: 'Accurate Concrete',
        roles: ['Invoicing'],
      },
    ],
    notificationPreferences: [
      { id: 'pref-1', title: 'Order confirmation', description: 'Request confirmation or updated details', channel: 'Email' },
      { id: 'pref-2', title: 'Operator details', description: 'Share assigned operator information', channel: 'Off' },
      { id: 'pref-3', title: 'Pump en route', description: 'Notify when the pump is on its way', channel: 'Off' },
      { id: 'pref-4', title: 'Pre-work authorization', description: 'Request approval to begin setup', channel: 'Off' },
      { id: 'pref-5', title: 'Work ticket review', description: 'Request review after the pour', channel: 'Email' },
      { id: 'pref-6', title: 'Missing order details', description: 'Request outstanding job information', channel: 'Email' },
    ],
    assignedOrders: [
      {
        orderId: 'ORD-1522',
        serviceDate: 'Sep 15, 2026',
        pourTime: '7:30 AM',
        jobSite: '61 Elm Street, Rockport',
        contactRole: 'Invoicing contact',
        pump: '02 · 28M',
        operator: 'Rob Black',
        status: 'Confirmed',
      },
    ],
  },
  {
    id: 'c5',
    firstName: 'Jordan',
    lastName: 'Ellis',
    name: 'Jordan Ellis',
    title: 'Project manager',
    company: 'Pine Tree Concrete',
    customerId: 'CUST-107',
    roles: ['Site contact'],
    roleDisplay: 'Site',
    phone: '(207) 555-0115',
    phoneType: 'Mobile',
    email: 'jordan@pinetree.example',
    status: 'Inactive',
    tags: ['Field lead'],
    createdAt: 'May 22, 2026',
    linkedAccounts: [
      {
        customerId: 'CUST-107',
        customerName: 'Pine Tree Concrete',
        roles: ['Site contact'],
      },
    ],
    notificationPreferences: [
      { id: 'pref-1', title: 'Order confirmation', description: 'Request confirmation or updated details', channel: 'Email' },
      { id: 'pref-2', title: 'Operator details', description: 'Share assigned operator information', channel: 'Text' },
      { id: 'pref-3', title: 'Pump en route', description: 'Notify when the pump is on its way', channel: 'Text' },
      { id: 'pref-4', title: 'Pre-work authorization', description: 'Request approval to begin setup', channel: 'Off' },
      { id: 'pref-5', title: 'Work ticket review', description: 'Request review after the pour', channel: 'Off' },
      { id: 'pref-6', title: 'Missing order details', description: 'Request outstanding job information', channel: 'Email' },
    ],
    assignedOrders: [
      {
        orderId: 'ORD-1524',
        serviceDate: 'Sep 17, 2026',
        pourTime: '7:00 AM',
        jobSite: '42 Union Street, Camden',
        contactRole: 'Site contact',
        pump: '02 · 28M',
        operator: 'Rob Black',
        status: 'Confirmed',
      },
    ],
  },
  {
    id: 'c6',
    firstName: 'Mike',
    lastName: 'Vance',
    name: 'Mike Vance',
    title: 'Superintendent',
    company: 'Turner Construction',
    customerId: 'CUST-108',
    roles: ['Site contact'],
    roleDisplay: 'Site',
    phone: '(207) 555-0142',
    phoneType: 'Mobile',
    email: 'mike@turner.example',
    status: 'Active',
    tags: ['Lead Superintendent', 'Commercial'],
    createdAt: 'June 3, 2026',
    linkedAccounts: [
      {
        customerId: 'CUST-108',
        customerName: 'Turner Construction',
        roles: ['Site contact'],
      },
    ],
    notificationPreferences: [
      { id: 'pref-1', title: 'Order confirmation', description: 'Request confirmation or updated details', channel: 'Email' },
      { id: 'pref-2', title: 'Operator details', description: 'Share assigned operator information', channel: 'Text' },
      { id: 'pref-3', title: 'Pump en route', description: 'Notify when the pump is on its way', channel: 'Text' },
      { id: 'pref-4', title: 'Pre-work authorization', description: 'Request approval to begin setup', channel: 'Off' },
      { id: 'pref-5', title: 'Work ticket review', description: 'Request review after the pour', channel: 'Email' },
      { id: 'pref-6', title: 'Missing order details', description: 'Request outstanding job information', channel: 'Email' },
    ],
    assignedOrders: [
      {
        orderId: 'ORD-1518',
        serviceDate: 'Sep 12, 2026',
        pourTime: '7:30 AM',
        jobSite: '24 Bay View Street, Camden',
        contactRole: 'Site contact',
        pump: '01 · 34M',
        operator: 'Dave Smith',
        status: 'Completed',
      },
    ],
  },
  {
    id: 'c7',
    firstName: 'Sam',
    lastName: 'Taylor',
    name: 'Sam Taylor',
    title: 'Superintendent',
    company: 'Accurate Concrete',
    customerId: 'CUST-101',
    roles: ['Site contact'],
    roleDisplay: 'Site',
    phone: '(207) 555-0112',
    phoneType: 'Mobile',
    email: 'sam@accurate.example',
    status: 'Active',
    tags: ['Field Superintendent'],
    createdAt: 'March 11, 2026',
    linkedAccounts: [
      {
        customerId: 'CUST-101',
        customerName: 'Accurate Concrete',
        roles: ['Site contact'],
      },
    ],
    notificationPreferences: [
      { id: 'pref-1', title: 'Order confirmation', description: 'Request confirmation or updated details', channel: 'Email' },
      { id: 'pref-2', title: 'Operator details', description: 'Share assigned operator information', channel: 'Text' },
      { id: 'pref-3', title: 'Pump en route', description: 'Notify when the pump is on its way', channel: 'Text' },
      { id: 'pref-4', title: 'Pre-work authorization', description: 'Request approval to begin setup', channel: 'Off' },
      { id: 'pref-5', title: 'Work ticket review', description: 'Request review after the pour', channel: 'Email' },
      { id: 'pref-6', title: 'Missing order details', description: 'Request outstanding job information', channel: 'Email' },
    ],
    assignedOrders: [
      {
        orderId: 'ORD-1522',
        serviceDate: 'Sep 15, 2026',
        pourTime: '7:30 AM',
        jobSite: '61 Elm Street, Rockport',
        contactRole: 'Site contact',
        pump: '02 · 28M',
        operator: 'Rob Black',
        status: 'Confirmed',
      },
    ],
  },
  {
    id: 'c8',
    firstName: 'Taylor',
    lastName: 'Green',
    name: 'Taylor Green',
    title: 'Office manager',
    company: 'Granite State Builders',
    customerId: 'CUST-105',
    roles: ['Primary contact'],
    roleDisplay: 'Primary',
    phone: '(207) 555-0116',
    phoneType: 'Office',
    email: 'taylor@granite.example',
    status: 'Active',
    tags: ['Office', 'Dispatch Coordinator'],
    createdAt: 'April 9, 2026',
    linkedAccounts: [
      {
        customerId: 'CUST-105',
        customerName: 'Granite State Builders',
        roles: ['Primary contact'],
      },
    ],
    notificationPreferences: [
      { id: 'pref-1', title: 'Order confirmation', description: 'Request confirmation or updated details', channel: 'Email' },
      { id: 'pref-2', title: 'Operator details', description: 'Share assigned operator information', channel: 'Text' },
      { id: 'pref-3', title: 'Pump en route', description: 'Notify when the pump is on its way', channel: 'Off' },
      { id: 'pref-4', title: 'Pre-work authorization', description: 'Request approval to begin setup', channel: 'Off' },
      { id: 'pref-5', title: 'Work ticket review', description: 'Request review after the pour', channel: 'Email' },
      { id: 'pref-6', title: 'Missing order details', description: 'Request outstanding job information', channel: 'Email' },
    ],
    assignedOrders: [
      {
        orderId: 'ORD-1521',
        serviceDate: 'Sep 14, 2026',
        pourTime: '10:00 AM',
        jobSite: '12 Knox Street, Thomaston',
        contactRole: 'Primary contact',
        pump: '03 · 47M',
        operator: 'Dave Smith',
        status: 'Pending',
      },
    ],
  },
];

const STORAGE_KEY = 'pumpdesk_contacts_store_v1';

let listeners: Array<() => void> = [];

function emitChange() {
  for (const listener of listeners) {
    listener();
  }
}

function subscribeToStorage(callback: () => void) {
  listeners.push(callback);
  const handleStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY) {
      callback();
    }
  };
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', handleStorage);
  }
  return () => {
    listeners = listeners.filter((l) => l !== callback);
    if (typeof window !== 'undefined') {
      window.removeEventListener('storage', handleStorage);
    }
  };
}

let cachedContactsRaw = '';
let cachedContacts: ContactItem[] = INITIAL_CONTACTS;

function getContactsClientSnapshot(): ContactItem[] {
  if (typeof window === 'undefined') return INITIAL_CONTACTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_CONTACTS;
    if (raw !== cachedContactsRaw) {
      cachedContactsRaw = raw;
      const parsed = JSON.parse(raw);
      cachedContacts = Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CONTACTS;
    }
    return cachedContacts;
  } catch {
    return INITIAL_CONTACTS;
  }
}

function getContactsServerSnapshot(): ContactItem[] {
  return INITIAL_CONTACTS;
}

export function useContacts(): ContactItem[] {
  return useSyncExternalStore(
    subscribeToStorage,
    getContactsClientSnapshot,
    getContactsServerSnapshot
  );
}

export function getContactsSnapshot(): ContactItem[] {
  if (typeof window === 'undefined') return INITIAL_CONTACTS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_CONTACTS;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_CONTACTS;
  } catch {
    return INITIAL_CONTACTS;
  }
}

export function saveContacts(contacts: ContactItem[]) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(contacts));
    cachedContactsRaw = JSON.stringify(contacts);
    cachedContacts = contacts;
    emitChange();
  } catch (err) {
    console.error('Failed to save contacts', err);
  }
}

export function addContact(newContact: Omit<ContactItem, 'id'>): ContactItem {
  const contacts = getContactsSnapshot();
  const id = `c${Date.now()}`;
  const created: ContactItem = {
    ...newContact,
    id,
  };
  const updated = [created, ...contacts];
  saveContacts(updated);
  return created;
}

export function updateContact(id: string, updates: Partial<ContactItem>): ContactItem | null {
  const contacts = getContactsSnapshot();
  const index = contacts.findIndex((c) => c.id === id);
  if (index === -1) return null;
  const updatedItem = { ...contacts[index], ...updates };
  const updatedList = [...contacts];
  updatedList[index] = updatedItem;
  saveContacts(updatedList);
  return updatedItem;
}

export function deleteContact(id: string): boolean {
  const contacts = getContactsSnapshot();
  const filtered = contacts.filter((c) => c.id !== id);
  if (filtered.length === contacts.length) return false;
  saveContacts(filtered);
  return true;
}
