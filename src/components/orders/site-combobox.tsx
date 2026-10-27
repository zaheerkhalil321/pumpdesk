'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { MapPin } from 'lucide-react';

import type { OrderFormSite } from '@/features/orders/types';
import { cn } from '@/lib/utils';

interface SiteComboboxProps {
  value: string;
  onChange: (value: string) => void;
  /** The customer's saved sites. They are suggestions only: any text can be typed. */
  sites: OrderFormSite[];
  placeholder?: string;
  error?: boolean;
  className?: string;
  /** Lets the form register the field (react-hook-form's onBlur). */
  onBlur?: () => void;
}

/** One box for the job site: type a town or address, or pick one of the customer's saved sites. */
export function SiteCombobox({ value, onChange, sites, placeholder, error, className, onBlur }: SiteComboboxProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);

  // Show every saved site until something different from a saved address is typed.
  const options = useMemo(() => {
    const typed = value.trim().toLowerCase();
    const isSavedAddress = sites.some((s) => s.address.toLowerCase() === typed);
    if (!typed || isSavedAddress) return sites;
    return sites.filter((s) => s.label.toLowerCase().includes(typed) || s.address.toLowerCase().includes(typed));
  }, [sites, value]);

  const pick = (site: OrderFormSite) => {
    onChange(site.address);
    setOpen(false);
    setActive(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!options.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % options.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i <= 0 ? options.length - 1 : i - 1));
    } else if (e.key === 'Enter' && open && active >= 0) {
      e.preventDefault();
      pick(options[active]);
    }
  };

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(e) => {
        // Close when focus leaves the whole control, not when it moves to an option.
        if (!rootRef.current?.contains(e.relatedTarget as Node | null)) {
          setOpen(false);
          onBlur?.();
        }
      }}
    >
      <input
        type="text"
        role="combobox"
        aria-expanded={open && options.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        autoComplete="off"
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className={cn(
          'w-full h-9 pl-3 pr-9 rounded-lg border bg-white text-xs font-medium outline-none transition-colors',
          error
            ? 'border-red-500 focus:border-red-500 text-red-900 bg-red-50/20'
            : 'border-slate-200 text-slate-900 focus:border-brand',
          className,
        )}
      />
      <MapPin className="h-4 w-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />

      {open && options.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
        >
          {options.map((site, index) => (
            <li
              key={site.id}
              role="option"
              aria-selected={index === active}
              tabIndex={-1}
              // Keep focus in the input so the list does not close before the click lands.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(site)}
              onMouseEnter={() => setActive(index)}
              className={cn(
                'cursor-pointer rounded-md px-2.5 py-2 text-xs text-slate-800',
                index === active ? 'bg-brand-light text-brand' : 'hover:bg-slate-50',
              )}
            >
              {site.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
