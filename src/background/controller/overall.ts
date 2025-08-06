import { setTotalDailyHostTime } from '../../shared/db/sync-storage';
import { getActivityTimeline } from '../tables/activity-timeline';

export async function updateTotalTime(
  currentIsoDate: string,
  hostname: string,
) {
  const timeline = await getActivityTimeline(currentIsoDate);
  
  const timeOnRecord = timeline
    .filter((t) => t.hostname === hostname && t?.synced !== true)
    .reduce((acc, t) => {
        const duration = t.activityPeriodEnd - t.activityPeriodStart;
        return acc + (duration > 0 ? duration : 0); // sanitize data so that negative intervals are ignored
      }, 0);

  await setTotalDailyHostTime({
    date: currentIsoDate,
    duration: timeOnRecord,
    host: hostname
  });
}

// This file exports a function updateTotalTime that updates the total amount of
// time spent by the user on a specific hostname for a given date. It retrieves
// the activity timeline for the given date and hostname, calculates the total
// time spent on the hostname for that day, and stores it using the
// setTotalDailyHostTime function from ../../shared/db/sync-storage.
