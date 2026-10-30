import { createSupplier } from '@/features/suppliers/server/actions';
import type { OrderFormSupplier } from '@/features/suppliers/types';

/**
 * Adds a typed supplier to the company list when it is not there yet, so it is offered next time.
 * The order itself stores the name as text, so a failure here never blocks saving the order.
 */
export async function ensureSupplier(name: string, known: OrderFormSupplier[]): Promise<void> {
  const typed = name.trim();
  if (!typed || known.some((s) => s.name.toLowerCase() === typed.toLowerCase())) return;
  await createSupplier({ name: typed, phone: '' });
}
