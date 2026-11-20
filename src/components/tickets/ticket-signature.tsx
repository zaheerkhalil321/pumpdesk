'use client';

import { useState } from 'react';
import { Loader2, PenLine } from 'lucide-react';

import { getTicketSignatureUrl } from '@/features/tickets/server/actions';

interface TicketSignatureProps {
  ticketId: string;
  signerName: string | null;
  hasSignature: boolean;
  /** When it was signed, already formatted for the site's timezone. */
  signedLabel: string | null;
}

/**
 * Who signed, and the signature itself on request. The image sits in a private bucket, so it is
 * fetched through a short-lived link only when someone wants to see it.
 */
export function TicketSignature({ ticketId, signerName, hasSignature, signedLabel }: TicketSignatureProps) {
  const [url, setUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);

  if (!hasSignature) {
    return <p className="text-xs text-slate-500">Not signed by the customer.</p>;
  }

  const show = async () => {
    setLoading(true);
    setFailed(false);
    const result = await getTicketSignatureUrl({ ticketId });
    setLoading(false);
    if (result.ok) setUrl(result.data.url);
    else setFailed(true);
  };

  return (
    <div className="space-y-2">
      <p className="text-xs text-slate-600">
        Signed by <span className="font-semibold text-slate-900">{signerName ?? 'the customer'}</span>
        {signedLabel && <span className="text-slate-400"> · {signedLabel}</span>}
      </p>
      {url ? (
        // A signed link to a private file, so it is not a static asset next/image could optimise.
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={url}
          alt={`Signature of ${signerName ?? 'the customer'}`}
          onError={() => {
            setUrl(null);
            setFailed(true);
          }}
          className="h-28 w-full rounded-lg border border-slate-200 bg-white object-contain"
        />
      ) : (
        <button
          type="button"
          onClick={() => void show()}
          disabled={loading}
          className="inline-flex h-8 cursor-pointer items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-semibold text-slate-700 shadow-2xs transition-colors hover:bg-slate-50 disabled:opacity-60"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <PenLine className="h-3.5 w-3.5" />}
          Show signature
        </button>
      )}
      {failed && <p className="text-xs font-medium text-red-600">Couldn&apos;t load the signature. Try again in a moment.</p>}
    </div>
  );
}
