import 'server-only';

const ROUTES_URL = 'https://routes.googleapis.com/directions/v2:computeRoutes';
const STEP_MINUTES = 5;
const CACHE_LIMIT = 500;

/** Drive times already looked up on this server, so the same two places are asked about once. */
const cache = new Map<string, number>();

type RoutesResponse = { routes?: { duration?: string }[] };

/**
 * Minutes to drive from one address to another, rounded up to 5, from Google Routes.
 * Null when there is no key, Google says no, or either address is not found: the form
 * then keeps whatever drive time the dispatcher picks by hand.
 */
export async function estimateDriveMinutes(origin: string, destination: string): Promise<number | null> {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const from = origin.trim();
  const to = destination.trim();
  if (!apiKey || !from || !to) return null;

  const cacheKey = `${from.toLowerCase()}|${to.toLowerCase()}`;
  const cached = cache.get(cacheKey);
  if (cached !== undefined) return cached;

  try {
    const response = await fetch(ROUTES_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': 'routes.duration',
      },
      body: JSON.stringify({
        origin: { address: from },
        destination: { address: to },
        travelMode: 'DRIVE',
        regionCode: 'us',
      }),
      cache: 'no-store',
    });
    if (!response.ok) return null;

    const seconds = Number.parseInt(((await response.json()) as RoutesResponse).routes?.[0]?.duration ?? '', 10);
    if (!Number.isFinite(seconds)) return null;

    const minutes = Math.max(STEP_MINUTES, Math.ceil(seconds / 60 / STEP_MINUTES) * STEP_MINUTES);
    if (cache.size >= CACHE_LIMIT) cache.clear();
    cache.set(cacheKey, minutes);
    return minutes;
  } catch {
    return null;
  }
}
