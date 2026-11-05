import { Loader2, MapPin, Route } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import { AppSelect } from '@/components/ui/app-select';
import type { DriveTimeStatus } from '@/components/orders/use-drive-time';
import { formatDuration } from '@/features/orders/duration';

const TRAVEL_CHOICES = [0, 15, 30, 45, 60, 75, 90, 120, 150, 180];

/** Where the drive starts, for the Google pill: the last job, the operator's yard, or the shop. */
function originLabel(status: Extract<DriveTimeStatus, { state: 'ready' }>, short = false): string {
  if (status.from === 'job') return short ? 'last job' : 'the last job';
  if (status.from === 'yard') return status.yardName ?? 'the yard';
  return short ? 'shop' : 'the shop';
}

interface TravelTimeFieldProps {
  /** Minutes of driving into this job, from the shop or the pump's previous job. */
  value: number;
  onChange: (minutes: number) => void;
  /** Where Google's estimate stands, shown under the field. */
  status?: DriveTimeStatus;
  /** Linked to the job before it on this pump. Off means the crew drives from the shop. */
  linked: boolean;
  onLinkedChange: (linked: boolean) => void;
  className?: string;
}

/** Picks the drive time into a job, and whether the crew drives from the previous job or the shop. Shown next to the pour time. */
export function TravelTimeField({ value, onChange, status, linked, onLinkedChange, className }: TravelTimeFieldProps) {
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
      <div className="flex flex-wrap items-center justify-between gap-x-2 gap-y-1">
        <label className="flex cursor-pointer items-center gap-1.5 text-[11px] font-medium text-slate-600">
          <Checkbox checked={linked} onCheckedChange={onLinkedChange} aria-label="Linked to previous job" />
          Linked to previous job
        </label>
        {status?.state === 'loading' && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
            <Loader2 className="h-3 w-3 animate-spin" />
            Checking
          </span>
        )}
        {status?.state === 'ready' && (
          <span
            title={`Google: ${formatDuration(status.minutes)} from ${originLabel(status)}`}
            className="flex items-center gap-1 rounded-md border border-brand/20 bg-brand-light px-1.5 py-0.5 text-[11px] font-semibold text-brand"
          >
            <MapPin className="h-3 w-3 shrink-0" />
            {formatDuration(status.minutes)} from {originLabel(status, true)}
          </span>
        )}
      </div>
    </div>
  );
}
