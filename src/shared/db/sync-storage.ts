import { getIsoDate } from '../utils/dates-helper';
import { mergeTimeStore } from '../utils/merge-time-store';
import { IDBPDatabase} from 'idb';
import {
  connect,
  TimeTrackerStoreStateTableKeys,
  TimeTrackerStoreTables,
  TimelineDatabase
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

// const getDbStateTbl = async (key:string): Promise<string[]> => {
//   const db = await connect();
//   const store = await db.get(
//     TimeTrackerStoreTables.State,
//     TimeTrackerStoreStateTableKeys[key],
//   );
//   return (store || []);
// };

export const getAllStates = async () => {
  const db = await connect();
  return await getAllRecordsWithKeysUsingGetAll(db, TimeTrackerStoreTables.State)
};


interface RecordWithKey<T> {
  key: IDBValidKey;
  value: T;
}

const getAllRecordsWithKeysUsingGetAll = async(
  db: IDBPDatabase<TimelineDatabase>,
  storeName: TimeTrackerStoreTables
): Promise<RecordWithKey<TimelineDatabase[TimeTrackerStoreTables]['value']>[]> => {

  const transaction = db.transaction(storeName, "readonly");
  const store = transaction.objectStore(storeName);

  // Fetch keys and values concurrently within the same transaction
  const [keys, values] = await Promise.all([
    store.getAllKeys(),
    store.getAll()
  ]);

  // Ensure keys and values arrays have the same length 
  if (keys.length !== values.length) {
    console.error(`Data inconsistency: Keys (${keys.length}) and Values (${values.length}) count mismatch for store '${storeName}'.`);
    Logger?.error(`Data inconsistency in store '${storeName}'.`); 
    return []; // Return empty or throw, depending on desired error handling
  }

  // Combine keys and values. The type of 'value' is inferred correctly from TimelineDatabase[StoreName]['value'].
  // const combined: RecordWithKey<TimelineDatabase[TimeTrackerStoreTables]['value']>[] = keys.map((key, index) => ({
  const combined: any[] = keys.map((key, index) => ({
    key: key,
    value: values[index], // values[index] will correctly be of type TimelineDatabase[StoreName]['value']
  }));

  // Wait for the transaction to complete
  await transaction.done;

  return combined;
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
  const store = await getTotalActivity();
  const currentDate = getIsoDate(new Date());
  
  return (store[currentDate] as any)?.[host] ?? 0;
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

  Logger.debug(`setTotalDailyHostTime: Host ${host}, Duration ${duration}`);
  
  return setTotalActivity(store);
};
