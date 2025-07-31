import { getIsoDate, getTimeFromMs } from '../utils/dates-helper';
import {
  connect,
  TimeTrackerStoreStateTableKeys,
  TimeTrackerStoreTables
} from './idb';
import { getSettings } from '../../shared/preferences';
import { TimeStore } from './types';

import {
  Preferences,
  ConnectionStatus
} from '../../shared/db/types';

import { Logger } from '../../shared/utils/logger';

const SOURCE = 'DB/SYNC-Stroage';

export const getDbCache = async (): Promise<TimeStore> => {
  const db = await connect();
  const store = await db.get(
    TimeTrackerStoreTables.State,
    TimeTrackerStoreStateTableKeys.OverallState,
  );
  return (store || {}) as TimeStore;
};

export const setDbCacheTimeStore = async (store: TimeStore) => {
  const db = await connect();
  await db.put(
    TimeTrackerStoreTables.State,
    store,
    TimeTrackerStoreStateTableKeys.OverallState,
  );
};

const setTotalActivity = async (store: TimeStore) => {
  //Logger.debug(SOURCE,`setTotalActivity`, store);
  await setDbCacheTimeStore(store);
};

export const getLocalActivity = async (): Promise<TimeStore> => {
 const {activity={}} = await chrome.storage.local.get('activity')
 return activity;
}

export const getTotalActivity = async (): Promise<TimeStore> => {
  const preferences: Preferences = await getSettings();

  // Check if account is not connected with API key
  if (preferences.connectionStatus !== ConnectionStatus.Connected) {
     const dbStore = await getDbCache();
    return dbStore;
  }
  
  const dbStore = await getLocalActivity();
  return dbStore
};

export const getCurrentHostTime = async (host: string): Promise<number> => {
  const store: TimeStore = await getTotalActivity();
  const currentDate = getIsoDate(new Date());

  return store[currentDate]?.[host] ?? 0;
};

export const setTotalDailyHostTime = async ({
  date: day,
  host,
  duration
}: {
  date: string;
  host: string;
  duration: number;
}) => {
  const store:TimeStore = await getDbCache();
  const dayActivity = (store[day] ??= {}) as Record<string, number>;
  const existingDuration = (dayActivity[host] ?? 0)

  dayActivity[host] = duration;

  const logStr =  "\n--- setTotal Time Cache --\nHost: " + host + 
                  "\nExisting Duration: " + getTimeFromMs(existingDuration) + " - "+ existingDuration+ "ms" +
                  "\nNEW Duration : " + getTimeFromMs(duration) + " - " + duration + "ms";

  Logger.debug(SOURCE, `setTotalDailyHostTime: ${logStr}`, dayActivity);

  await setTotalActivity(store);
};
