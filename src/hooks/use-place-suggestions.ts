'use client';

import { useCallback, useEffect, useState } from 'react';

import { parseLocation, type Coords } from '@/features/places/coords';

/** One Google suggestion: the text to show and Google's id for it, used to look up its map point. */
export interface PlaceSuggestion {
  text: string;
  placeId: string | null;
}

/**
 * Address suggestions from Google Places, through our own routes so the key stays private.
 * With `streetsOnly`, only street addresses come back (no towns), for a street box.
 * `fetchCoords` looks up the map point of a picked suggestion and ends the typing session.
 */
export function usePlaceSuggestions(query: string, enabled: boolean, streetsOnly = false) {
  const [result, setResult] = useState<{ query: string; suggestions: PlaceSuggestion[] }>({ query: '', suggestions: [] });
  // One token per typing session lets Google bill the whole search and pick as a single request.
  const [sessionToken, setSessionToken] = useState(() => crypto.randomUUID());

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
        const data = (await response.json()) as { suggestions: PlaceSuggestion[] };
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

  const fetchCoords = useCallback(
    async (placeId: string | null): Promise<Coords | null> => {
      if (!placeId) return null;
      try {
        const response = await fetch(`/api/places/details?id=${encodeURIComponent(placeId)}&token=${sessionToken}`);
        // The pick ends this session: the next search gets a new token.
        setSessionToken(crypto.randomUUID());
        if (!response.ok) return null;
        const data = (await response.json()) as { location?: unknown };
        return parseLocation(data.location);
      } catch {
        return null;
      }
    },
    [sessionToken],
  );

  const suggestions = enabled && result.query === query ? result.suggestions : [];
  return { suggestions, fetchCoords };
}
