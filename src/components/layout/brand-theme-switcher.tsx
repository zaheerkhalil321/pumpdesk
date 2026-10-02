'use client';

import { Check, Palette } from 'lucide-react';
import { useBrandTheme } from '@/components/providers/brand-theme-provider';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface BrandThemeSwitcherProps {
  variant?: 'compact' | 'inline-dots' | 'settings-grid';
  className?: string;
}

export function BrandThemeSwitcher({
  variant = 'compact',
  className,
}: BrandThemeSwitcherProps) {
  const { brandTheme, setBrandTheme, themes } = useBrandTheme();

  if (variant === 'inline-dots') {
    return (
      <div className={cn('flex items-center gap-1.5 p-1 rounded-full bg-slate-100/90 border border-slate-200/80 shadow-2xs', className)}>
        {themes.map((t) => {
          const isSelected = brandTheme === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setBrandTheme(t.id)}
              className={cn(
                'h-5 w-5 rounded-full transition-all flex items-center justify-center cursor-pointer shadow-2xs',
                t.swatchClass,
                isSelected
                  ? 'ring-2 ring-slate-900 ring-offset-1 scale-110 shadow-xs'
                  : 'opacity-70 hover:opacity-100 hover:scale-105'
              )}
              title={`${t.name} • ${t.tagline}`}
              aria-label={`Switch to ${t.name} theme`}
            >
              {isSelected && <Check className="h-2.5 w-2.5 text-white stroke-[3.5]" />}
            </button>
          );
        })}
      </div>
    );
  }

  if (variant === 'settings-grid') {
    return (
      <div className={cn('p-4 sm:p-5 rounded-xl bg-slate-50/60 border border-slate-200/70 flex flex-wrap items-center gap-7 sm:gap-11', className)}>
        {themes.map((t) => {
          const isSelected = brandTheme === t.id;

          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setBrandTheme(t.id)}
              className="group flex flex-col items-center gap-2.5 cursor-pointer focus:outline-none transition-all duration-200"
              title={`Switch to ${t.name} (${t.hex})`}
            >
              {/* Chikna Glossy Color Disc */}
              <div className="relative p-0.5">
                <div
                  className={cn(
                    'relative h-13 w-13 rounded-full flex items-center justify-center transition-all duration-300 cursor-pointer overflow-hidden',
                    t.swatchClass,
                    isSelected
                      ? 'ring-2.5 ring-brand ring-offset-3 ring-offset-slate-50 scale-110 shadow-lg'
                      : 'opacity-90 hover:opacity-100 hover:scale-108 hover:shadow-md'
                  )}
                >
                  {/* Glossy Top-Lit Glass Sheen */}
                  <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/35 via-white/5 to-black/20 pointer-events-none" />

                  {/* Frosted Center Glass Checkmark */}
                  {isSelected && (
                    <div className="relative z-10 h-7 w-7 rounded-full bg-black/20 backdrop-blur-xs flex items-center justify-center text-white shadow-inner animate-in zoom-in-75 duration-150">
                      <Check className="h-4 w-4 stroke-[3.5] drop-shadow-xs" />
                    </div>
                  )}
                </div>
              </div>

              {/* Theme Identity & Active Pill */}
              <div className="flex flex-col items-center text-center">
                <span
                  className={cn(
                    'text-xs transition-colors leading-tight',
                    isSelected ? 'font-bold text-slate-900' : 'font-semibold text-slate-600 group-hover:text-slate-900'
                  )}
                >
                  {t.name}
                </span>

                <span className="text-[10px] font-mono text-slate-400 font-medium mt-0.5 group-hover:text-slate-600 transition-colors">
                  {t.hex}
                </span>

                {isSelected ? (
                  <span className="mt-1.5 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[9.5px] font-bold bg-brand text-white shadow-xs tracking-wide animate-in fade-in duration-150">
                    <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                    <span>Active</span>
                  </span>
                ) : (
                  <span className="mt-1.5 px-2 py-0.5 rounded-full text-[9px] font-semibold text-slate-400 group-hover:text-slate-600 transition-colors">
                    {t.accentBadge}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  const activeTheme = themes.find((t) => t.id === brandTheme) || themes[0];

  /* Default Compact Dropdown for Sidebar Dock */
  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'h-8 px-2 rounded-lg flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-200/60 transition-colors cursor-pointer outline-none',
          className
        )}
        title="Change brand theme"
      >
        <span
          className={cn(
            'h-3.5 w-3.5 rounded-full shrink-0 border border-black/10 shadow-2xs',
            activeTheme.swatchClass
          )}
        />
        <Palette className="h-3.5 w-3.5 text-slate-400 group-hover:text-slate-600" />
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56 p-1.5 rounded-xl shadow-lg border-slate-200">
        <DropdownMenuLabel className="text-[10.5px] font-semibold text-slate-400 uppercase tracking-wider px-2 py-1">
          Brand Theme
        </DropdownMenuLabel>
        <DropdownMenuSeparator className="my-1" />
        {themes.map((t) => {
          const isSelected = brandTheme === t.id;
          return (
            <DropdownMenuItem
              key={t.id}
              onClick={() => setBrandTheme(t.id)}
              className={cn(
                'flex items-center justify-between p-2 rounded-lg cursor-pointer text-xs transition-colors',
                isSelected
                  ? 'bg-slate-100/90 font-semibold text-slate-900'
                  : 'hover:bg-slate-100/60 text-slate-600 hover:text-slate-900'
              )}
            >
              <div className="flex items-center gap-2.5">
                <span
                  className={cn(
                    'h-3.5 w-3.5 rounded-full shrink-0 border border-black/10 shadow-2xs',
                    t.swatchClass
                  )}
                />
                <div>
                  <p className="leading-tight">{t.name}</p>
                  <p className="text-[10px] text-slate-400 font-normal leading-tight mt-0.5">
                    {t.tagline}
                  </p>
                </div>
              </div>
              {isSelected && <Check className="h-4 w-4 text-slate-900 shrink-0 ml-2" />}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
