import { timingSafeEqual } from 'node:crypto';

import { NextResponse } from 'next/server';

import { processNotificationDeliveries } from '@/features/notifications/server/process-deliveries';

export const dynamic = 'force-dynamic';

function isAuthorized(request: Request): boolean {
  const secret = process.env.NOTIFICATIONS_RUN_SECRET;
  if (!secret) return false;
  const header = request.headers.get('authorization') ?? '';
  const given = Buffer.from(header.startsWith('Bearer ') ? header.slice(7) : '');
  const wanted = Buffer.from(secret);
  return given.length === wanted.length && timingSafeEqual(given, wanted);
}

/** Called every minute by the database (pg_cron). Sends the queued customer texts. */
export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  try {
    const counts = await processNotificationDeliveries();
    return NextResponse.json(counts);
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
