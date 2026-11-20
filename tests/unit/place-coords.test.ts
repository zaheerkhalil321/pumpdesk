import { describe, expect, it } from 'vitest';

import { createBranchSchema, updateBranchSchema } from '@/features/branches/schemas';
import { createJobSiteSchema, updateJobSiteSchema } from '@/features/crm/schemas';
import { coordsColumns, parseLocation, siteCoordsPayload } from '@/features/places/coords';
import { bookOrderSchema, updateOrderSchema } from '@/features/orders/schemas';

describe('parseLocation', () => {
  it('reads Google\'s location and keeps 7 decimals', () => {
    expect(parseLocation({ latitude: 44.12345678, longitude: -69.23456789 })).toEqual({
      latitude: 44.1234568,
      longitude: -69.2345679,
    });
  });

  it.each([
    ['nothing', undefined],
    ['text', 'here'],
    ['missing longitude', { latitude: 44 }],
    ['numbers as text', { latitude: '44', longitude: '-69' }],
    ['latitude past 90', { latitude: 91, longitude: 0 }],
    ['longitude past 180', { latitude: 0, longitude: -181 }],
    ['not a number', { latitude: Number.NaN, longitude: 0 }],
  ])('rejects %s', (_label, value) => {
    expect(parseLocation(value)).toBeNull();
  });
});

describe('coordsColumns / siteCoordsPayload', () => {
  it('writes a point only when both numbers are there', () => {
    expect(coordsColumns(44.1, -69.2)).toEqual({ latitude: 44.1, longitude: -69.2 });
    expect(coordsColumns(44.1, null)).toEqual({ latitude: null, longitude: null });
    expect(coordsColumns(undefined, undefined)).toEqual({ latitude: null, longitude: null });
  });

  it('adds nothing to an order save when there is no point', () => {
    expect(siteCoordsPayload(null)).toEqual({});
    expect(siteCoordsPayload({ latitude: 1, longitude: 2 })).toEqual({ siteLatitude: 1, siteLongitude: 2 });
  });
});

const branch = {
  name: 'Warren HQ',
  code: '',
  streetAddress: '50 Niilo Hill Rd',
  city: 'Warren',
  state: 'me',
  zipCode: '',
  phone: '',
  isHq: true,
};

describe('branch schema', () => {
  it('has no point by default', () => {
    const parsed = createBranchSchema.parse(branch);
    expect(parsed.latitude).toBeNull();
    expect(parsed.longitude).toBeNull();
  });

  it('keeps a valid point', () => {
    const parsed = createBranchSchema.parse({ ...branch, latitude: 44.1, longitude: -69.2 });
    expect([parsed.latitude, parsed.longitude]).toEqual([44.1, -69.2]);
  });

  it('refuses half a point and out-of-range numbers', () => {
    expect(createBranchSchema.safeParse({ ...branch, latitude: 44.1, longitude: null }).success).toBe(false);
    expect(createBranchSchema.safeParse({ ...branch, latitude: 95, longitude: 0 }).success).toBe(false);
    expect(createBranchSchema.safeParse({ ...branch, latitude: 0, longitude: 181 }).success).toBe(false);
    expect(
      updateBranchSchema.safeParse({ ...branch, id: crypto.randomUUID(), isActive: true, latitude: null, longitude: 5 }).success,
    ).toBe(false);
  });
});

describe('job site schema', () => {
  const site = { name: '', addressLine1: '1 Main St', city: 'Rockland', state: 'ME', postalCode: '', timezone: '' };

  it('leaves the point out when none is given, so an update can tell "not sent" from "cleared"', () => {
    const parsed = updateJobSiteSchema.parse({ id: crypto.randomUUID(), ...site });
    expect(parsed.latitude).toBeUndefined();
  });

  it('accepts a full point and refuses half of one', () => {
    const customerId = crypto.randomUUID();
    expect(createJobSiteSchema.safeParse({ customerId, ...site, latitude: 44, longitude: -69 }).success).toBe(true);
    expect(createJobSiteSchema.safeParse({ customerId, ...site, latitude: 44 }).success).toBe(false);
  });
});

describe('order schema', () => {
  it('takes an optional site point and rejects impossible ones', () => {
    expect(updateOrderSchema.safeParse({ id: crypto.randomUUID(), version: 1, siteLatitude: 44, siteLongitude: -69 }).success).toBe(true);
    expect(updateOrderSchema.safeParse({ id: crypto.randomUUID(), version: 1, siteLatitude: 99, siteLongitude: 0 }).success).toBe(false);
    expect(bookOrderSchema.shape.siteLatitude).toBeDefined();
  });
});
