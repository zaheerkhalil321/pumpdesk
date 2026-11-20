'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Info } from 'lucide-react';

import { cn } from '@/lib/utils';
import { reportAction } from '@/lib/action-feedback';
import { Switch } from '@/components/ui/switch';
import { setNotificationRule } from '@/features/notifications/server/actions';
import type { NotificationEvent, NotificationRuleRow } from '@/features/notifications/events';

interface CustomerNotificationsCardProps {
  rules: NotificationRuleRow[];
  /** Owners and admins only; everyone else sees the list without the switches working. */
  canEdit: boolean;
}

/** The company's own list of customer messages, saved in the database. */
export function CustomerNotificationsCard({ rules, canEdit }: CustomerNotificationsCardProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [choices, setChoices] = useState<Partial<Record<NotificationEvent, boolean>>>({});
  const [openInfo, setOpenInfo] = useState<NotificationEvent | null>(null);

  const isOn = (rule: NotificationRuleRow) => choices[rule.code] ?? rule.enabled;

  const toggle = (rule: NotificationRuleRow, enabled: boolean) => {
    setChoices((current) => ({ ...current, [rule.code]: enabled }));
    startTransition(async () => {
      const result = await setNotificationRule({ event: rule.code, enabled });
      const ok = reportAction(result, { entity: 'setting', refresh: () => router.refresh() });
      if (!ok) setChoices((current) => ({ ...current, [rule.code]: !enabled }));
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-2xs overflow-hidden">
      <ul className="divide-y divide-border">
        {rules.map((rule) => {
          const on = isOn(rule);
          return (
            <li key={rule.code} className="p-4 sm:px-6 flex items-center justify-between gap-4">
              <div className="min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm text-foreground">{rule.label}</span>
                  <button
                    type="button"
                    onClick={() => setOpenInfo(openInfo === rule.code ? null : rule.code)}
                    className="text-muted-foreground hover:text-brand p-0.5 cursor-pointer"
                    aria-label={`About ${rule.label}`}
                  >
                    <Info className="h-3.5 w-3.5" />
                  </button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {rule.when} · Text
                  {!rule.automatic && <span className="ml-2 italic">Not sent automatically yet</span>}
                </p>
                {openInfo === rule.code && <p className="text-xs text-muted-foreground">{rule.info}</p>}
              </div>
              <div className="inline-flex items-center gap-2 shrink-0">
                <Switch
                  checked={on}
                  disabled={!canEdit || isPending}
                  onCheckedChange={(checked) => toggle(rule, checked)}
                  aria-label={rule.label}
                />
                <span className={cn('text-xs font-semibold w-7 text-left', on ? 'text-brand' : 'text-muted-foreground')}>
                  {on ? 'On' : 'Off'}
                </span>
              </div>
            </li>
          );
        })}
      </ul>
      {!canEdit && (
        <p className="px-4 sm:px-6 py-3 border-t border-border text-xs text-muted-foreground">
          Only an owner or admin can change these.
        </p>
      )}
    </div>
  );
}
