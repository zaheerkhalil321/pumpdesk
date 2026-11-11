'use client';

import { useState } from 'react';

import { CallDialog, type CallTarget } from '@/components/orders/call-dialog';
import { SendTextDialog, type TextTarget } from '@/components/orders/send-text-dialog';
import { draftGreeting } from '@/features/sms/templates';

type Person = CallTarget;

/**
 * Wires the "Call" and "Text" buttons to their dialogs. Call `openCall` / `openText` from the
 * buttons and render `reachDialogs` once anywhere in the same component.
 */
export function useReachOut(jobId?: string) {
  const [textTarget, setTextTarget] = useState<TextTarget | null>(null);
  const [callTarget, setCallTarget] = useState<CallTarget | null>(null);

  const openText = (who: Person & { draft?: string }) => {
    if (!who.recipientId || !who.phone) return;
    setTextTarget({ ...who, draft: who.draft ?? draftGreeting(who.name) });
  };

  const openCall = (who: Person) => {
    if (!who.recipientId || !who.phone) return;
    setCallTarget(who);
  };

  const reachDialogs = (
    <>
      <SendTextDialog target={textTarget} jobId={jobId} onClose={() => setTextTarget(null)} />
      <CallDialog target={callTarget} jobId={jobId} onClose={() => setCallTarget(null)} />
    </>
  );
  return { openText, openCall, reachDialogs };
}
