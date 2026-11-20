import { z } from 'zod';

/** A point on the map, as Google gives it and as the database stores it (numeric(10, 7)). */
export interface Coords {
  latitude: number;
  longitude: number;
}

const round7 = (value: number) => Math.round(value * 1e7) / 1e7;

/**
 * Reads the `location` Google sends back ({ latitude, longitude }). Returns null for anything
 * that is not a real point on Earth, so a bad reply never reaches the database.
 */
export function parseLocation(value: unknown): Coords | null {
  if (!value || typeof value !== 'object') return null;
  const { latitude, longitude } = value as Record<string, unknown>;
  if (typeof latitude !== 'number' || typeof longitude !== 'number') return null;
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return null;
  if (Math.abs(latitude) > 90 || Math.abs(longitude) > 180) return null;
  return { latitude: round7(latitude), longitude: round7(longitude) };
}

/** Optional latitude and longitude fields for a zod object. Use `coordsPairRule` on the object too. */
export const coordsFields = {
  latitude: z.number().min(-90, 'Latitude is out of range').max(90, 'Latitude is out of range').nullable().default(null),
  longitude: z.number().min(-180, 'Longitude is out of range').max(180, 'Longitude is out of range').nullable().default(null),
};

/** A point needs both numbers: one without the other is never saved. */
export const coordsPairRule = (value: { latitude?: number | null; longitude?: number | null }) =>
  (value.latitude == null) === (value.longitude == null);

export const COORDS_PAIR_MESSAGE = 'Latitude and longitude go together';

/** An order's own point for a typed address. The server uses it only when both numbers are there. */
export const optionalCoordsFields = {
  siteLatitude: z.number().min(-90).max(90).nullable().optional(),
  siteLongitude: z.number().min(-180).max(180).nullable().optional(),
};

/** The columns to write for a point, or both cleared when there is none. */
export function coordsColumns(latitude: number | null | undefined, longitude: number | null | undefined) {
  return latitude != null && longitude != null
    ? { latitude, longitude }
    : { latitude: null, longitude: null };
}

/** What an order form adds to its save: the typed address's point, or nothing when it has none. */
export function siteCoordsPayload(coords: Coords | null): { siteLatitude?: number; siteLongitude?: number } {
  return coords ? { siteLatitude: coords.latitude, siteLongitude: coords.longitude } : {};
}
