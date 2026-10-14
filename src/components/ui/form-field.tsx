import * as React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FormFieldProps {
  id: string;
  label: string;
  error?: string;
  hint?: string;
  /** Optional element aligned to the right of the label (e.g. "Forgot password?") */
  labelAction?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}

/**
 * Label + control + error/hint wrapper. The control should set
 * `aria-invalid` and `aria-describedby={`${id}-message`}` when an error is shown.
 */
export function FormField({
  id,
  label,
  error,
  hint,
  labelAction,
  className,
  children,
}: FormFieldProps) {
  const message = error ?? hint;

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-xs font-semibold text-foreground">
          {label}
        </label>
        {labelAction}
      </div>
      {children}
      {message && (
        <p
          id={`${id}-message`}
          className={cn(
            'flex items-center gap-1 text-xs animate-in fade-in slide-in-from-top-1 duration-200',
            error ? 'text-destructive font-medium' : 'text-muted-foreground'
          )}
        >
          {error && <AlertCircle className="size-3.5 shrink-0" />}
          {message}
        </p>
      )}
    </div>
  );
}
