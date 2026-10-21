'use client';

import { Check } from 'lucide-react';

import { useBrandTheme } from '@/components/providers/brand-theme-provider';
import { cn } from '@/lib/utils';

/** Compact accent-colour picker. The change applies instantly. */
export function AppearanceCard() {
  const { brandTheme, setBrandTheme, themes } = useBrandTheme();
  const current = themes.find((t) => t.id === brandTheme);

  return (
    <section className="rounded-2xl border border-slate-200/90 bg-white p-5 shadow-2xs">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h3 className="text-sm font-bold text-slate-900 sm:text-base">Appearance</h3>
          <p className="mt-1 text-xs text-slate-500">
            Accent colour for buttons and highlights.
            {current ? ` Using ${current.name}.` : ''}
          </p>
        </div>

        <div role="radiogroup" aria-label="Accent colour" className="flex items-center gap-3">
          {themes.map((t) => {
            const isSelected = brandTheme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="radio"
                aria-checked={isSelected}
                aria-label={t.name}
                title={t.name}
                onClick={() => setBrandTheme(t.id)}
                className={cn(
                  'flex h-9 w-9 cursor-pointer items-center justify-center rounded-full border-2 transition-all duration-150 active:scale-95',
                  isSelected
                    ? 'border-slate-900/80 p-0.5'
                    : 'border-transparent hover:border-slate-300 p-0.5'
                )}
              >
                <span
                  className={cn(
                    'flex h-full w-full items-center justify-center rounded-full shadow-2xs',
                    t.swatchClass
                  )}
                >
                  {isSelected && <Check className="h-3.5 w-3.5 stroke-[3] text-white" />}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
