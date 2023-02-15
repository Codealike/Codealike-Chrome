import { TimelineRecord } from '../../shared/db/types';

import { putActivityTimelineRecord } from '../tables/activity-timeline';

export async function saveTimelineRecord(
  currentTimelineRecord: TimelineRecord,
  currentIsoDate: string
) {
  if (currentTimelineRecord.date === currentIsoDate) {
    await putActivityTimelineRecord(currentTimelineRecord);
    return;
  }

  // Edge case: Event started before midnight and finished after
  const midnightToday = new Date(currentIsoDate).setHours(0);
  const millisecondBeforeMidnight = midnightToday - 1;

  // We need to split dates into 2 events for iso date index to work
  const yesterdayTimeline = { ...currentTimelineRecord };
  yesterdayTimeline.activityPeriodEnd = millisecondBeforeMidnight;

  currentTimelineRecord.activityPeriodStart = midnightToday;
  currentTimelineRecord.date = currentIsoDate;

  await putActivityTimelineRecord(yesterdayTimeline);
  await putActivityTimelineRecord(currentTimelineRecord);
}


// This file defines a function called saveTimelineRecord which saves 
// a TimelineRecord to the activity timeline table.
// If the date property of the currentTimelineRecord matches the currentIsoDate 
// argument, it is added to the table with putActivityTimelineRecord. 
// If they don't match, it indicates that the event started before midnight and 
// finished after, so the function splits it into two events for the ISO date 
// index to work. The first event represents the activity before midnight, and 
// the second event represents the activity after midnight on the current date. 
// The first event is created by copying the currentTimelineRecord object and 
// changing the activityPeriodEnd property to one millisecond before midnight 
// on the previous day. The second event is created by updating the activityPeriodStart 
// and date properties of currentTimelineRecord to reflect the current day and adding 
// it to the activity timeline table using putActivityTimelineRecord.