'use client';

import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface StatusSwitchProps {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** Accessible name, e.g. "Customer is active". */
  ariaLabel: string;
  activeLabel?: string;
  inactiveLabel?: string;
  /** Heading shown on the left of the roomy layout. */
  title?: string;
  /** Helper text shown under the title; may depend on the state. */
  description?: (checked: boolean) => string;
  /** Single-line layout that matches the height of an input. */
  compact?: boolean;
  disabled?: boolean;
  className?: string;
}

/** Active/inactive (or any on/off) toggle with a state label. Use for two-state fields. */
export function StatusSwitch({
  checked,
  onCheckedChange,
  ariaLabel,
  activeLabel = 'Active',
  inactiveLabel = 'Inactive',
  title = 'Status',
  description,
  compact = false,
  disabled,
  className,
}: StatusSwitchProps) {
  const stateLabel = checked ? activeLabel : inactiveLabel;

  if (compact) {
    return (
      <div
        className={cn(
          'flex h-9 items-center justify-between gap-2 rounded-lg border border-slate-200 bg-white px-3',
          className
        )}
      >
        <span
          className={cn(
            'text-xs font-semibold',
            checked ? 'text-slate-900' : 'text-slate-500'
          )}
        >
          {stateLabel}
        </span>
        <Switch
          checked={checked}
          onCheckedChange={onCheckedChange}
          aria-label={ariaLabel}
          disabled={disabled}
        />
      </div>
    );
  }

  return (
    <div
      className={cn(
        'flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2.5',
        className
      )}
    >
      <div className="min-w-0">
        <span className="block text-xs font-semibold text-slate-700">{title}</span>
        {description && (
          <span className="text-[11px] text-slate-500">{description(checked)}</span>
        )}
      </div>
      <Switch
        checked={checked}
        onCheckedChange={onCheckedChange}
        aria-label={ariaLabel}
        label={stateLabel}
        disabled={disabled}
      />
    </div>
  );
}
