'use client';

import { useRouter } from 'next/navigation';
import { Building2, Settings2 } from 'lucide-react';

import {
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import type { Workspace } from '@/features/branches/types';

/** Where the branch menu sends people: Settings > Company > Branches. */
export const BRANCHES_SETTINGS_HREF = '/settings?tab=company&section=branches';

/** The line under the company name: the main branch, or a nudge to add one. */
export function mainBranchLabel(workspace: Workspace): string {
  return workspace.branches[0]?.name ?? 'Add your main branch';
}

/**
 * The company's active branches, main one first. Picking one opens the branch settings;
 * the board does not filter by branch yet.
 */
export function WorkspaceMenuContent({ workspace, onNavigate }: { workspace: Workspace; onNavigate?: () => void }) {
  const router = useRouter();
  const openBranches = () => {
    onNavigate?.();
    router.push(BRANCHES_SETTINGS_HREF);
  };

  return (
    <DropdownMenuContent align="start" className="w-64 p-1.5 rounded-xl shadow-lg border-slate-200">
      <DropdownMenuLabel className="text-[11px] font-semibold text-slate-400 px-2 py-1">
        {workspace.companyName}
      </DropdownMenuLabel>
      {workspace.branches.length === 0 && (
        <p className="px-2 py-2 text-xs text-slate-500">No branches yet.</p>
      )}
      {workspace.branches.map((branch) => (
        <DropdownMenuItem
          key={branch.id}
          onClick={openBranches}
          className="flex items-center gap-2.5 p-2 rounded-lg cursor-pointer text-xs text-slate-600 hover:bg-slate-100/60 hover:text-slate-900"
        >
          <span className="flex h-7 min-w-7 shrink-0 items-center justify-center rounded-md border border-brand/20 bg-brand-light px-1 text-[10px] font-bold text-brand">
            {branch.code}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-slate-900">{branch.name}</span>
            <span className="block truncate text-[11px] text-slate-500">
              {[branch.place, branch.isHq ? 'Main HQ' : ''].filter(Boolean).join(' • ') || 'No address yet'}
            </span>
          </span>
        </DropdownMenuItem>
      ))}
      <DropdownMenuSeparator className="my-1" />
      <DropdownMenuItem
        onClick={openBranches}
        className="flex items-center gap-2 p-2 rounded-lg cursor-pointer text-xs text-brand font-medium hover:bg-brand-light"
      >
        {workspace.branches.length === 0 ? <Building2 className="h-3.5 w-3.5" /> : <Settings2 className="h-3.5 w-3.5" />}
        {workspace.branches.length === 0 ? 'Add a branch' : 'Manage branches'}
      </DropdownMenuItem>
    </DropdownMenuContent>
  );
}
