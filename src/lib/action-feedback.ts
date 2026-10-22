import { toast } from 'sonner';

import type { ActionResult } from '@/server/action';

/**
 * Shows the right toast for a failed Server Action. Returns true when the action succeeded.
 * `refresh` re-reads the page: it runs after every success and from the "Reload" button on a stale-version toast.
 */
export function reportAction<T>(
  result: ActionResult<T>,
  options: { entity: string; refresh?: () => void },
): result is Extract<ActionResult<T>, { ok: true }> {
  if (result.ok) {
    // Re-read the page data so the list always shows the change, even if the
    // server-side revalidation did not reach this tab.
    options.refresh?.();
    return true;
  }

  if (result.code === 'STALE') {
    toast.error(`Someone else changed this ${options.entity}. Reload to see the latest.`, {
      action: options.refresh ? { label: 'Reload', onClick: options.refresh } : undefined,
    });
  } else if (result.code === 'FORBIDDEN') {
    toast.error("You don't have permission to do that.");
  } else if (result.code === 'DUPLICATE') {
    toast.error(`A ${options.entity} with that number or name already exists.`);
  } else {
    toast.error(result.message);
  }
  return false;
}
