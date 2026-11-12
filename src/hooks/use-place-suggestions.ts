'use client';

import { useEffect, useState } from 'react';

/**
 * Address suggestions from Google Places, through our own route so the key stays private.
 * With `streetsOnly`, only street addresses come back (no towns), for a street box.
 */
export function usePlaceSuggestions(query: string, enabled: boolean, streetsOnly = false): string[] {
  const [result, setResult] = useState<{ query: string; suggestions: string[] }>({ query: '', suggestions: [] });
  // One token per typing session lets Google bill the whole search as a single request.
  const [sessionToken] = useState(() => crypto.randomUUID());

  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const response = await fetch(
          `/api/places/autocomplete?q=${encodeURIComponent(query)}&token=${sessionToken}${streetsOnly ? '&kind=street' : ''}`,
          { signal: controller.signal },
        );
        if (!response.ok) return;
        const data = (await response.json()) as { suggestions: string[] };
        setResult({ query, suggestions: data.suggestions });
      } catch {
        // Offline or aborted: typed addresses still work.
      }
    }, 300);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query, enabled, sessionToken, streetsOnly]);

  return enabled && result.query === query ? result.suggestions : [];
}
