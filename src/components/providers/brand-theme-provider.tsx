'use client';

import React, { createContext, useContext, useEffect, useSyncExternalStore } from 'react';

export type BrandTheme = 'teal' | 'orange' | 'slate' | 'blue';

export interface BrandThemeOption {
  id: BrandTheme;
  name: string;
  tagline: string;
  swatchClass: string;
  surfaceClass: string;
  hoverClass: string;
  lightBadgeClass: string;
  accentBadge: string;
  category: string;
  hex: string;
  lightHex: string;
  hoverHex: string;
  previewJobTitle: string;
  previewPump: string;
  previewTime: string;
  previewVolume: string;
}

export const THEME_VARIABLES: Record<
  BrandTheme,
  {
    primary: string;
    hover: string;
    light: string;
    border: string;
    text: string;
  }
> = {
  teal: {
    primary: '#0D7A7F',
    hover: '#0B6569',
    light: '#E6F7F5',
    border: 'rgba(13, 122, 127, 0.25)',
    text: '#084B4E',
  },
  orange: {
    primary: '#EA580C',
    hover: '#C2410C',
    light: '#FFF7ED',
    border: 'rgba(234, 88, 12, 0.25)',
    text: '#9A3412',
  },
  blue: {
    primary: '#2563EB',
    hover: '#1D4ED8',
    light: '#EFF6FF',
    border: 'rgba(37, 99, 235, 0.25)',
    text: '#1E40AF',
  },
  slate: {
    primary: '#0F172A',
    hover: '#1E293B',
    light: '#F1F5F9',
    border: 'rgba(15, 23, 42, 0.2)',
    text: '#0F172A',
  },
};

export function applyBrandThemeToDOM(theme: BrandTheme) {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  root.setAttribute('data-brand-theme', theme);
  if (document.body) {
    document.body.setAttribute('data-brand-theme', theme);
  }
}

export const BRAND_THEMES: BrandThemeOption[] = [
  {
    id: 'teal',
    name: 'Midcoast Teal',
    tagline: 'Modern dispatch emerald teal for high clarity',
    swatchClass: 'bg-[#0D7A7F]',
    surfaceClass: 'bg-[#E6F7F5]',
    hoverClass: 'bg-[#0B6569]',
    lightBadgeClass: 'bg-[#E6F7F5] text-[#0D7A7F] border-[#0D7A7F]/30',
    accentBadge: 'Default',
    category: 'Midcoast Flagship',
    hex: '#0D7A7F',
    lightHex: '#E6F7F5',
    hoverHex: '#0B6569',
    previewJobTitle: 'Foundations Pour • MC-HQ',
    previewPump: '34M Boom',
    previewTime: '07:00 AM',
    previewVolume: '95 yd³',
  },
  {
    id: 'orange',
    name: 'Safety Orange',
    tagline: 'Concrete pumping industry safety standard',
    swatchClass: 'bg-[#EA580C]',
    surfaceClass: 'bg-[#FFF7ED]',
    hoverClass: 'bg-[#C2410C]',
    lightBadgeClass: 'bg-[#FFF7ED] text-[#EA580C] border-[#EA580C]/30',
    accentBadge: 'Pumping Classic',
    category: 'Safety High-Vis',
    hex: '#EA580C',
    lightHex: '#FFF7ED',
    hoverHex: '#C2410C',
    previewJobTitle: 'Bridge Deck Slab • Lane 2',
    previewPump: '47M Boom',
    previewTime: '06:30 AM',
    previewVolume: '140 yd³',
  },
  {
    id: 'blue',
    name: 'Pacific Blue',
    tagline: 'Commercial fleet dispatch & modern logistics',
    swatchClass: 'bg-[#2563EB]',
    surfaceClass: 'bg-[#EFF6FF]',
    hoverClass: 'bg-[#1D4ED8]',
    lightBadgeClass: 'bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]/30',
    accentBadge: 'Fleet Classic',
    category: 'Fleet Pro',
    hex: '#2563EB',
    lightHex: '#EFF6FF',
    hoverHex: '#1D4ED8',
    previewJobTitle: 'Commercial Warehouse • Bay 4',
    previewPump: '28M City',
    previewTime: '08:15 AM',
    previewVolume: '65 yd³',
  },
  {
    id: 'slate',
    name: 'Industrial Slate',
    tagline: 'Pro minimalist monochrome executive UI',
    swatchClass: 'bg-[#0F172A]',
    surfaceClass: 'bg-[#F1F5F9]',
    hoverClass: 'bg-[#1E293B]',
    lightBadgeClass: 'bg-[#F1F5F9] text-[#0F172A] border-[#0F172A]/30',
    accentBadge: '2026 Sleek',
    category: 'Executive Dark',
    hex: '#0F172A',
    lightHex: '#F1F5F9',
    hoverHex: '#1E293B',
    previewJobTitle: 'Terminal Mat Pour • North Yard',
    previewPump: 'Line Pump',
    previewTime: '09:00 AM',
    previewVolume: '110 yd³',
  },
];

interface BrandThemeContextType {
  brandTheme: BrandTheme;
  setBrandTheme: (theme: BrandTheme) => void;
  themes: BrandThemeOption[];
  currentTheme: BrandThemeOption;
}

const BrandThemeContext = createContext<BrandThemeContextType>({
  brandTheme: 'teal',
  setBrandTheme: () => {},
  themes: BRAND_THEMES,
  currentTheme: BRAND_THEMES[0],
});

function subscribe(callback: () => void) {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('storage', callback);
  window.addEventListener('pumpdesk-theme-change', callback);
  return () => {
    window.removeEventListener('storage', callback);
    window.removeEventListener('pumpdesk-theme-change', callback);
  };
}

function getClientSnapshot(): BrandTheme {
  if (typeof window === 'undefined') return 'teal';
  try {
    const saved = localStorage.getItem('pumpdesk_brand_theme');
    if (saved === 'teal' || saved === 'orange' || saved === 'slate' || saved === 'blue') {
      return saved;
    }
  } catch {
    // ignore
  }
  return 'teal';
}

function getServerSnapshot(): BrandTheme {
  return 'teal';
}

export function BrandThemeProvider({ children }: { children: React.ReactNode }) {
  const brandTheme = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  // Keep DOM attribute and CSS variables synchronized immediately
  useEffect(() => {
    applyBrandThemeToDOM(brandTheme);
  }, [brandTheme]);

  const setBrandTheme = (theme: BrandTheme) => {
    try {
      localStorage.setItem('pumpdesk_brand_theme', theme);
    } catch {
      // ignore
    }
    applyBrandThemeToDOM(theme);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new Event('pumpdesk-theme-change'));
    }
  };

  const currentTheme =
    BRAND_THEMES.find((t) => t.id === brandTheme) || BRAND_THEMES[0];

  return (
    <BrandThemeContext.Provider
      value={{
        brandTheme,
        setBrandTheme,
        themes: BRAND_THEMES,
        currentTheme,
      }}
    >
      {children}
    </BrandThemeContext.Provider>
  );
}

export function useBrandTheme() {
  const context = useContext(BrandThemeContext);
  if (!context) {
    throw new Error('useBrandTheme must be used within a BrandThemeProvider');
  }
  return context;
}
