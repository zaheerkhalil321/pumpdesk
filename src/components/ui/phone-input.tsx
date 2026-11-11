'use client';

import * as React from 'react';

import { Input } from '@/components/ui/input';
import { phoneProblem } from '@/lib/phone';
import { cn, formatUSPhone } from '@/lib/utils';

export { phoneProblem };

interface PhoneInputProps extends Omit<React.ComponentProps<'input'>, 'value' | 'onChange' | 'type'> {
  value: string;
  /** Gets the number already formatted, e.g. "(207) 555-0100". */
  onValueChange: (value: string) => void;
  /** An error the form shows under the field. It turns the box red and hides the box's own message. */
  error?: string;
}

/**
 * A US phone box: formats as you type ("(207) 555-0100"), stops at 10 digits, opens the
 * number pad on phones, and says when the number is incomplete once the field is left.
 */
export function PhoneInput({
  value,
  onValueChange,
  onBlur,
  error,
  className,
  placeholder = '(207) 555-0100',
  ...props
}: PhoneInputProps) {
  const [left, setLeft] = React.useState(false);
  const ownError = left ? phoneProblem(value) : null;
  const message = error ?? ownError;

  return (
    <div className="flex flex-col gap-1">
      <Input
        {...props}
        type="tel"
        inputMode="tel"
        autoComplete="tel"
        value={value}
        placeholder={placeholder}
        aria-invalid={Boolean(message) || undefined}
        onChange={(e) => onValueChange(formatUSPhone(e.target.value))}
        onBlur={(e) => {
          setLeft(true);
          onBlur?.(e);
        }}
        className={cn(message && 'border-destructive focus:border-destructive', className)}
      />
      {ownError && !error &&<p className="text-[11px] font-medium text-red-500">{ownError}</p>}
    </div>
  );
}
