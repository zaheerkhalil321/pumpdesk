import { NextResponse, type NextRequest } from 'next/server';

import { parseLocation } from '@/features/places/coords';
import { getSession } from '@/server/session';

const DETAILS_URL = 'https://places.googleapis.com/v1/places';
/** Place ids are URL-safe text. Anything else is not a Google place id. */
const PLACE_ID = /^[A-Za-z0-9_-]{10,300}$/;

/**
 * The map point of a picked suggestion (Places API New, Place Details, location only). It uses
 * the same session token as the autocomplete, so Google bills the search and the pick together.
 * A null location is always a safe answer: the address is saved without coordinates.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ location: null }, { status: 401 });

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = request.nextUrl.searchParams.get('id') ?? '';
  const sessionToken = request.nextUrl.searchParams.get('token')?.slice(0, 64);
  if (!apiKey || !PLACE_ID.test(placeId)) return NextResponse.json({ location: null });

  try {
    const url = new URL(`${DETAILS_URL}/${encodeURIComponent(placeId)}`);
    if (sessionToken) url.searchParams.set('sessionToken', sessionToken);
    const response = await fetch(url, {
      headers: { 'X-Goog-Api-Key': apiKey, 'X-Goog-FieldMask': 'location' },
      cache: 'no-store',
    });
    if (!response.ok) return NextResponse.json({ location: null });

    const data = (await response.json()) as { location?: unknown };
    return NextResponse.json({ location: parseLocation(data.location) });
  } catch {
    return NextResponse.json({ location: null });
  }
}
