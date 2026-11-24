'use client';

import { AnimatePresence } from 'motion/react';
import * as m from 'motion/react-m';
import { Check } from 'lucide-react';

import type { StageTone } from '@/components/schedule/live-status';
import { cn } from '@/lib/utils';

/** One colour per stage, so the badge reads at a glance and never clashes with the brand colour. */
const TONE_CLASSES: Record<StageTone, string> = {
  en_route: 'border-sky-300 bg-sky-50 text-sky-800',
  on_site: 'border-violet-300 bg-violet-50 text-violet-800',
  returning: 'border-orange-300 bg-orange-50 text-orange-700',
  late: 'border-rose-300 bg-rose-50 text-rose-700',
  done: 'border-slate-200 bg-white/80 text-slate-500',
};

/**
 * The crew's stage on a card: "En Route", "On Site", "Late · Not On Site", "Done".
 * Same size and shape as the operator pill beside it. When the stage changes, the old words
 * slide up and out and the new ones slide in.
 */
export function LiveBadge({ tone, label }: { tone: StageTone; label: string }) {
  return (
    <AnimatePresence mode="popLayout" initial={false}>
      <m.span
        key={label}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ type: 'spring', bounce: 0.25, duration: 0.35 }}
        className={cn(
          'inline-flex shrink-0 items-center gap-1 rounded border px-1.5 py-0.2 text-[9.5px] font-bold shadow-2xs',
          TONE_CLASSES[tone],
        )}
        role="status"
      >
        {tone === 'done' && <Check className="h-2.5 w-2.5 shrink-0" />}
        <span className="whitespace-nowrap">{label}</span>
      </m.span>
    </AnimatePresence>
  );
}
