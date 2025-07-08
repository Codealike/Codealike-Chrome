import { getIsoDate, getTimeFromMs } from '../utils/dates-helper';
import { mergeTimeStore } from '../utils/merge-time-store';
import {
  connect,
  TimeTrackerStoreStateTableKeys,
  TimeTrackerStoreTables
} from './idb';

import { TimeStore } from './types';

const getDbCache = async (): Promise<TimeStore> => {
  const db = await connect();
  const store = await db.get(
    TimeTrackerStoreTables.State,
    TimeTrackerStoreStateTableKeys.OverallState,
  );
  return (store || {}) as TimeStore;
};

const setDbCache = async (store: TimeStore) => {
  const db = await connect();
  await db.put(
    TimeTrackerStoreTables.State,
    store,
    TimeTrackerStoreStateTableKeys.OverallState,
  );
};

const setTotalActivity = async (store: TimeStore) => {
  await setDbCache(store);
  await chrome.storage.local.set({
    activity: store,
  });
};

export const getTotalActivity = async (): Promise<TimeStore> => {
  const [localStore, dbStore] = await Promise.all([
    chrome.storage.local.get('activity').then((store) => store?.activity ?? {}),
    getDbCache(),
  ]);
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

  const dayActivity = (store[day] ??= {}) as Record<string, number>;;
  dayActivity[host] = (dayActivity[host] ?? 0) + duration; // duration addition from timeline


  Logger.debug(`DB/syncStroage::setTotalDailyHostTime: Host ${host}, Duration ${getTimeFromMs(duration)} - ${duration}ms`);
  
  return setTotalActivity(store);
};
