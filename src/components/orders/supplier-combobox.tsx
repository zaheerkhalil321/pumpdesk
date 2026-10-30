'use client';

import { useId, useMemo, useRef, useState } from 'react';
import { Factory } from 'lucide-react';

import type { OrderFormSupplier } from '@/features/suppliers/types';
import { cn } from '@/lib/utils';

interface SupplierComboboxProps {
  value: string;
  onChange: (value: string) => void;
  /** The company's active suppliers. Anything else that is typed is added to the list when the order is saved. */
  suppliers: OrderFormSupplier[];
  placeholder?: string;
  className?: string;
  onBlur?: () => void;
}

/** Type to search the supplier list, pick one, or keep typing a new name to add it. */
export function SupplierCombobox({ value, onChange, suppliers, placeholder, className, onBlur }: SupplierComboboxProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);

  const typed = value.trim();
  const isExisting = suppliers.some((s) => s.name.toLowerCase() === typed.toLowerCase());
  const matches = useMemo(() => {
    const needle = typed.toLowerCase();
    return !needle || isExisting
      ? suppliers
      : suppliers.filter((s) => s.name.toLowerCase().includes(needle));
  }, [suppliers, typed, isExisting]);
  const isNew = typed !== '' && !isExisting;

  const pick = (name: string) => {
    onChange(name);
    setOpen(false);
    setActive(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (!matches.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % matches.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i <= 0 ? matches.length - 1 : i - 1));
    } else if (e.key === 'Enter' && open && active >= 0) {
      e.preventDefault();
      pick(matches[active].name);
    }
  };

  return (
    <div
      ref={rootRef}
      className="relative"
      onBlur={(e) => {
        if (!rootRef.current?.contains(e.relatedTarget as Node | null)) {
          setOpen(false);
          onBlur?.();
        }
      }}
    >
      <div className="relative">
        <input
          type="text"
          role="combobox"
          aria-expanded={open && matches.length > 0}
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
            'w-full h-10 pl-3 pr-9 rounded-lg border border-slate-200 bg-white text-xs font-medium text-slate-900 outline-none transition-colors shadow-2xs placeholder:text-slate-400 focus:border-brand',
            className,
          )}
        />
        <Factory className="h-4 w-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />

        {open && matches.length > 0 && (
          <ul
            id={listId}
            role="listbox"
            className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
          >
            {matches.map((s, index) => (
              <li
                key={s.id}
                role="option"
                aria-selected={index === active}
                tabIndex={-1}
                // Keep focus in the input so the list does not close before the click lands.
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => pick(s.name)}
                onMouseEnter={() => setActive(index)}
                className={cn(
                  'cursor-pointer rounded-md px-2.5 py-2 text-xs text-slate-800',
                  index === active ? 'bg-brand-light text-brand' : 'hover:bg-slate-50',
                )}
              >
                <span className="font-semibold">{s.name}</span>
                {s.phone && <span className="ml-2 text-slate-400">{s.phone}</span>}
              </li>
            ))}
          </ul>
        )}
      </div>

      {isNew && (
        <p className="mt-1 text-[10.5px] font-medium leading-snug text-brand">
          New supplier, it will be added to your list when you save.
        </p>
      )}
    </div>
  );
}
