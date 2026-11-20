import type { Place } from '@/api/types';

export type NavigationApp = 'apple' | 'google' | 'waze';
export type NavigationAppChoice = 'ask' | NavigationApp;
export type MapsPlatform = 'ios' | 'android' | 'other';

export type Destination =
  | { kind: 'coords'; lat: number; lng: number }
  | { kind: 'address'; text: string };

/** One URL to try first (the app) and one that works without the app installed. */
export interface MapsLink {
  native: string;
  web: string;
}

const isCoord = (n: number | null | undefined): n is number =>
  typeof n === 'number' && Number.isFinite(n);

const clean = (s: string | null | undefined) => (s ?? '').trim();

/** Whether the place has an exact map point (both numbers, in range). Only then is a maps app opened. */
export function hasCoordinates(place: Pick<Place, 'lat' | 'lng'>): boolean {
  return (
    isCoord(place.lat) &&
    isCoord(place.lng) &&
    Math.abs(place.lat) <= 90 &&
    Math.abs(place.lng) <= 180
  );
}

/**
 * Where to send the operator. Exact coordinates win; otherwise a clean
 * "street, town" (no yard/company name); otherwise the full label.
 */
export function getDestination(place: Pick<Place, 'label' | 'street' | 'town' | 'lat' | 'lng'>): Destination {
  if (isCoord(place.lat) && isCoord(place.lng)) {
    return { kind: 'coords', lat: place.lat, lng: place.lng };
  }
  const street = clean(place.street);
  const town = clean(place.town);
  if (street && town) return { kind: 'address', text: `${street}, ${town}` };
  return { kind: 'address', text: clean(place.label) };
}

/** Value for a daddr / destination / q parameter. Commas in coordinates stay readable. */
function param(dest: Destination): string {
  return dest.kind === 'coords' ? `${dest.lat},${dest.lng}` : encodeURIComponent(dest.text);
}

export function appleMapsLink(dest: Destination): MapsLink {
  const url = `maps://?daddr=${param(dest)}`;
  return { native: url, web: `https://maps.apple.com/?daddr=${param(dest)}` };
}

export function googleMapsLink(dest: Destination): MapsLink {
  const d = param(dest);
  return {
    native: `comgooglemaps://?daddr=${d}&directionsmode=driving`,
    web: `https://www.google.com/maps/dir/?api=1&destination=${d}`,
  };
}

export function wazeLink(dest: Destination): MapsLink {
  const q = dest.kind === 'coords' ? `ll=${param(dest)}` : `q=${param(dest)}`;
  return {
    native: `waze://?${q}&navigate=yes`,
    web: `https://waze.com/ul?${q}&navigate=yes`,
  };
}

/** The phone's default maps app: Apple Maps on iOS, a `geo:` intent on Android. */
export function defaultMapsLink(dest: Destination, platform: MapsPlatform): MapsLink {
  const d = param(dest);
  const web = `https://www.google.com/maps/dir/?api=1&destination=${d}`;
  if (platform === 'ios') return { native: `maps://?daddr=${d}`, web };
  if (platform === 'android') return { native: `geo:0,0?q=${d}`, web };
  return { native: web, web };
}

export function buildMapsLink(
  dest: Destination,
  app: NavigationAppChoice,
  platform: MapsPlatform
): MapsLink {
  if (app === 'apple' && platform === 'ios') return appleMapsLink(dest);
  if (app === 'google') return googleMapsLink(dest);
  if (app === 'waze') return wazeLink(dest);
  return defaultMapsLink(dest, platform);
}

export const NAVIGATION_APP_OPTIONS: { value: NavigationAppChoice; label: string }[] = [
  { value: 'ask', label: 'Ask each time' },
  { value: 'apple', label: 'Apple Maps' },
  { value: 'google', label: 'Google Maps' },
  { value: 'waze', label: 'Waze' },
];

/** Apple Maps only exists on iOS. */
export function availableNavigationApps(platform: MapsPlatform) {
  return NAVIGATION_APP_OPTIONS.filter((o) => o.value !== 'apple' || platform === 'ios');
}

export function isNavigationAppChoice(value: unknown): value is NavigationAppChoice {
  return value === 'ask' || value === 'apple' || value === 'google' || value === 'waze';
}
