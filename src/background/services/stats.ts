import { sendStats } from '../../shared/api/client';
import { connect, disconnect, TimeTrackerStoreTables, 
      //  TimeTrackerStoreStateTableKeys 
      } from '../../shared/db/idb';
import {
  ConnectionStatus,
  Preferences,
  TimelineRecord,
  // TimeStore,
  WebActivityLog,
  WebActivityRecord,
} from '../../shared/db/types';
import { getSettings, setSettings } from '../../shared/preferences';
import { DateTime } from 'luxon';
import { getDbCache, getLocalActivity } from '../../shared/db/sync-storage'
import { getIsoDate } from '../../shared/utils/dates-helper';
import { sumTimeStores } from '../../shared/utils/merge-time-store';

const SOURCE = 'BACKGROUND/SERVICES/STATS';

const fetchStatistics = async (): Promise<{
  timeline: TimelineRecord[];
}> => {
  const db = await connect();
  const timeline = await db.getAll(TimeTrackerStoreTables.Timeline);

  return {
    timeline,
  };
};


const clearStatistics = async (): Promise<void> => {

   const [localStore, dbStore] = await Promise.all([
    getLocalActivity(),
    getDbCache(),
  ]);

  const totalActivites = sumTimeStores(dbStore,localStore);

  Logger.debug(SOURCE,`clearStatistics:sumTimeStores -> LOCAL:: ${JSON.stringify(localStore)} \n DBCacheStore:: ${JSON.stringify(dbStore)} `)
  Logger.debug(SOURCE,`clearStatistics:sumTimeStores -> TOTAL : ${JSON.stringify(totalActivites)} `)
  
  await chrome.storage.local.set({
    activity: totalActivites,
  });

  await disconnect();
  const db = await connect();
  await db.clear(TimeTrackerStoreTables.State);

  //await deleteOldTimelineRecords(); // clear timeline 
  await disconnect();
  await db.clear(TimeTrackerStoreTables.Timeline);

};

// Assuming SOURCE, Logger, connect, TimeTrackerStoreTables, getIsoDate, TimelineRecord are imported/defined

const _deleteOldTimelineRecords = async(): Promise<void> => {
    const storeName = TimeTrackerStoreTables.Timeline; 

    Logger.info(SOURCE, `deleteOldTimelineRecords: Initiating deletion of old timeline records from '${storeName}' store.`);

    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);
    twoDaysAgo.setHours(0, 0, 0, 0);
    const cutoffIsoDate = getIsoDate(twoDaysAgo);

    Logger.debug(SOURCE, `deleteOldTimelineRecords: Calculated cutoff date for records: ${cutoffIsoDate}`);

    const db = await connect();

    const tx = db.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);

    try {
        // Get all records in the store
        const allRecords = await store.getAll() as TimelineRecord[];

        // Find IDs of records to delete, ensuring 'id' is defined and a valid key type
        const idsToDelete: (number)[] = allRecords
            .filter(record => record.date < cutoffIsoDate && record.id !== undefined && (typeof record.id === 'number'))
            .map(record => record.id as (number)); // Cast to specific IDBValidKey types

        if (idsToDelete.length === 0) {
            Logger.info(SOURCE, "No old records found to delete based on cutoff date or missing IDs.");
            await tx.done;
            return;
        }

        // Batch delete by key
        // Each delete call runs within the same transaction.
        await Promise.all(idsToDelete.map((id:any) => store.delete(id)));

        Logger.info(SOURCE, `Successfully deleted ${idsToDelete.length} old records from '${storeName}'.`);

    } catch (e) {
        Logger.error(SOURCE, `Error during deletion of old timeline records from '${storeName}':`);
      //  throw e;
    } finally {
        try {
            await tx.done;
            Logger.debug(SOURCE, "Transaction for old record deletion completed.");
        } catch (txError) {
            Logger.error(SOURCE, "Transaction for old record deletion failed or aborted:");
           // throw txError;
        }
    }
}
// export async function deleteOldTimelineRecords(): Promise<void> {

//   // Calculate the cutoff date (2 days ago) in ISO format
//   const today = new Date();
//   today.setHours(0, 0, 0, 0); // Normalize to midnight
//   const cutoffDate = new Date(today);
//   cutoffDate.setDate(today.getDate() - 2);
//   const cutoffIso = getIsoDate(cutoffDate); // e.g., "2025-07-26"

//   // Open your IndexedDB
//   const db = await connect();

//   // Get all keys & corresponding records
//   const tx = db.transaction(TimeTrackerStoreTables.State, 'readwrite');
//   const store = tx.objectStore(TimeTrackerStoreTables.State);

//   // Get all records (optionally, you can use indexes to optimize)
//   let cursor = await store.openCursor();
//   while (cursor) {
//     const record = cursor.value;
//     if (isTimelineRecord(record) && record.date < cutoffIso) {
//       await cursor.delete();
//     }
//     cursor = await cursor.continue();
//   }

//   await tx.done;
//   db.close();
//   console.log('Old records deleted from timeline.');
// }

const emitSuccessSyncStats = async (
  preferences: Preferences,
  callback: (input: { result: string }) => Promise<void>,
): Promise<void> => {
  await callback({
    result: 'ok',
  });

  let lastUpdateDateTime = DateTime.fromJSDate(new Date());
  if (preferences.lastUpdateStats?.Datetime) {
    lastUpdateDateTime = DateTime.fromISO(preferences.lastUpdateStats?.Datetime);
  }

  await chrome.action.setTitle({
    title:
      "Codealike time tracker. You're authenticated to Codealike. Last bundle of stats sent " +
      lastUpdateDateTime.toLocaleString(DateTime.DATETIME_SHORT) + '.',
  });
  await chrome.action.setBadgeText({
    text: '',
  });

  await setSettings({
    lastUpdateStats: {
      Datetime: new Date().toJSON(),
      Status: 'OK'
    },
  });
};

const emitFailedSyncStats = async (
  preferences: Preferences,
  callback: (input: { result: string }) => Promise<void>,
): Promise<void> => {
  await callback({
    result: 'failed',
  });

  let lastUpdateDateTime = DateTime.fromJSDate(new Date());
  if (preferences.lastUpdateStats?.Datetime) {
    lastUpdateDateTime = DateTime.fromISO(preferences.lastUpdateStats?.Datetime);
  }
  await chrome.action.setTitle({
    title:
      'Codealike time tracker. An error happened trying to send Web Activity ' +
      lastUpdateDateTime.toLocaleString(DateTime.DATETIME_SHORT) + '.',
  });
  await chrome.action.setBadgeText({
    text: '',
  });

  await setSettings({
    lastUpdateStats: {
      Datetime: new Date().toJSON(),
      Status: 'NOK',
    },
  });
};

const transformToWebActivity = (record: TimelineRecord): WebActivityRecord => {
  const startTime = DateTime.fromMillis(record.activityPeriodStart);
  const endTime = DateTime.fromMillis(record.activityPeriodEnd);
  const difference = endTime.diff(startTime, ['seconds']).toObject();

  return {
    Duration: difference.seconds as number,
    FavIconUrl: record.favIconUrl,
    From: startTime,
    Secure: record.secure,
    Status: record.status,
    Title: record.docTitle,
    Url: record.url,
  };
};

const transformToWebActivityLog = (record: TimelineRecord): WebActivityLog => {
  const startTime = DateTime.fromMillis(record.activityPeriodStart);
  const endTime = DateTime.fromMillis(record.activityPeriodEnd);
  const difference = endTime.diff(startTime, ['seconds']).toObject();

  return {
    Duration: difference.seconds as number,
    From: startTime,
    Status: record.status,
  };
};

const transformTimelineInWebActivity = (
  timeline: TimelineRecord[],
): {
  records: WebActivityRecord[];
  states: WebActivityLog[];
} => {
  const webActivityRecords: WebActivityRecord[] = [];
  const webActivityLogs: WebActivityLog[] = [];

  timeline.forEach((item) => {
    webActivityRecords.push(transformToWebActivity(item));
    webActivityLogs.push(transformToWebActivityLog(item));
  });

  return {
    records: webActivityRecords,
    states: webActivityLogs,
  };
};

const sendWebActivity = async (
  preferences: Preferences,
  timeline: TimelineRecord[],
  callback: (input: { result: string }) => Promise<void>,
): Promise<void> => {
  const userToken = preferences.userToken as string;
  if (timeline.length == 0) {
    await emitSuccessSyncStats(preferences, callback);
    return;
  }

  const { records, states } = transformTimelineInWebActivity(timeline);
  let result = null;
  try {
    result = await sendStats(userToken, records, states);
  }
  catch (err) {
    console.log(err);
  }
  if (result) {
    await Promise.all([
      emitSuccessSyncStats(preferences, callback),
      clearStatistics(),
    ]);
  } else {
    await emitFailedSyncStats(preferences, callback);
  }
};

const sendWebActivityAutomatically = async (): Promise<void> => {
  const preferences: Preferences = await getSettings();
  if (preferences.connectionStatus !== ConnectionStatus.Connected) {
    // await logMessage('unable to send stats when not connected');
    Logger.warn(SOURCE, 'unable to send stats when not connected');
    return;
  }

  const { timeline } = await fetchStatistics();

  await sendWebActivity(preferences, timeline, async (response) => {
    Logger.info(SOURCE, `sendWebActivityAutomatically`, response);
  });
};

export { sendWebActivityAutomatically };
