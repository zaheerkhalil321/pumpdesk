import { Suspense } from 'react';
import { redirect } from 'next/navigation';

import { NewOrderForm } from '@/components/orders/new-order-form';
import { todayIn } from '@/features/fleet/mappers';
import { getOrderFormOptions } from '@/features/orders/server/queries';
import { requireSession } from '@/server/session';

export default async function NewOrderPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  // Editing an existing order happens on its own page.
  const existing = params.orderId ?? params.id;
  if (typeof existing === 'string' && /^ORD-\d+$/.test(existing)) redirect(`/orders/${existing}`);

  const [session, options] = await Promise.all([requireSession(), getOrderFormOptions()]);
  return (
    <Suspense
      fallback={
        <div className="p-8 w-full space-y-4">
          <div className="h-8 w-48 bg-slate-100 rounded-lg animate-pulse" />
          <div className="h-64 bg-slate-50 rounded-2xl border border-slate-200 animate-pulse" />
        </div>
      }
    >
      <NewOrderForm options={options} todayIso={todayIn(session.timezone)} />
    </Suspense>
  );
}
