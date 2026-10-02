'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

export type SettingsTab = 'all' | 'theme' | 'company' | 'rates';

interface SettingsContextType {
  isOpen: boolean;
  hasEverOpened: boolean;
  activeTab: SettingsTab;
  openSettings: (tab?: SettingsTab) => void;
  closeSettings: () => void;
  toggleSettings: () => void;
  setActiveTab: (tab: SettingsTab) => void;
}

const SettingsContext = createContext<SettingsContextType | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasEverOpened, setHasEverOpened] = useState(false);
  const [activeTab, setActiveTab] = useState<SettingsTab>('all');

  const openSettings = useCallback((tab?: SettingsTab) => {
    if (tab) setActiveTab(tab);
    setHasEverOpened(true);
    setIsOpen(true);
  }, []);

  const closeSettings = useCallback(() => {
    setIsOpen(false);
  }, []);

  const toggleSettings = useCallback(() => {
    setHasEverOpened(true);
    setIsOpen((prev) => !prev);
  }, []);

  // Global keyboard shortcut: Cmd+, or Ctrl+, toggles settings (2026 SaaS standard)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if user is typing in an input or textarea
      const target = e.target as HTMLElement | null;
      const isInput = target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable);

      if ((e.metaKey || e.ctrlKey) && e.key === ',') {
        e.preventDefault();
        toggleSettings();
      } else if (e.key === 'Escape' && isOpen && !isInput) {
        e.preventDefault();
        closeSettings();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleSettings, closeSettings, isOpen]);

  return (
    <SettingsContext.Provider
      value={{
        isOpen,
        hasEverOpened,
        activeTab,
        openSettings,
        closeSettings,
        toggleSettings,
        setActiveTab,
      }}
    >
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
}
