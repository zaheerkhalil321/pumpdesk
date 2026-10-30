import { NextResponse, type NextRequest } from 'next/server';

import { getSession } from '@/server/session';

const AUTOCOMPLETE_URL = 'https://places.googleapis.com/v1/places:autocomplete';
const MIN_LENGTH = 3;
const MAX_LENGTH = 120;

type AutocompleteResponse = {
  suggestions?: { placePrediction?: { text?: { text?: string } } }[];
};

/**
 * Address suggestions from Google Places. The key stays on the server and only signed-in
 * users can call this. An empty list is always a safe answer: the field still takes typed text.
 */
export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session) return NextResponse.json({ suggestions: [] }, { status: 401 });

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const input = (request.nextUrl.searchParams.get('q') ?? '').trim().slice(0, MAX_LENGTH);
  const sessionToken = request.nextUrl.searchParams.get('token')?.slice(0, 64);
  if (!apiKey || input.length < MIN_LENGTH) return NextResponse.json({ suggestions: [] });

  try {
    const response = await fetch(AUTOCOMPLETE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Goog-Api-Key': apiKey },
      body: JSON.stringify({
        input,
        includedRegionCodes: ['us'],
        ...(sessionToken ? { sessionToken } : {}),
      }),
      cache: 'no-store',
    });
    if (!response.ok) return NextResponse.json({ suggestions: [] });

    const data = (await response.json()) as AutocompleteResponse;
    const suggestions = (data.suggestions ?? [])
      .map((s) => s.placePrediction?.text?.text)
      .filter((text): text is string => Boolean(text));
    return NextResponse.json({ suggestions });
  } catch {
    return NextResponse.json({ suggestions: [] });
  }
}
