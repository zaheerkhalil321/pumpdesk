'use client';

import React from 'react';
import { X, Check } from 'lucide-react';
import { useSettings } from '@/components/providers/settings-provider';
import { useBrandTheme } from '@/components/providers/brand-theme-provider';
import { cn } from '@/lib/utils';

export function SettingsOverlay() {
  const { isOpen, closeSettings } = useSettings();
  const { brandTheme, setBrandTheme, themes } = useBrandTheme();
  const [isClosing, setIsClosing] = React.useState(false);
  const prevIsOpen = React.useRef(isOpen);

  React.useEffect(() => {
    if (prevIsOpen.current && !isOpen) {
      // Just transitioned from open -> closed: show exit animation for 150ms
      setIsClosing(true);
      const timer = setTimeout(() => {
        setIsClosing(false);
      }, 150);
      return () => clearTimeout(timer);
    }
    prevIsOpen.current = isOpen;
  }, [isOpen]);

  // Never render into the DOM if settings is closed and not actively animating out
  if (!isOpen && !isClosing) {
    return null;
  }

  return (
    <div
      aria-hidden={!isOpen}
      className={cn(
        'absolute inset-0 z-40 bg-background/95 backdrop-blur-md flex flex-col overflow-hidden',
        isOpen
          ? 'settings-overlay-enter pointer-events-auto'
          : 'settings-overlay-exit pointer-events-none'
      )}
    >
      {/* ── Scrollable Content ── */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-6 sm:p-12 lg:p-16 max-w-2xl mx-auto">

          {/* ── Header: Title + Close Button ── */}
          <div className="flex items-center justify-between pb-6 mb-10 border-b border-border/60">
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Settings
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
                Choose your workspace theme color.
              </p>
            </div>

            {/* Simple Close Button */}
            <button
              type="button"
              onClick={closeSettings}
              className="h-9 w-9 rounded-md border border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground transition-all cursor-pointer flex items-center justify-center active:scale-95 shadow-2xs"
              title="Close settings (Esc)"
              aria-label="Close Settings"
            >
              <X className="h-4.5 w-4.5" />
            </button>
          </div>

          {/* ── Super Clean Theme Selection Grid ── */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {themes.map((t) => {
              const isSelected = brandTheme === t.id;

              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setBrandTheme(t.id)}
                  className={cn(
                    'group flex flex-col items-center justify-center p-5 rounded-xl border transition-all duration-150 cursor-pointer text-center focus:outline-none active:scale-[0.98]',
                    isSelected
                      ? 'border-brand bg-brand-light/30 shadow-xs ring-1 ring-brand/40'
                      : 'border-border bg-card hover:border-border hover:bg-muted/40 shadow-2xs'
                  )}
                >
                  {/* Clean Color Circle */}
                  <div className="relative mb-3.5">
                    <div
                      className={cn(
                        'h-14 w-14 rounded-full transition-transform duration-150 flex items-center justify-center shadow-sm',
                        t.swatchClass,
                        isSelected ? 'scale-105 ring-2 ring-background ring-offset-2 ring-offset-brand' : 'group-hover:scale-105'
                      )}
                    >
                      {/* Checkmark when selected */}
                      {isSelected && (
                        <Check className="h-6 w-6 text-white stroke-[2.5] drop-shadow-sm" />
                      )}
                    </div>
                  </div>

                  {/* Theme Name */}
                  <span
                    className={cn(
                      'text-xs font-semibold tracking-tight transition-colors',
                      isSelected ? 'text-brand-text font-bold' : 'text-foreground'
                    )}
                  >
                    {t.name}
                  </span>
                </button>
              );
            })}
          </div>

          {/* ── Subtle Keyboard Hint ── */}
          <p className="mt-12 text-center text-xs text-muted-foreground/60">
            Press <kbd className="px-1.5 py-0.5 rounded bg-muted border border-border text-[10px] font-mono">Esc</kbd> to close
          </p>

        </div>
      </div>
    </div>
  );
}
