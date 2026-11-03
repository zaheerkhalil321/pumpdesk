import { Loader2, Route } from 'lucide-react';

import { AppSelect } from '@/components/ui/app-select';
import type { DriveTimeStatus } from '@/components/orders/use-drive-time';
import { formatDuration } from '@/features/orders/duration';

const TRAVEL_CHOICES = [0, 15, 30, 45, 60, 75, 90, 120, 150, 180];

interface TravelTimeFieldProps {
  /** Minutes of driving into this job, from the shop or the pump's previous job. */
  value: number;
  onChange: (minutes: number) => void;
  /** Where Google's estimate stands, shown under the field. */
  status?: DriveTimeStatus;
  className?: string;
}

/** Picks the drive time into a job. Shown next to the pour time. */
export function TravelTimeField({ value, onChange, status, className }: TravelTimeFieldProps) {
  const choices = TRAVEL_CHOICES.includes(value) ? TRAVEL_CHOICES : [...TRAVEL_CHOICES, value].sort((a, b) => a - b);
  return (
    <div className="space-y-1">
      <AppSelect
        value={String(value)}
        onChange={(next) => onChange(Number(next))}
        options={choices.map((minutes) => ({
          value: String(minutes),
          label: minutes === 0 ? 'No travel' : formatDuration(minutes),
        }))}
        icon={Route}
        className={className}
      />
      {status?.state === 'loading' && (
        <p className="flex items-center gap-1 text-[11px] text-slate-400">
          <Loader2 className="h-3 w-3 animate-spin" />
          Checking with Google
        </p>
      )}
      {status?.state === 'ready' && (
        <p className="text-[11px] text-slate-400">
          Google: {formatDuration(status.minutes)} from {status.from === 'shop' ? 'the shop' : 'the last job'}
        </p>
      )}
    </div>
  );
}
