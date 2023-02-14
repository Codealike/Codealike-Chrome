import { ActiveTabState, TimelineRecord } from '../../shared/db/types';
import { getSettings } from '../../shared/preferences';
import { getIsoDate, getMinutesInMs } from '../../shared/utils/dates-helper';
import { isInvalidUrl } from '../../shared/utils/url';

import { setActiveTabRecord } from '../tables/state';

import { ActiveTimelineRecordDao, createNewActiveRecord } from './active';
import { updateTimeOnBadge } from './badge';
import { handlePageLimitExceed } from './limits';
import { updateTotalTime } from './overall';
import { saveTimelineRecord } from './timeline';

const FIVE_MINUTES = getMinutesInMs(5);
export const handleStateChange = async (
  activeTabState: ActiveTabState,
  timestamp: number = Date.now()
) => {
  const preferences = await getSettings();
  const activeTimeline = new ActiveTimelineRecordDao();
  const currentTimelineRecord = await activeTimeline.get();

  const focusedActiveTab = activeTabState.focusedActiveTab ?? null;
  const isLocked = activeTabState.idleState === 'locked';
  const isNotFocused = !focusedActiveTab;
  const isIdleAndNotAudible =
    activeTabState.idleState === 'idle' && !focusedActiveTab?.audible;

  const lastHeartbeatTs =
    currentTimelineRecord?.activityPeriodEnd ??
    currentTimelineRecord?.activityPeriodStart ??
    timestamp;
  const isImpossiblyLongEvent = timestamp - lastHeartbeatTs > FIVE_MINUTES;

  if (currentTimelineRecord) {
    currentTimelineRecord.activityPeriodEnd = isImpossiblyLongEvent
      ? currentTimelineRecord.activityPeriodEnd
      : timestamp;

    await activeTimeline.set(currentTimelineRecord);
  }

  const isDomainIgnored = preferences.ignoredHosts.includes(
    currentTimelineRecord?.hostname ?? ''
  );

  updateTimeOnBadge(
    focusedActiveTab,
    currentTimelineRecord,
    preferences.displayTimeOnBadge && !isDomainIgnored
  );

  if (!isDomainIgnored) {
    handlePageLimitExceed(
      preferences.limits,
      focusedActiveTab,
      currentTimelineRecord
    );
  }

  if (
    isLocked ||
    isNotFocused ||
    isIdleAndNotAudible ||
    isImpossiblyLongEvent ||
    isInvalidUrl(focusedActiveTab?.url)
  ) {
    await commitTabActivity(await activeTimeline.get());

    return;
  }

  if (currentTimelineRecord?.url !== focusedActiveTab.url) {
    await commitTabActivity(await activeTimeline.get());
    await createNewActiveRecord(timestamp, focusedActiveTab);
  }
};

async function commitTabActivity(currentTimelineRecord: TimelineRecord | null) {
  if (!currentTimelineRecord) {
    return;
  }

  const currentIsoDate = getIsoDate(new Date());

  await saveTimelineRecord(currentTimelineRecord, currentIsoDate);

  // Edge case: If update happens after midnight, we need to update the
  // previous day's total time as well.
  // Dates in the array should be different in this case.
  const dates = Array.from(
    new Set([currentIsoDate, currentTimelineRecord.date])
  );

  await Promise.all(
    dates.map((date) => updateTotalTime(date, currentTimelineRecord.hostname))
  );

  await setActiveTabRecord(null);
}


// This file exports a function handleStateChange which is triggered on a change in the user's 
// tab state. It takes two parameters, the activeTabState which contains information 
// about the currently active tab and timestamp which is the time of the event.

// The function first gets the user's preferences and the current active timeline 
// record. It then checks the user's idle state, whether the tab is focused or not,
//  whether the user is on a valid URL, and if the current event is impossibly long. If 
// the current event is impossibly long, the function updates the current timeline 
// record's activityPeriodEnd to prevent a bug in the system. The function then 
// updates the badge if the user has enabled it and checks if the user has 
// exceeded the page limit.

// If the user is not on an ignored domain, the function checks if the user is locked, 
// not focused, idle and not audible, has an impossibly long event, or is on an invalid
//  URL. If any of these conditions are true, the function commits the tab activity and 
// returns.

// If the user is on a new URL, the function commits the tab activity and creates a new 
// active record for the new URL. Finally, the function commits the tab activity and 
// updates the total time for the day for the hostname.