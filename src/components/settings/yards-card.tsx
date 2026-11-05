'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Home, MapPin, Pencil, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { StatusSwitch } from '@/components/ui/status-switch';
import { YardDialog } from '@/components/settings/yard-dialog';
import { updateYard } from '@/features/yards/server/actions';
import type { YardItem } from '@/features/yards/types';
import { reportAction } from '@/lib/action-feedback';
import { cn } from '@/lib/utils';

/** The places operators start their day from. Each operator picks one as their home yard. */
export function YardsCard({ yards }: { yards: YardItem[] }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<YardItem | null>(null);
  const refresh = () => router.refresh();

  const open = (yard: YardItem | null) => {
    setEditing(yard);
    setDialogOpen(true);
  };

  const setActive = async (yard: YardItem, isActive: boolean) => {
    const result = await updateYard({ id: yard.id, name: yard.name, address: yard.address, isActive });
    reportAction(result, { entity: 'yard', refresh });
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-base text-slate-900">Yards</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Where operators start the day, such as the shop or their home. Travel time to a job is worked out from the
            operator&apos;s yard.
          </p>
        </div>
        <Button type="button" variant="brand" size="sm" className="h-9 gap-1.5 px-3.5 text-xs font-semibold" onClick={() => open(null)}>
          <Plus className="h-3.5 w-3.5" />
          Add yard
        </Button>
      </div>

      {yards.length === 0 ? (
        <p className="rounded-lg border border-dashed border-slate-200 px-3 py-6 text-center text-xs text-slate-500">
          No yards yet. Add one, then choose it as an operator&apos;s home yard.
        </p>
      ) : (
        <ul className="divide-y divide-slate-100">
          {yards.map((yard) => (
            <li key={yard.id} className={cn('flex items-center gap-3 py-2.5', !yard.isActive && 'opacity-60')}>
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-brand/20 bg-brand-light text-brand">
                <Home className="h-4 w-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-slate-900">{yard.name}</p>
                <p className="flex items-center gap-1 truncate text-xs text-slate-500">
                  <MapPin className="h-3 w-3 shrink-0 text-slate-400" />
                  {yard.address}
                </p>
              </div>
              <StatusSwitch
                checked={yard.isActive}
                onCheckedChange={(next) => void setActive(yard, next)}
                ariaLabel={`${yard.name} is active`}
                compact
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="h-8 w-8 p-0"
                aria-label={`Edit ${yard.name}`}
                onClick={() => open(yard)}
              >
                <Pencil className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <YardDialog open={dialogOpen} onOpenChange={setDialogOpen} yard={editing} onSaved={refresh} />
    </div>
  );
}
