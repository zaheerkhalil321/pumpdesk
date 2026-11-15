'use client';

import { useId } from 'react';

import { ActivePill } from '@/components/ui/active-pill';
import { cn } from '@/lib/utils';

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
}

interface SegmentedControlProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: readonly SegmentedOption<T>[];
  ariaLabel: string;
  /** "sm" is 36px tall (matches h-9 inputs), "md" is 40px (h-10). */
  size?: 'sm' | 'md';
  className?: string;
}

/** Pick one of two to four options with every option visible. Use for short fixed lists. */
export function SegmentedControl<T extends string>({
  value,
  onChange,
  options,
  ariaLabel,
  size = 'sm',
  className,
}: SegmentedControlProps<T>) {
  const pillId = useId();
  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={cn(
        'flex w-full gap-0.5 rounded-lg border border-slate-200 bg-slate-100/80 p-0.5',
        size === 'sm' ? 'h-9' : 'h-10',
        className
      )}
    >
      {options.map((option) => {
        const isSelected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onChange(option.value)}
            className={cn(
              'relative isolate flex-1 cursor-pointer rounded-md px-3 text-xs font-semibold transition-colors duration-150',
              isSelected ? 'text-slate-900' : 'text-slate-600 hover:text-slate-900'
            )}
          >
            {isSelected && <ActivePill layoutId={pillId} />}
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
