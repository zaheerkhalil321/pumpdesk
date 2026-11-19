import { fromZonedTime, toZonedTime } from 'date-fns-tz';
import { Operator, OperatorJob, TicketExtra, WorkTicketDraft } from './types';

export const SEED_OPERATOR: Operator = {
  employeeId: 'emp-001',
  firstName: 'Rob',
  lastName: 'Black',
  phone: '+12075550168',
  company: {
    id: 'comp-midcoast-01',
    name: 'Midcoast Concrete Pumping',
    town: 'Warren, Maine',
    dispatchPhone: '+12075550199',
    termsUrl: 'https://midcoastconcrete.com/terms',
  },
};

export const SEED_EXTRAS: TicketExtra[] = [
  { code: 'offsite_washout', label: 'Off-site washout' },
  { code: 'primer_bag', label: 'Primer bag' },
  { code: 'extra_operator', label: 'Extra operator' },
];

export function createInitialSeedJobs(): {
  jobs: OperatorJob[];
  tickets: Record<string, WorkTicketDraft>;
} {
  // "Today" and every seeded time are built in the jobs' own time zone, so the demo looks the same
  // whatever time zone the phone is set to.
  const seedZone = 'America/New_York';
  const now = toZonedTime(new Date(), seedZone);
  const year = now.getFullYear();
  const month = now.getMonth();
  const day = now.getDate();

  const makeOffsetDayIso = (daysOffset: number, hours: number, minutes: number = 0) => {
    const d = new Date(year, month, day + daysOffset, hours, minutes, 0);
    return fromZonedTime(d, seedZone).toISOString();
  };

  const makeTodayIso = (hours: number, minutes: number = 0) => makeOffsetDayIso(0, hours, minutes);

  const shopPlace = {
    name: 'Midcoast Concrete Pumping',
    label: 'Midcoast Concrete Pumping · Warren, ME',
    street: '142 Main St',
    town: 'Warren, ME',
    lat: 44.1181,
    lng: -69.2414,
  };

  const jobs: OperatorJob[] = [
    // 1. 7:00 AM Today - Completed & submitted
    {
      id: 'job-101',
      jobNumber: 'ORD-1524',
      jobName: 'Main St Footings',
      customerName: 'Coastal Builders',
      site: {
        label: '24 Main St, Rockland, ME',
        street: '24 Main St',
        town: 'Rockland',
        lat: 44.1037,
        lng: -69.1089,
      },
      shop: shopPlace,
      timezone: 'America/New_York',
      arriveShopBy: makeTodayIso(6, 0),
      pourStartsAt: makeTodayIso(7, 0),
      pump: { unit: '02', label: '28m boom' },
      estimatedYards: 35,
      notesForOperator: 'Pour footings behind main garage. Watch out for overhead tree branches.',
      siteContact: { name: 'Dave Miller', role: 'Superintendent', phone: '+12075550211' },
      isCancelled: false,
      changedSinceSeen: false,
      acknowledgedAt: makeTodayIso(5, 30),
      steps: {
        arrived_shop: makeTodayIso(6, 2),
        departed_shop: makeTodayIso(6, 25),
        arrived_site: makeTodayIso(6, 50),
        departed_site: makeTodayIso(9, 45),
      },
      ticketStatus: 'submitted',
    },

    // 2. 10:30 AM Today - 18 Camden St (Active job in Figma)
    {
      id: 'job-102',
      jobNumber: 'ORD-1525',
      jobName: 'Camden St Slab',
      customerName: 'Accurate Concrete',
      site: {
        label: '18 Camden St, Rockport, ME',
        street: '18 Camden St',
        town: 'Rockport',
        lat: 44.1856,
        lng: -69.0764,
      },
      shop: shopPlace,
      timezone: 'America/New_York',
      arriveShopBy: makeTodayIso(8, 0),
      pourStartsAt: makeTodayIso(10, 30),
      pump: { unit: '02', label: '28m boom' },
      estimatedYards: 45,
      notesForOperator: 'Call Dave 30 mins before arrival. Soft shoulder near the driveway entrance.',
      siteContact: { name: 'Dave Stevens', role: 'Job Lead', phone: '+12075550214' },
      isCancelled: false,
      changedSinceSeen: false,
      acknowledgedAt: makeTodayIso(7, 45),
      steps: {
        arrived_shop: null,
        departed_shop: null,
        arrived_site: null,
        departed_site: null,
      },
      ticketStatus: 'not_started',
    },

    // 3. 2:00 PM Today - 65 Atlantic Ave (Later job in Figma)
    {
      id: 'job-103',
      jobNumber: 'ORD-1526',
      jobName: 'Atlantic Ave Pour',
      customerName: 'Penobscot Homes',
      site: {
        label: '65 Atlantic Ave, Camden, ME',
        street: '65 Atlantic Ave',
        town: 'Camden',
        lat: 44.2098,
        lng: -69.0648,
      },
      shop: shopPlace,
      timezone: 'America/New_York',
      arriveShopBy: null,
      pourStartsAt: makeTodayIso(14, 0),
      pump: { unit: '02', label: '28m boom' },
      estimatedYards: 28,
      notesForOperator: 'Interior basement slab pour. Have 100ft 3in hose ready.',
      siteContact: { name: 'Mike Ross', role: 'Site Manager', phone: '+12075550299' },
      isCancelled: false,
      changedSinceSeen: false,
      acknowledgedAt: makeTodayIso(9, 15),
      steps: {
        arrived_shop: null,
        departed_shop: null,
        arrived_site: null,
        departed_site: null,
      },
      ticketStatus: 'not_started',
    },

    // 3b. 12:15 PM Today - fresh job for testing the full flow (acknowledge -> steps -> ticket)
    {
      id: 'job-104',
      jobNumber: 'ORD-1527',
      jobName: 'Union St Garage Slab',
      customerName: 'Pine Tree Builders',
      site: {
        label: '31 Union St, Rockland, ME',
        street: '31 Union St',
        town: 'Rockland',
        lat: 44.1019,
        lng: -69.1076,
      },
      shop: shopPlace,
      timezone: 'America/New_York',
      arriveShopBy: makeTodayIso(11, 0),
      pourStartsAt: makeTodayIso(12, 15),
      pump: { unit: '02', label: '28m boom' },
      estimatedYards: 22,
      notesForOperator: 'Residential garage slab. Narrow driveway, back the truck in.',
      siteContact: { name: 'Karen Doyle', role: 'Homeowner', phone: '+12075550377' },
      isCancelled: false,
      changedSinceSeen: false,
      acknowledgedAt: null,
      steps: {
        arrived_shop: null,
        departed_shop: null,
        arrived_site: null,
        departed_site: null,
      },
      ticketStatus: 'not_started',
    },

    // 4. Upcoming +2 days
    {
      id: 'job-201',
      jobNumber: 'ORD-1530',
      jobName: 'Camden Harbor Retaining Wall',
      customerName: 'Harbor Marine',
      site: {
        label: '65 Atlantic Ave, Camden, ME',
        street: '65 Atlantic Ave',
        town: 'Camden',
        lat: 44.2098,
        lng: -69.0648,
      },
      shop: shopPlace,
      timezone: 'America/New_York',
      arriveShopBy: makeOffsetDayIso(2, 12, 30),
      pourStartsAt: makeOffsetDayIso(2, 14, 0),
      pump: { unit: '02', label: '28m boom' },
      estimatedYards: 60,
      notesForOperator: 'Tight parking lot. Flagman will meet you at entrance.',
      siteContact: { name: 'Sarah King', role: 'Project Manager', phone: '+12075550341' },
      isCancelled: false,
      changedSinceSeen: false,
      acknowledgedAt: null,
      steps: {
        arrived_shop: null,
        departed_shop: null,
        arrived_site: null,
        departed_site: null,
      },
      ticketStatus: 'not_started',
    },

    // 5. Upcoming +4 days
    {
      id: 'job-202',
      jobNumber: 'ORD-1534',
      jobName: 'Thomaston Commercial Pier',
      customerName: 'Midcoast Construction',
      site: {
        label: '10 Industrial Way, Thomaston, ME',
        street: '10 Industrial Way',
        town: 'Thomaston',
        lat: 44.0792,
        lng: -69.1834,
      },
      shop: shopPlace,
      timezone: 'America/New_York',
      arriveShopBy: makeOffsetDayIso(4, 7, 30),
      pourStartsAt: makeOffsetDayIso(4, 9, 0),
      pump: { unit: '02', label: '28m boom' },
      estimatedYards: 85,
      notesForOperator: 'High strength commercial mix. Two washouts on site.',
      siteContact: { name: 'Tom Vance', role: 'Superintendent', phone: '+12075550412' },
      isCancelled: false,
      changedSinceSeen: false,
      acknowledgedAt: null,
      steps: {
        arrived_shop: null,
        departed_shop: null,
        arrived_site: null,
        departed_site: null,
      },
      ticketStatus: 'not_started',
    },
  ];

  const tickets: Record<string, WorkTicketDraft> = {
    'job-101': {
      jobId: 'job-101',
      arrivedOnSiteAt: makeTodayIso(6, 50),
      startedPourAt: makeTodayIso(7, 10),
      finishedPourAt: makeTodayIso(9, 20),
      departedSiteAt: makeTodayIso(9, 45),
      yardsPumped: 36.5,
      hose3inFt: 50,
      hose4inFt: 0,
      extras: ['offsite_washout'],
      comments: 'Clean pour, no delays.',
      signerName: 'Dave Miller',
      signaturePng: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
      signedAt: makeTodayIso(9, 40),
      updatedAt: makeTodayIso(9, 42),
    },
  };

  return { jobs, tickets };
}
