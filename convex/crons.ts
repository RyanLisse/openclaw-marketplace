import { cronJobs } from 'convex/server';
import { internal } from './_generated/api';

const crons = cronJobs();

crons.monthly(
  'reputation-decay',
  { day: 1, hourUTC: 0, minuteUTC: 0 },
  internal.reputation.runDecayForAll
);

crons.daily(
  'stale-intent-cleanup',
  { hourUTC: 0, minuteUTC: 0 },
  internal.cleanup.cleanStaleIntents
);

crons.hourly(
  'match-expiration',
  { minuteUTC: 0 },
  internal.cleanup.expireMatches
);

export default crons;
