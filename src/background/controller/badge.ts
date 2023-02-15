import { Tab } from '../../shared/browser-api.types';
import { getCurrentHostTime } from '../../shared/db/sync-storage';
import { TimelineRecord } from '../../shared/db/types';
import { presentHoursOrMinutesFromMinutes } from '../../shared/utils/dates-helper';
import { getHostNameFromUrl } from '../../shared/utils/url';

import { setActionBadge, hideBadge } from '../browser-api/badge';

export async function updateTimeOnBadge(
  focusedActiveTab: Tab | null,
  currentTimelineRecord: TimelineRecord | null,
  isEnabled: boolean
) {
  if (!focusedActiveTab?.id) {
    return;
  }

  if (!isEnabled) {
    return hideBadge(focusedActiveTab?.id);
  }

  const [committedHostTime] = await Promise.all([
    focusedActiveTab.url
      ? getCurrentHostTime(getHostNameFromUrl(focusedActiveTab.url))
      : 0,
  ]);

  const notCommittedHostTime =
    (currentTimelineRecord?.activityPeriodEnd ?? Date.now()) -
    (currentTimelineRecord?.activityPeriodStart ?? Date.now());

  const currentHostTimeInMinutes = Math.floor(
    (committedHostTime + notCommittedHostTime) / 1000 / 60
  );

  if (currentHostTimeInMinutes > 0) {
    await setActionBadge({
      text: presentHoursOrMinutesFromMinutes(currentHostTimeInMinutes),
      tabId: focusedActiveTab.id,
      color: '#4b76e3',
    });
  } else {
    await hideBadge(focusedActiveTab.id);
  }
}


// This file exports a function called updateTimeOnBadge that updates a badge in the 
// browser extension with the amount of time spent on the currently focused tab. The 
// function takes three arguments: focusedActiveTab, which is an object that contains 
// information about the currently focused tab; currentTimelineRecord, which is an 
// object that contains information about the user's activity on the tab; and 
// isEnabled, a boolean that determines whether the badge is visible or not.

// The function first checks if the focusedActiveTab object has a valid id, 
// and if not, returns without doing anything. If isEnabled is false, 
// the function hides the badge and returns.

// Next, the function calculates the amount of time the user has spent on the current 
// host (i.e., the website) by querying a database for the time the user has already 
// spent on the website (committedHostTime) and subtracting it from the time elapsed 
// since the user first started interacting with the website (notCommittedHostTime). 
// The result is converted from milliseconds to minutes and stored in the variable 
// currentHostTimeInMinutes.

// If currentHostTimeInMinutes is greater than zero, the function updates the badge 
// with the number of minutes using the setActionBadge function, which takes a text 
// string, a tab ID, and a color as arguments. The text is generated using a helper 
// function called presentHoursOrMinutesFromMinutes, which formats the time as either 
// hours and minutes or minutes, depending on the duration. If currentHostTimeInMinutes 
// is less than or equal to zero, the function hides the badge using the hideBadge function.

