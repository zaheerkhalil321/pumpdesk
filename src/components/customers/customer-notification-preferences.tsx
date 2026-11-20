'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import { cn } from '@/lib/utils';
import { reportAction } from '@/lib/action-feedback';
import { Switch } from '@/components/ui/switch';
import { setCustomerNotificationPref } from '@/features/notifications/server/actions';
import type { CustomerNotificationRow, NotificationEvent } from '@/features/notifications/events';

interface CustomerNotificationPreferencesProps {
  customerId: string;
  rows: CustomerNotificationRow[];
  canEdit: boolean;
}

/** On / off switches for the messages this customer's contacts receive, saved per customer. */
export function CustomerNotificationPreferences({ customerId, rows, canEdit }: CustomerNotificationPreferencesProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [choices, setChoices] = useState<Partial<Record<NotificationEvent, boolean>>>({});

  const choiceOf = (row: CustomerNotificationRow) => choices[row.code] ?? row.customerChoice;

  const toggle = (row: CustomerNotificationRow, enabled: boolean) => {
    setChoices((current) => ({ ...current, [row.code]: enabled }));
    startTransition(async () => {
      const result = await setCustomerNotificationPref({ customerId, event: row.code, enabled });
      const ok = reportAction(result, { entity: 'preference', refresh: () => router.refresh() });
      if (!ok) setChoices((current) => ({ ...current, [row.code]: row.customerChoice ?? undefined }));
    });
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-border bg-muted/50 space-y-3 text-xs">
      <div>
        <div className="font-bold text-foreground mb-1">Contact notification preferences</div>
        <p className="text-muted-foreground leading-relaxed text-[11.5px]">
          Choose which messages this customer&apos;s contacts receive.
        </p>
      </div>

      <ul className="divide-y divide-border">
        {rows.map((row) => {
          const choice = choiceOf(row);
          const on = row.companyEnabled && choice !== false;
          const source = !row.companyEnabled
            ? 'Off for the company'
            : choice === null
              ? 'Company default'
              : 'Set for this customer';
          return (
            <li key={row.code} className="py-2.5 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold text-foreground text-xs">{row.label}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  {row.when} · {source}
                  {!row.automatic && <span className="ml-2 italic">Not sent automatically yet</span>}
                </p>
              </div>
              <div className="inline-flex items-center gap-2 shrink-0">
                <Switch
                  checked={on}
                  disabled={!canEdit || !row.companyEnabled || isPending}
                  onCheckedChange={(checked) => toggle(row, checked)}
                  aria-label={row.label}
                />
                <span className={cn('text-xs font-semibold w-7 text-left', on ? 'text-brand' : 'text-muted-foreground')}>
                  {on ? 'On' : 'Off'}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
