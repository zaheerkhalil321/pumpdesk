'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, X } from 'lucide-react';

import type { CredentialAlertItem } from '@/features/fleet/types';

interface CredentialAlertBannerProps {
  alerts: CredentialAlertItem[];
}

/** Schedule-page warning for operators whose CDL or medical cert is expiring soon or expired. */
export function CredentialAlertBanner({ alerts }: CredentialAlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);
  if (dismissed || alerts.length === 0) return null;

  const operatorCount = new Set(alerts.map((a) => a.operatorId)).size;

  return (
    <div
      role="alert"
      className="bg-amber-50/90 border border-amber-200/90 rounded-xl px-4 py-3 flex items-start justify-between gap-3 shadow-2xs"
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
        <div className="min-w-0">
          <p className="text-xs sm:text-sm font-semibold text-amber-950">
            {operatorCount} {operatorCount === 1 ? 'operator has' : 'operators have'} a credential
            expiring soon
          </p>
          <ul className="mt-1 space-y-0.5 text-xs sm:text-sm text-amber-900">
            {alerts.map((alert) => (
              <li key={`${alert.operatorId}-${alert.title}`}>
                <Link
                  href={`/operators/${alert.operatorId}`}
                  className="font-semibold hover:underline"
                >
                  {alert.operatorName}
                </Link>
                {' · '}
                {alert.title} ({alert.date})
              </li>
            ))}
          </ul>
        </div>
      </div>
      <button
        type="button"
        onClick={() => setDismissed(true)}
        aria-label="Dismiss credential alert"
        className="p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer transition-colors shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
