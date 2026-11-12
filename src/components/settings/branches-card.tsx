'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { MapPin, Pencil, Phone, Plus, Truck } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { StatusSwitch } from '@/components/ui/status-switch';
import { BranchDialog } from '@/components/settings/branch-dialog';
import { updateBranch } from '@/features/branches/server/actions';
import type { BranchItem } from '@/features/branches/types';
import { reportAction } from '@/lib/action-feedback';
import { cn } from '@/lib/utils';

/** "50 Niilo Hill Rd, Warren, ME 04864", or what there is of it. */
function addressLine(b: BranchItem): string {
  return [b.streetAddress, b.city, [b.state, b.zipCode].filter(Boolean).join(' ')].filter(Boolean).join(', ');
}

/** The company's branches. Owners and admins add and edit them; the main one is the shop drive time starts from. */
export function BranchesCard({ branches, canEdit }: { branches: BranchItem[]; canEdit: boolean }) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<BranchItem | null>(null);
  const refresh = () => router.refresh();

  const open = (branch: BranchItem | null) => {
    setEditing(branch);
    setDialogOpen(true);
  };

  const setActive = async (b: BranchItem, isActive: boolean) => {
    const result = await updateBranch({
      id: b.id,
      name: b.name,
      code: b.code,
      streetAddress: b.streetAddress,
      city: b.city,
      state: b.state,
      zipCode: b.zipCode,
      phone: b.phone,
      isHq: b.isHq,
      isActive,
    });
    reportAction(result, { entity: 'branch', refresh });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-bold text-base text-slate-900">Branches</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Locations the company runs from. The main branch is the shop that drive time starts from.
          </p>
        </div>
        {canEdit && (
          <Button type="button" variant="brand" size="sm" className="h-9 shrink-0 gap-1.5 px-3.5 text-xs font-semibold" onClick={() => open(null)}>
            <Plus className="h-3.5 w-3.5" />
            Add branch
          </Button>
        )}
      </div>

      {branches.length === 0 ? (
        <p className="rounded-xl border border-dashed border-slate-200 bg-white px-3 py-6 text-center text-xs text-slate-500">
          {canEdit ? 'No branches yet. Add your main shop first.' : 'No branches yet. An owner or admin can add them.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {branches.map((b) => {
            const address = addressLine(b);
            // Drive time needs a street or a town; a branch without either is skipped as the shop.
            const missingAddress = !b.streetAddress && !b.city;
            return (
              <div
                key={b.id}
                className={cn(
                  'flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-4 shadow-2xs',
                  !b.isActive && 'opacity-60',
                )}
              >
                <div>
                  <div className="mb-2 flex items-center justify-between gap-2">
                    <span className="flex h-7 min-w-7 items-center justify-center rounded-lg border border-brand/20 bg-brand-light px-1.5 text-xs font-bold text-brand">
                      {b.code}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {b.isHq && (
                        <span className="rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-emerald-700">
                          Main HQ
                        </span>
                      )}
                      {canEdit && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-7 w-7 p-0"
                          aria-label={`Edit ${b.name}`}
                          onClick={() => open(b)}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900">{b.name}</h4>
                  <p className="mt-1 flex items-start gap-1 text-xs text-slate-500">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
                    <span>{address || 'No address yet'}</span>
                  </p>
                  {missingAddress && b.isHq && (
                    <p className="mt-1.5 text-[11px] font-medium text-amber-700">
                      Add a street or town so drive time can start here.
                    </p>
                  )}
                </div>

                <div className="mt-4 flex items-center justify-between gap-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                  <span className="flex items-center gap-1 font-medium">
                    <Truck className="h-3.5 w-3.5 text-brand" />
                    {b.pumpCount} {b.pumpCount === 1 ? 'pump' : 'pumps'}
                  </span>
                  {b.phone && (
                    <span className="flex items-center gap-1 truncate text-slate-400">
                      <Phone className="h-3 w-3 shrink-0" />
                      {b.phone}
                    </span>
                  )}
                  <StatusSwitch
                    checked={b.isActive}
                    onCheckedChange={(next) => void setActive(b, next)}
                    ariaLabel={`${b.name} is active`}
                    disabled={b.isHq || !canEdit}
                    compact
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <BranchDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        branch={editing}
        isFirst={branches.length === 0}
        onSaved={refresh}
      />
    </div>
  );
}
