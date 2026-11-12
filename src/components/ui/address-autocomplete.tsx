'use client';

import { useId, useRef, useState } from 'react';
import { MapPin, Search, X } from 'lucide-react';

import { usePlaceSuggestions } from '@/hooks/use-place-suggestions';
import { cn } from '@/lib/utils';

interface AddressAutocompleteProps {
  id?: string;
  value: string;
  /** Every keystroke: the box always takes typed text. */
  onChange: (value: string) => void;
  /** A Google suggestion was picked, such as "50 Niilo Hill Rd, Warren, ME, USA". */
  onPick: (text: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: boolean;
  disabled?: boolean;
  /** Only street addresses, no towns: for a street box next to separate town and state fields. */
  streetsOnly?: boolean;
  className?: string;
}

/**
 * A text box that offers Google address suggestions as you type (3 letters or more).
 * Picking one hands the whole address to `onPick`, so a form can fill its street, town and state.
 */
export function AddressAutocomplete({
  id,
  value,
  onChange,
  onPick,
  onBlur,
  placeholder,
  error,
  disabled,
  streetsOnly = false,
  className,
}: AddressAutocompleteProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const query = value.trim();
  const suggestions = usePlaceSuggestions(query, open && !disabled && query.length >= 3, streetsOnly);

  const pick = (text: string) => {
    onPick(text);
    setOpen(false);
    setActive(-1);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      // An open list closes first; the popup this box sits in closes on the next Escape.
      if (open && suggestions.length > 0) e.stopPropagation();
      setOpen(false);
      return;
    }
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setOpen(true);
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === 'Enter' && open && active >= 0) {
      e.preventDefault();
      pick(suggestions[Math.min(active, suggestions.length - 1)]);
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
        id={id}
        type="text"
        role="combobox"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-invalid={error || undefined}
        autoComplete="off"
        disabled={disabled}
        value={value}
        placeholder={placeholder}
        onChange={(e) => {
          onChange(e.target.value);
          setOpen(true);
          setActive(-1);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={handleKeyDown}
        className={cn(
          'h-9 w-full min-w-0 rounded-md border border-input bg-card py-1.5 pl-3 text-xs sm:text-sm text-foreground shadow-2xs outline-none transition-colors placeholder:text-muted-foreground focus:border-brand disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive',
          value ? 'pr-16' : 'pr-9',
          className,
        )}
      />
      {/* Clears the address and puts the cursor back in the box */}
      {value && !disabled && (
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
      <MapPin className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />

      {open && suggestions.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-lg border border-slate-200 bg-white p-1 shadow-lg"
        >
          {suggestions.map((text, index) => (
            <li
              key={text}
              role="option"
              aria-selected={index === active}
              tabIndex={-1}
              // Keep focus in the input so the list does not close before the click lands.
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => pick(text)}
              onMouseEnter={() => setActive(index)}
              className={cn(
                'flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-xs text-slate-800',
                index === active ? 'bg-brand-light text-brand' : 'hover:bg-slate-50',
              )}
            >
              <Search className="h-3 w-3 shrink-0 text-slate-400" />
              <span className="min-w-0 flex-1 truncate">{text}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
