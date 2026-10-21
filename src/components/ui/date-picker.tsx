'use client';

import { useState } from 'react';
import { format, isValid, parse } from 'date-fns';
import { Calendar as CalendarIcon, X } from 'lucide-react';

import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';

interface DatePickerProps {
  /** ISO date (yyyy-mm-dd), or an empty string when no date is set. */
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  ariaLabel: string;
  /** "sm" matches h-9 inputs, "md" matches h-10 inputs. */
  size?: 'sm' | 'md';
  className?: string;
}

const ISO = 'yyyy-MM-dd';

/** Date field that uses the app's own calendar instead of the browser's. */
export function DatePicker({
  value,
  onChange,
  placeholder = 'Pick a date',
  ariaLabel,
  size = 'md',
  className,
}: DatePickerProps) {
  const [open, setOpen] = useState(false);

  const parsed = value ? parse(value, ISO, new Date()) : undefined;
  const selected = parsed && isValid(parsed) ? parsed : undefined;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        aria-label={ariaLabel}
        className={cn(
          'group flex w-full cursor-pointer items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-left shadow-2xs outline-none transition-colors hover:border-slate-300 focus-visible:border-brand',
          size === 'sm' ? 'h-9 text-xs' : 'h-10 text-xs sm:text-sm',
          className
        )}
      >
        <CalendarIcon className="h-4 w-4 shrink-0 text-slate-400 transition-colors group-hover:text-brand" />
        <span
          className={cn(
            'flex-1 truncate font-medium',
            selected ? 'text-slate-900' : 'text-slate-400'
          )}
        >
          {selected ? format(selected, 'MMM d, yyyy') : placeholder}
        </span>
      </PopoverTrigger>

      <PopoverContent
        align="start"
        className="w-auto rounded-2xl border-slate-200 bg-white p-2 shadow-2xl"
      >
        <Calendar
          selected={selected}
          onSelect={(date) => {
            onChange(format(date, ISO));
            setOpen(false);
          }}
        />
        <div className="flex items-center justify-between border-t border-slate-100 px-2 pt-2 text-xs">
          <button
            type="button"
            onClick={() => {
              onChange(format(new Date(), ISO));
              setOpen(false);
            }}
            className="cursor-pointer font-semibold text-brand hover:underline"
          >
            Today
          </button>
          {selected && (
            <button
              type="button"
              onClick={() => {
                onChange('');
                setOpen(false);
              }}
              className="inline-flex cursor-pointer items-center gap-1 font-semibold text-slate-500 hover:text-slate-800"
            >
              <X className="h-3 w-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
