import {
  appleMapsLink,
  availableNavigationApps,
  buildMapsLink,
  defaultMapsLink,
  getDestination,
  googleMapsLink,
  hasCoordinates,
  wazeLink,
} from '../src/features/navigation-urls';

const site = {
  label: 'Lot 7, 24 Oak Hill Road, Litchfield, ME',
  street: '24 Oak Hill Road',
  town: 'Litchfield',
  lat: 44.1234,
  lng: -69.9876,
};
const noCoords = { ...site, lat: null, lng: null };
const coords = getDestination(site);
const addr = getDestination(noCoords);

describe('getDestination', () => {
  it('prefers coordinates', () => {
    expect(coords).toEqual({ kind: 'coords', lat: 44.1234, lng: -69.9876 });
  });
  it('treats lat 0 as a real coordinate but one missing value as none', () => {
    expect(getDestination({ ...site, lat: 0, lng: 0 }).kind).toBe('coords');
    expect(getDestination({ ...site, lng: null }).kind).toBe('address');
  });
  it('uses street, town without the yard name', () => {
    const shop = {
      label: 'Midcoast Concrete Pumping · 142 Main St',
      street: '142 Main St',
      town: 'Augusta',
      lat: null,
      lng: null,
    };
    expect(getDestination(shop)).toEqual({ kind: 'address', text: '142 Main St, Augusta' });
  });
  it('falls back to the label when street or town is missing', () => {
    expect(getDestination({ ...noCoords, town: null })).toEqual({ kind: 'address', text: site.label });
    expect(getDestination({ ...noCoords, street: '  ' }).kind).toBe('address');
  });
});

describe('URLs with coordinates', () => {
  it('apple', () => {
    expect(appleMapsLink(coords).native).toBe('maps://?daddr=44.1234,-69.9876');
  });
  it('google', () => {
    const l = googleMapsLink(coords);
    expect(l.native).toBe('comgooglemaps://?daddr=44.1234,-69.9876&directionsmode=driving');
    expect(l.web).toBe('https://www.google.com/maps/dir/?api=1&destination=44.1234,-69.9876');
  });
  it('waze', () => {
    const l = wazeLink(coords);
    expect(l.native).toBe('waze://?ll=44.1234,-69.9876&navigate=yes');
    expect(l.web).toBe('https://waze.com/ul?ll=44.1234,-69.9876&navigate=yes');
  });
  it('android default', () => {
    expect(defaultMapsLink(coords, 'android').native).toBe('geo:0,0?q=44.1234,-69.9876');
  });
});

describe('URLs with an address', () => {
  const enc = encodeURIComponent('24 Oak Hill Road, Litchfield');
  it('apple', () => expect(appleMapsLink(addr).native).toBe(`maps://?daddr=${enc}`));
  it('google', () => {
    expect(googleMapsLink(addr).web).toBe(
      `https://www.google.com/maps/dir/?api=1&destination=${enc}`
    );
  });
  it('waze', () => {
    expect(wazeLink(addr).native).toBe(`waze://?q=${enc}&navigate=yes`);
    expect(wazeLink(addr).web).toBe(`https://waze.com/ul?q=${enc}&navigate=yes`);
  });
  it('android default', () => {
    expect(defaultMapsLink(addr, 'android').native).toBe(`geo:0,0?q=${enc}`);
  });
});

describe('buildMapsLink', () => {
  it('ask/default uses the platform default', () => {
    expect(buildMapsLink(coords, 'ask', 'ios').native).toMatch(/^maps:\/\//);
    expect(buildMapsLink(coords, 'ask', 'android').native).toMatch(/^geo:/);
  });
  it('apple on Android falls back to the default', () => {
    expect(buildMapsLink(coords, 'apple', 'android').native).toMatch(/^geo:/);
  });
  it('hides Apple Maps off iOS', () => {
    expect(availableNavigationApps('android').map((o) => o.value)).not.toContain('apple');
    expect(availableNavigationApps('ios').map((o) => o.value)).toContain('apple');
  });
});

describe('hasCoordinates', () => {
  it('is true only when both numbers are set and in range', () => {
    expect(hasCoordinates(site)).toBe(true);
    expect(hasCoordinates({ lat: 0, lng: 0 })).toBe(true);
    expect(hasCoordinates(noCoords)).toBe(false);
    expect(hasCoordinates({ lat: 44.1, lng: null })).toBe(false);
    expect(hasCoordinates({ lat: Number.NaN, lng: -69.9 })).toBe(false);
    expect(hasCoordinates({ lat: 91, lng: -69.9 })).toBe(false);
    expect(hasCoordinates({ lat: 44.1, lng: 181 })).toBe(false);
  });
});
