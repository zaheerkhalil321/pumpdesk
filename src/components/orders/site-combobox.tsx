'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { MapPin, Search, X } from 'lucide-react';

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
/** Address suggestions from Google Places, through our own route so the key stays private. */
function usePlaceSuggestions(query: string, enabled: boolean): string[] {
  const [result, setResult] = useState<{ query: string; suggestions: string[] }>({ query: '', suggestions: [] });
  // One token per typing session lets Google bill the whole search as a single request.
  const [sessionToken] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/places/autocomplete?q=${encodeURIComponent(query)}&token=${sessionToken}`,
          { signal: controller.signal },
        );
        if (!response.ok) return;
        const data = (await response.json()) as { suggestions: string[] };
        setResult({ query, suggestions: data.suggestions });
      } catch {
        // Offline or aborted: typed addresses still work.
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, enabled, sessionToken]);

  return enabled && result.query === query ? result.suggestions : [];
}

interface SiteOption {
  key: string;
  /** What fills the field when picked. */
  text: string;
  /** What the list shows. */
  label: string;
  source: 'saved' | 'place';
}

export function SiteCombobox({ value, onChange, sites, placeholder, error, className, onBlur }: SiteComboboxProps) {
  const listId = useId();
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const typed = value.trim().toLowerCase();
  const isSavedAddress = sites.some((s) => s.address.toLowerCase() === typed);
  const placeSuggestions = usePlaceSuggestions(value.trim(), open && typed.length >= 3 && !isSavedAddress);

  // Saved sites come first (all of them until something different is typed), then Google suggestions.
  const options = useMemo<SiteOption[]>(() => {
    const saved = (!typed || isSavedAddress
      ? sites
      : sites.filter((s) => s.label.toLowerCase().includes(typed) || s.address.toLowerCase().includes(typed))
    ).map((s): SiteOption => ({ key: `site-${s.id}`, text: s.address, label: s.label, source: 'saved' }));
    const places = placeSuggestions.map((text): SiteOption => ({ key: `place-${text}`, text, label: text, source: 'place' }));
    return [...saved, ...places];
  }, [sites, typed, isSavedAddress, placeSuggestions]);

  const pick = (option: SiteOption) => {
    onChange(option.text);
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
      pick(options[Math.min(active, options.length - 1)]);
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
        ref={inputRef}
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
          'w-full h-9 pl-3 rounded-lg border bg-white text-xs font-medium outline-none transition-colors',
          value ? 'pr-16' : 'pr-9',
          error
            ? 'border-red-500 focus:border-red-500 text-red-900 bg-red-50/20'
            : 'border-slate-200 text-slate-900 focus:border-brand',
          className,
        )}
      />
      {/* Clears the address and puts the cursor back in the box */}
      {value && (
        <button
          type="button"
          aria-label="Clear address"
          title="Clear address"
          onClick={() => {
            onChange('');
            setActive(-1);
            inputRef.current?.focus();
          }}
          className="absolute right-8 top-1/2 flex h-5 w-5 -translate-y-1/2 cursor-pointer items-center justify-center rounded-full text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      )}
      <MapPin className="h-4 w-4 text-slate-400 absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />

      {open && options.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
        >
          {options.map((option, index) => (
            <li
              key={option.key}
              role="option"
              aria-selected={index === active}
              tabIndex={-1}
              // Keep focus in the input so the list does not close before the click lands.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(option)}
              onMouseEnter={() => setActive(index)}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-xs text-slate-800',
                index === active ? 'bg-brand-light text-brand' : 'hover:bg-slate-50',
              )}
            >
              {option.source === 'place' ? (
                <Search className="h-3 w-3 shrink-0 text-slate-400" />
              ) : (
                <MapPin className="h-3 w-3 shrink-0 text-brand" />
              )}
              <span className="min-w-0 flex-1 truncate">{option.label}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
