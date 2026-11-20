'use server';

import { z } from 'zod';

import { authedAction } from '@/server/action';
import { NotFoundError } from '@/server/errors';

/** Signed links to a signature last this long, in seconds. */
const SIGNATURE_LINK_SECONDS = 300;

/**
 * A short-lived link to the customer's signature on a ticket. Signatures sit in a private bucket;
 * office roles may read their own company's files (storage policy `signatures_office_read`).
 */
export const getTicketSignatureUrl = authedAction({
  schema: z.object({ ticketId: z.string().uuid() }),
  roles: ['owner', 'admin', 'dispatcher', 'office', 'accountant', 'read_only'],
  run: async ({ input, supabase }) => {
    const { data: ticket, error } = await supabase
      .from('work_tickets')
      .select('signature_path')
      .eq('id', input.ticketId)
      .maybeSingle();
    if (error) throw error;
    if (!ticket?.signature_path) throw new NotFoundError();

    const { data, error: linkError } = await supabase.storage
      .from('signatures')
      .createSignedUrl(ticket.signature_path, SIGNATURE_LINK_SECONDS);
    if (linkError) throw linkError;
    return { url: data.signedUrl };
  },
});
