'use client';

import { useSyncExternalStore } from 'react';

export interface CompanyDetails {
  companyName: string;
  legalBusinessName: string;
  phone: string;
  email: string;
  website: string;
  logoText: string;
  logoUrl?: string;
  streetAddress: string;
  suiteUnit: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  useAddressOnInvoices: boolean;
}

export interface PricingService {
  id: string;
  name: string;
  rate: number;
  rateUnit: string;
  minimum: string;
  status: 'Active' | 'Inactive';
}

export interface AdditionalCharge {
  id: string;
  name: string;
  rate: number;
  unit: string;
  status: 'Active' | 'Inactive';
}

export interface CustomerNotificationRule {
  id: string;
  message: string;
  info: string;
  when: string;
  channel: 'Email & text' | 'Text' | 'Email';
  enabled: boolean;
}

export interface OfficeAlertRule {
  id: string;
  alert: string;
  info: string;
  when: string;
  notify: string;
  channel: 'In-app + text' | 'In-app' | 'Text';
  enabled: boolean;
}

export interface ConcreteSupplier {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: 'Active' | 'Inactive';
}

export interface PourTypeSetting {
  id: string;
  name: string;
  favorite: boolean;
  status: 'Active' | 'Inactive';
}

export type TagColor = 'amber' | 'fuchsia' | 'blue' | 'teal' | 'slate';

export interface TagSetting {
  id: string;
  name: string;
  usedOn: string;
  color: TagColor;
  status: 'Active' | 'Inactive';
}

export interface BranchSetting {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  pumpCount: number;
  isHQ: boolean;
}

export interface SettingsState {
  company: CompanyDetails;
  branches: BranchSetting[];
  services: PricingService[];
  charges: AdditionalCharge[];
  customerNotifications: CustomerNotificationRule[];
  officeAlerts: OfficeAlertRule[];
  suppliers: ConcreteSupplier[];
  pourTypes: PourTypeSetting[];
  tags: TagSetting[];
}

export const INITIAL_SETTINGS: SettingsState = {
  company: {
    companyName: 'Midcoast Concrete Pumping',
    legalBusinessName: 'Midcoast Concrete Pumping LLC',
    phone: '(207) 555-0100',
    email: 'hello@midcoast.example',
    website: 'midcoastpumping.com',
    logoText: 'MC',
    streetAddress: '54 Montgomery Ave',
    suiteUnit: '',
    city: 'Warren',
    state: 'Maine',
    zipCode: '04864',
    country: 'United States',
    useAddressOnInvoices: true,
  },
  branches: [
    {
      id: 'branch-1',
      name: 'Midcoast HQ (Warren Yard)',
      code: 'MC',
      address: '54 Montgomery Ave, Warren, ME 04864',
      phone: '(207) 555-0100',
      pumpCount: 4,
      isHQ: true,
    },
    {
      id: 'branch-2',
      name: 'Midcoast South (Portland Terminal)',
      code: 'MS',
      address: '120 Commercial St, Portland, ME 04101',
      phone: '(207) 555-0105',
      pumpCount: 2,
      isHQ: false,
    },
    {
      id: 'branch-3',
      name: 'Midcoast North (Bangor Staging)',
      code: 'MN',
      address: '88 Target Industrial Cir, Bangor, ME 04401',
      phone: '(207) 555-0108',
      pumpCount: 1,
      isHQ: false,
    },
  ],
  services: [
    {
      id: 'srv-1',
      name: '28m boom pump',
      rate: 225,
      rateUnit: '/ hour',
      minimum: '4 hours',
      status: 'Active',
    },
    {
      id: 'srv-2',
      name: '34m boom pump',
      rate: 250,
      rateUnit: '/ hour',
      minimum: '4 hours',
      status: 'Active',
    },
    {
      id: 'srv-3',
      name: 'Line pump',
      rate: 200,
      rateUnit: '/ hour',
      minimum: '3 hours',
      status: 'Active',
    },
    {
      id: 'srv-4',
      name: '47m boom pump',
      rate: 310,
      rateUnit: '/ hour',
      minimum: '4 hours',
      status: 'Active',
    },
  ],
  charges: [
    {
      id: 'chg-1',
      name: 'Travel',
      rate: 150,
      unit: 'Per hour',
      status: 'Active',
    },
    {
      id: 'chg-2',
      name: 'Off-site washout',
      rate: 100,
      unit: 'Per job',
      status: 'Active',
    },
    {
      id: 'chg-3',
      name: 'Extra hose',
      rate: 2,
      unit: 'Per foot',
      status: 'Active',
    },
    {
      id: 'chg-4',
      name: 'Fuel surcharge',
      rate: 45,
      unit: 'Per job',
      status: 'Active',
    },
  ],
  customerNotifications: [
    {
      id: 'cust-1',
      message: 'Order confirmation',
      info: 'Sent immediately when an order is booked or confirmed by dispatch.',
      when: 'When requested',
      channel: 'Email & text',
      enabled: true,
    },
    {
      id: 'cust-2',
      message: 'Operator details',
      info: 'Provides operator name and phone number to the job contact.',
      when: 'When dispatched',
      channel: 'Text',
      enabled: true,
    },
    {
      id: 'cust-3',
      message: 'Pump en route',
      info: 'Alerts the job superintendent when the pump leaves the yard.',
      when: 'When operator marks en route',
      channel: 'Text',
      enabled: true,
    },
    {
      id: 'cust-4',
      message: 'Pre-work authorization',
      info: 'Requests digital sign-off on terms prior to boom setup.',
      when: 'When requested',
      channel: 'Email & text',
      enabled: false,
    },
    {
      id: 'cust-5',
      message: 'Work ticket review',
      info: 'Sends digital pour receipt and hours summary after completion.',
      when: 'After ticket submission',
      channel: 'Email',
      enabled: true,
    },
    {
      id: 'cust-6',
      message: 'Missing job details',
      info: 'Automated nudge for mix design or gate access code.',
      when: 'When requested',
      channel: 'Email',
      enabled: false,
    },
  ],
  officeAlerts: [
    {
      id: 'off-1',
      alert: 'Operator running late',
      info: "Alerts you when ETA exceeds the job's arrive-by time by your chosen threshold.",
      when: 'ETA 10+ min late',
      notify: 'Dispatcher',
      channel: 'In-app + text',
      enabled: true,
    },
    {
      id: 'off-2',
      alert: 'Assignment not acknowledged',
      info: 'Triggered if the assigned driver has not acknowledged within departure window.',
      when: '30 min before departure',
      notify: 'Dispatcher',
      channel: 'In-app',
      enabled: true,
    },
    {
      id: 'off-3',
      alert: 'Job missing pump or operator',
      info: 'Safety alert for unassigned or unconfirmed pours.',
      when: '60 min before arrival',
      notify: 'Dispatcher',
      channel: 'In-app',
      enabled: true,
    },
    {
      id: 'off-4',
      alert: 'Customer change or cancellation',
      info: 'Notifies dispatch instantly when a customer modifies job time or cancels.',
      when: 'Immediately',
      notify: 'Dispatcher',
      channel: 'In-app + text',
      enabled: true,
    },
    {
      id: 'off-5',
      alert: 'Breakdown or job issue',
      info: 'Urgent notification if an operator logs mechanical trouble or hose plug.',
      when: 'When operator reports',
      notify: 'Dispatcher + owner',
      channel: 'In-app + text',
      enabled: true,
    },
    {
      id: 'off-6',
      alert: 'Work ticket missing',
      info: 'Alerts accounting if hours and volume were not submitted on time.',
      when: '2 hours after job ends',
      notify: 'Billing',
      channel: 'In-app',
      enabled: true,
    },
  ],
  suppliers: [
    {
      id: 'sup-1',
      name: 'Auburn Concrete',
      phone: '(207) 555-0120',
      email: 'dispatch@auburn.example',
      status: 'Active',
    },
    {
      id: 'sup-2',
      name: 'Coastal Ready Mix',
      phone: '(207) 555-0121',
      email: 'dispatch@coastal.example',
      status: 'Active',
    },
    {
      id: 'sup-3',
      name: 'Pine Tree Concrete Supply',
      phone: '(207) 555-0122',
      email: 'office@pinetree.example',
      status: 'Inactive',
    },
  ],
  pourTypes: [
    { id: 'pt-1', name: 'Footings', favorite: true, status: 'Active' },
    { id: 'pt-2', name: 'House slab', favorite: true, status: 'Active' },
    { id: 'pt-3', name: 'Cast-in-place wall', favorite: true, status: 'Active' },
    { id: 'pt-4', name: 'ICF wall', favorite: true, status: 'Active' },
    { id: 'pt-5', name: 'Slab on grade', favorite: false, status: 'Active' },
    { id: 'pt-6', name: 'Driveway', favorite: false, status: 'Active' },
    { id: 'pt-7', name: 'Sidewalk', favorite: false, status: 'Active' },
    { id: 'pt-8', name: 'Grout', favorite: false, status: 'Active' },
  ],
  tags: [
    {
      id: 'tag-1',
      name: 'Needs follow-up',
      usedOn: 'Orders, customers & contacts',
      color: 'amber',
      status: 'Active',
    },
    {
      id: 'tag-2',
      name: 'Change requested',
      usedOn: 'Orders',
      color: 'fuchsia',
      status: 'Active',
    },
    {
      id: 'tag-3',
      name: 'PO required',
      usedOn: 'Customers & orders',
      color: 'blue',
      status: 'Active',
    },
    {
      id: 'tag-4',
      name: 'Extra hose needed',
      usedOn: 'Orders',
      color: 'teal',
      status: 'Active',
    },
    {
      id: 'tag-5',
      name: 'Call before arrival',
      usedOn: 'Orders',
      color: 'slate',
      status: 'Inactive',
    },
  ],
};

const STORAGE_KEY = 'pumpdesk_settings_state_v1';

let currentSettings: SettingsState = INITIAL_SETTINGS;

function loadInitialSettings(): SettingsState {
  if (typeof window === 'undefined') return INITIAL_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        ...INITIAL_SETTINGS,
        ...parsed,
        company: { ...INITIAL_SETTINGS.company, ...parsed.company },
      };
    }
  } catch {
    // fallback
  }
  return INITIAL_SETTINGS;
}

if (typeof window !== 'undefined') {
  currentSettings = loadInitialSettings();
}

const listeners = new Set<() => void>();

function notify() {
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentSettings));
    } catch {
      // ignore
    }
  }
  listeners.forEach((listener) => listener());
}

export function updateCompanyDetails(updates: Partial<CompanyDetails>) {
  currentSettings = {
    ...currentSettings,
    company: {
      ...currentSettings.company,
      ...updates,
    },
  };
  notify();
}

export function togglePourTypeFavorite(id: string) {
  currentSettings = {
    ...currentSettings,
    pourTypes: currentSettings.pourTypes.map((pt) =>
      pt.id === id ? { ...pt, favorite: !pt.favorite } : pt
    ),
  };
  notify();
}

export function updateCustomerNotification(
  id: string,
  updates: Partial<CustomerNotificationRule>
) {
  currentSettings = {
    ...currentSettings,
    customerNotifications: currentSettings.customerNotifications.map((rule) =>
      rule.id === id ? { ...rule, ...updates } : rule
    ),
  };
  notify();
}

export function updateOfficeAlert(
  id: string,
  updates: Partial<OfficeAlertRule>
) {
  currentSettings = {
    ...currentSettings,
    officeAlerts: currentSettings.officeAlerts.map((rule) =>
      rule.id === id ? { ...rule, ...updates } : rule
    ),
  };
  notify();
}

export function addPricingService(service: Omit<PricingService, 'id'>) {
  const newService: PricingService = {
    ...service,
    id: `srv-${Date.now()}`,
  };
  currentSettings = {
    ...currentSettings,
    services: [...currentSettings.services, newService],
  };
  notify();
}

export function updatePricingService(id: string, updates: Partial<PricingService>) {
  currentSettings = {
    ...currentSettings,
    services: currentSettings.services.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    ),
  };
  notify();
}

export function addAdditionalCharge(charge: Omit<AdditionalCharge, 'id'>) {
  const newCharge: AdditionalCharge = {
    ...charge,
    id: `chg-${Date.now()}`,
  };
  currentSettings = {
    ...currentSettings,
    charges: [...currentSettings.charges, newCharge],
  };
  notify();
}

export function updateAdditionalCharge(id: string, updates: Partial<AdditionalCharge>) {
  currentSettings = {
    ...currentSettings,
    charges: currentSettings.charges.map((c) =>
      c.id === id ? { ...c, ...updates } : c
    ),
  };
  notify();
}

export function addSupplier(supplier: Omit<ConcreteSupplier, 'id'>) {
  const newSupplier: ConcreteSupplier = {
    ...supplier,
    id: `sup-${Date.now()}`,
  };
  currentSettings = {
    ...currentSettings,
    suppliers: [newSupplier, ...currentSettings.suppliers],
  };
  notify();
}

export function updateSupplier(id: string, updates: Partial<ConcreteSupplier>) {
  currentSettings = {
    ...currentSettings,
    suppliers: currentSettings.suppliers.map((s) =>
      s.id === id ? { ...s, ...updates } : s
    ),
  };
  notify();
}

export function addPourType(type: Omit<PourTypeSetting, 'id'>) {
  const newType: PourTypeSetting = {
    ...type,
    id: `pt-${Date.now()}`,
  };
  currentSettings = {
    ...currentSettings,
    pourTypes: [...currentSettings.pourTypes, newType],
  };
  notify();
}

export function updatePourType(id: string, updates: Partial<PourTypeSetting>) {
  currentSettings = {
    ...currentSettings,
    pourTypes: currentSettings.pourTypes.map((pt) =>
      pt.id === id ? { ...pt, ...updates } : pt
    ),
  };
  notify();
}

export function addTag(tag: Omit<TagSetting, 'id'>) {
  const newTag: TagSetting = {
    ...tag,
    id: `tag-${Date.now()}`,
  };
  currentSettings = {
    ...currentSettings,
    tags: [...currentSettings.tags, newTag],
  };
  notify();
}

export function updateTag(id: string, updates: Partial<TagSetting>) {
  currentSettings = {
    ...currentSettings,
    tags: currentSettings.tags.map((t) =>
      t.id === id ? { ...t, ...updates } : t
    ),
  };
  notify();
}

export function resetSettingsToDefaults() {
  currentSettings = INITIAL_SETTINGS;
  notify();
}

function subscribe(callback: () => void) {
  listeners.add(callback);
  return () => {
    listeners.delete(callback);
  };
}

function getSnapshot(): SettingsState {
  return currentSettings;
}

function getServerSnapshot(): SettingsState {
  return INITIAL_SETTINGS;
}

export function useSettingsStore() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
