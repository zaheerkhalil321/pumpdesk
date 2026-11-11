'use client';

import { useState } from 'react';

import { SendTextDialog, type TextTarget } from '@/components/orders/send-text-dialog';
import { draftGreeting } from '@/features/sms/templates';

type Recipient = Pick<TextTarget, 'recipient' | 'recipientId' | 'name' | 'phone'> & { draft?: string };

/**
 * Wires a "Text" button to the send-text dialog. Call `openText` from the button and render
 * `textDialog` once anywhere in the same component.
 */
export function useSendText(jobId?: string) {
  const [target, setTarget] = useState<TextTarget | null>(null);

  const openText = (who: Recipient) => {
    if (!who.recipientId || !who.phone) return;
    setTarget({ ...who, draft: who.draft ?? draftGreeting(who.name) });
  };

  const textDialog = <SendTextDialog target={target} jobId={jobId} onClose={() => setTarget(null)} />;
  return { openText, textDialog };
}
