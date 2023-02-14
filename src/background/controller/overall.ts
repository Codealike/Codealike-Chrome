import { setTotalDailyHostTime } from '../../shared/db/sync-storage';

import { getActivityTimeline } from '../tables/activity-timeline';

export async function updateTotalTime(
  currentIsoDate: string,
  hostname: string
) {
  const timeline = await getActivityTimeline(currentIsoDate);
  const timeOnRecord = timeline
    .filter((t) => t.hostname === hostname)
    .reduce((acc, t) => acc + t.activityPeriodEnd - t.activityPeriodStart, 0);

  await setTotalDailyHostTime({
    host: hostname,
    date: currentIsoDate,
    duration: timeOnRecord,
  });
}

// This file exports a function updateTotalTime that updates the total amount of 
// time spent by the user on a specific hostname for a given date. It retrieves 
// the activity timeline for the given date and hostname, calculates the total 
// time spent on the hostname for that day, and stores it using the 
// setTotalDailyHostTime function from ../../shared/db/sync-storage.