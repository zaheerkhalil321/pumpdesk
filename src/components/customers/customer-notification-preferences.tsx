'use client';

import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';
import { updateCustomerNotification, useSettingsStore } from '@/lib/settings-store';

/** On / off switches for the messages customer contacts receive, right on the customer overview. */
export function CustomerNotificationPreferences() {
  const { customerNotifications } = useSettingsStore();

  const handleToggle = (id: string, message: string, enabled: boolean) => {
    updateCustomerNotification(id, { enabled });
    toast.success(`${message}: ${enabled ? 'On' : 'Off'}`);
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl border border-slate-200/80 bg-slate-50/70 space-y-3 text-xs">
      <div>
        <div className="font-bold text-slate-900 mb-1">Contact notification preferences</div>
        <p className="text-slate-500 leading-relaxed text-[11.5px]">
          Choose which messages contacts receive.
        </p>
      </div>

      <ul className="divide-y divide-slate-200/70">
        {customerNotifications.map((rule) => (
          <li key={rule.id} className="py-2.5 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="font-semibold text-slate-900 text-xs">{rule.message}</p>
              <p className="text-[11px] text-slate-500 mt-0.5">{rule.when}</p>
            </div>
            <div className="inline-flex items-center gap-2 shrink-0">
              <Switch
                checked={rule.enabled}
                onCheckedChange={(checked) => handleToggle(rule.id, rule.message, checked)}
                aria-label={rule.message}
              />
              <span
                className={cn(
                  'text-xs font-semibold w-7 text-left',
                  rule.enabled ? 'text-brand' : 'text-slate-400'
                )}
              >
                {rule.enabled ? 'On' : 'Off'}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
