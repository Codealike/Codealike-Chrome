import { ignore } from '../../shared/utils/errors';

import { isTabNotExistError } from './errors';

export const setActionBadge = async ({
  tabId,
  text,
  color = '#4b76e3',
}: {
  tabId: number;
  text: string;
  color: string;
}) => {
  await Promise.all([
    chromeActionSetBadgeColor(tabId, color),
    chromeActionSetBadgeText(tabId, text),
  ]).catch(ignore(isTabNotExistError));
};

export const hideBadge = async (tabId: number) => {
  await Promise.all([chromeActionSetBadgeText(tabId, '')]).catch(
    ignore(isTabNotExistError)
  );
};

function chromeActionSetBadgeColor(tabId: number, color: string) {
  return new Promise<void>((resolve) =>
    chrome.action?.setBadgeBackgroundColor
      ? chrome.action.setBadgeBackgroundColor({ color, tabId }, resolve)
      : resolve()
  );
}

function chromeActionSetBadgeText(tabId: number, text: string) {
  return new Promise<void>((resolve) =>
    chrome.action?.setBadgeText
      ? chrome.action.setBadgeText({ text, tabId }, resolve)
      : resolve()
  );
}

/**
 * This file defines two functions setActionBadge and hideBadge
 *  that set and hide the badge on a Chrome extension's action icon
 *  for a specific tab. The setActionBadge function takes a tab ID, 
 * text to display on the badge, and an optional color for the badge, 
 * and updates the badge accordingly using the chrome.action API. 
 * The hideBadge function takes a tab ID and hides the badge for that tab.
 *  The chromeActionSetBadgeColor and chromeActionSetBadgeText functions
 *  are helper functions that wrap the chrome.action API calls for setting 
 * the badge's color and text, respectively. If the tab specified in the function 
 * does not exist, any errors thrown are caught and ignored 
 * using the ignore function from a shared utility file.
  */