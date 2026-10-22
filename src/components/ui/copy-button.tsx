'use client';

import { useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';

interface CopyButtonProps {
  /** The text to copy. Render nothing when there is nothing to copy. */
  value: string;
  /** What is being copied, e.g. "Phone" or "Email". Used in the toast and the accessible name. */
  label: string;
  className?: string;
}

/** Small icon button that copies a phone number or email address and confirms with a toast. */
export function CopyButton({ value, label, className }: CopyButtonProps) {
  const [copied, setCopied] = useState(false);
  if (!value) return null;

  const handleCopy = async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(value);
    } catch {
      toast.error('Could not copy. Please copy it by hand.');
      return;
    }
    toast.success(`${label} copied`, { description: value });
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      aria-label={`Copy ${label.toLowerCase()}`}
      title={`Copy ${label.toLowerCase()}`}
      className={cn(
        'inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-slate-400 transition-colors hover:bg-slate-100 hover:text-brand focus-visible:opacity-100 cursor-pointer',
        className,
      )}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-brand" /> : <Copy className="h-3.5 w-3.5" />}
    </button>
  );
}
