import { getIsoDate, getTimeFromMs } from '../utils/dates-helper';
import { mergeTimeStore } from '../utils/merge-time-store';
import {
  connect,
  TimeTrackerStoreStateTableKeys,
  TimeTrackerStoreTables
} from './idb';

import { TimeStore } from './types';

const SOURCE = 'DB/SYNC-Stroage';

export const getDbCache = async (): Promise<TimeStore> => {
  const db = await connect();
  const store = await db.get(
    TimeTrackerStoreTables.State,
    TimeTrackerStoreStateTableKeys.OverallState,
  );
  return (store || {}) as TimeStore;
};

const setTotalActivity = async (store: TimeStore) => {
  // await setDbCache(store);
  await chrome.storage.local.set({
    activity: store,
  });
};

export const getLocalActivity = async (): Promise<TimeStore> => {
 const {activity={}} = await chrome.storage.local.get('activity')
 return activity;
}

export const getTotalActivity = async (): Promise<TimeStore> => {
  const [localStore, dbStore] = await Promise.all([
    chrome.storage.local.get('activity').then((store) => store?.activity ?? {}),
    getDbCache(),
  ]);
  // TODO : impliment : getLocalActivity
  return mergeTimeStore(dbStore, localStore);
};

export const getCurrentHostTime = async (host: string): Promise<number> => {
  const store: TimeStore = await getTotalActivity();
  const currentDate = getIsoDate(new Date());

  return store[currentDate]?.[host] ?? 0;
};

export const setTotalDailyHostTime = async ({
  date: day,
  host,
  duration,
}: {
  date: string;
  host: string;
  duration: number;
}) => {
  const store = await getTotalActivity();
 // console.log("Harman Store",store);
  const dayActivity = (store[day] ??= {}) as Record<string, number>;
  const existingDuration = (dayActivity[host] ?? 0)

  dayActivity[host] = duration;
  
  Logger.debug(SOURCE, `setTotalDailyHostTime: Host ${host}, Existing Duration ${getTimeFromMs(existingDuration)} - ${existingDuration}ms , NEW Duration ${getTimeFromMs(duration)} - ${duration}ms`);

  await setTotalActivity(store);

};
