import { ShieldCheck } from 'lucide-react';
import { formatInTimeZone } from 'date-fns-tz';
import { cn } from '@/lib/utils';
import { CREDENTIAL_ALERT_DAYS, daysUntil, todayIn } from '@/features/fleet/mappers';

const COMPANY_TIMEZONE = 'America/Chicago';

interface OperatorCredentialsCardProps {
  cdlExpiresOn: string;
  medicalCertExpiresOn: string;
}

interface CredentialRowProps {
  label: string;
  expiresOn: string;
  today: string;
}

function CredentialRow({ label, expiresOn, today }: CredentialRowProps) {
  const days = expiresOn ? daysUntil(expiresOn, today) : null;
  const isExpired = days !== null && days < 0;
  const isDueSoon = days !== null && days >= 0 && days <= CREDENTIAL_ALERT_DAYS;

  let statusLabel = 'Not set';
  if (days !== null) {
    if (isExpired) statusLabel = `Expired ${Math.abs(days)} ${Math.abs(days) === 1 ? 'day' : 'days'} ago`;
    else if (isDueSoon) statusLabel = `Expires in ${days} ${days === 1 ? 'day' : 'days'}`;
    else statusLabel = 'Valid';
  }

  return (
    <div className="py-3 flex items-center justify-between gap-4">
      <div className="min-w-0">
        <p className="text-slate-900 font-medium">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">
          {expiresOn
            ? `Expires ${formatInTimeZone(`${expiresOn}T12:00:00Z`, 'UTC', 'MMM d, yyyy')}`
            : 'No expiry date on file'}
        </p>
      </div>
      <span
        className={cn(
          'shrink-0 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border',
          isExpired && 'bg-red-50 text-red-700 border-red-200/70',
          isDueSoon && 'bg-amber-50 text-amber-800 border-amber-200/70',
          days !== null && !isExpired && !isDueSoon && 'bg-emerald-50 text-emerald-700 border-emerald-200/60',
          days === null && 'bg-slate-100 text-slate-600 border-slate-200'
        )}
      >
        {statusLabel}
      </span>
    </div>
  );
}

export function OperatorCredentialsCard({ cdlExpiresOn, medicalCertExpiresOn }: OperatorCredentialsCardProps) {
  const today = todayIn(COMPANY_TIMEZONE);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 p-5 sm:p-6 shadow-2xs space-y-4 max-w-2xl">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h2 className="text-sm sm:text-base font-bold text-slate-900">Credentials</h2>
        <ShieldCheck className="h-4 w-4 text-slate-400" />
      </div>
      <div className="divide-y divide-slate-100 text-xs sm:text-sm">
        <CredentialRow label="CDL" expiresOn={cdlExpiresOn} today={today} />
        <CredentialRow label="Medical Examiner Cert" expiresOn={medicalCertExpiresOn} today={today} />
      </div>
    </div>
  );
}
