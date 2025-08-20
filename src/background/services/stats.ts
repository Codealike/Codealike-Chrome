import { sendStats } from '../../shared/api/client';
import { connect, TimeTrackerStoreStateTableKeys, TimeTrackerStoreTables } from '../../shared/db/idb';
import {
  ConnectionStatus,
  Preferences,
  TimelineRecord,
  WebActivityLog,
  WebActivityRecord,
} from '../../shared/db/types';
import { getSettings, setSettings } from '../../shared/preferences';
import { DateTime } from 'luxon';
import { getDbCache, getLocalActivity } from '../../shared/db/sync-storage';
import { ActiveTimelineRecordDao } from '../controller/active';
import { getIsoDate } from '../../shared/utils/dates-helper';
import { sumTimeStores } from '../../shared/utils/merge-time-store';
import { Logger } from '../../shared/utils/logger';

const SOURCE = 'BACKGROUND/SERVICES/STATS';

const fetchStatistics = async (): Promise<{
  timeline: TimelineRecord[];
}> => {
  const db = await connect();
  const allTimeline = await db.getAll(TimeTrackerStoreTables.Timeline) as TimelineRecord[];

  // Only fetch unsynced timeline records to avoid duplicating data 
  const unsyncedTimeline = allTimeline.filter(record=>record.synced !==true);
  return {
    timeline: unsyncedTimeline,
  };
};

const clearStatistics = async (): Promise<void> => {

   const [localStore, dbStore] = await Promise.all([
    getLocalActivity(), // Persistent
    getDbCache(), // temp cache
  ]);

  const totalActivities = sumTimeStores(localStore,dbStore);

  const currentISODate = getIsoDate(new Date());

  Logger.debug(
    SOURCE,
    "clearStatistics: sumTimeStores -> \n--- Unaggregated Data ---\n" +
    "localStore (Persistent):\n" + 
    JSON.stringify(localStore?.[currentISODate] || {}, null, 2) +
    "\ndbStore (TempCache):\n" + 
    JSON.stringify(dbStore?.[currentISODate] || {}, null, 2) +
    "\n--- Final Result ---\n" +
    JSON.stringify(totalActivities?.[currentISODate] || {}, null, 2)
  );

  // Store merged result in persistent localstore
  await chrome.storage.local.set({
    activity: totalActivities,
  });

  // Clear dbStore (temp)
  const db = await connect();
  await db.delete(TimeTrackerStoreTables.State,TimeTrackerStoreStateTableKeys.OverallState);

  Logger.debug(SOURCE,"clearStatistics: OverallState");
  // await db.clear(TimeTrackerStoreTables.State);
  //await db.clear(TimeTrackerStoreTables.Timeline);

};

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

  // Delete ActiveTab Key to prevent tracking issue when sync failed.
  await clearActiveTab();
};

const isInactive = (activity: TimelineRecord): boolean => {
  if (!activity || activity.activityPeriodEnd == null) {
    return false;
  }
  const TWO_MINUTES_MS = 2 * 60 * 1000;
  const nowUTC = DateTime.utc().toMillis();
  return nowUTC - activity.activityPeriodEnd > TWO_MINUTES_MS;
};

const clearActiveTab = async()=>{
  let activeTabLogStr = "== Checking activite-tab ==";
  const activeTimeline = new ActiveTimelineRecordDao();
  const currentTimelineRecord: TimelineRecord | null = await activeTimeline.get();

  if (currentTimelineRecord && isInactive(currentTimelineRecord)) {
    const db = await connect();
    await db.delete(TimeTrackerStoreTables.State,TimeTrackerStoreStateTableKeys.ActiveTab);
    activeTabLogStr ="Deleting activite-tab due to inactivity...";
  }

  Logger.debug(SOURCE,`clearActiveTab: ${activeTabLogStr}`,(currentTimelineRecord || {}));
}

// Mark timline records as synced instead of deleting them 
const markTimelineRecordsAsSynced = async (timeline: TimelineRecord[]): Promise<void> =>{
    const db = await connect();
    for(const record of timeline){
      if(record.id){
        const updateRecord = {...record,synced:true}
        await db.put(TimeTrackerStoreTables.Timeline, updateRecord);
      }
    }
}

const cleanupSyncedTimelineRecords = async (): Promise<void> =>{
  const db = await connect();
  const allRecords = await db.getAll(TimeTrackerStoreTables.Timeline) as TimelineRecord[];
  const oneMonthAgo = new Date();
  oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
  oneMonthAgo.setHours(0,0,0,0);
  const cutoffDate = getIsoDate(oneMonthAgo);

  const recordsToDelete  = allRecords.filter(record=>record.synced === true && record.date <= cutoffDate)
  if(recordsToDelete.length > 0 ){
    for(const record of recordsToDelete){
      Logger.debug(SOURCE,"cleanupSyncedTimelineRecords: old synced timeline records Cleaned up: "+ recordsToDelete.length,record)
      if(record.id){
        await db.delete(TimeTrackerStoreTables.Timeline, record?.id.toString())
      }
    }
    Logger.debug(SOURCE,"cleanupSyncedTimelineRecords: old synced timeline records Cleaned up: "+ recordsToDelete.length)
  }

}

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
  const result:boolean = await sendStats(userToken, records, states);

  if (result) {
    await Promise.all([
      emitSuccessSyncStats(preferences, callback),
      clearStatistics(),
      markTimelineRecordsAsSynced(timeline),
      cleanupSyncedTimelineRecords()
    ]);
  } else {
    await emitFailedSyncStats(preferences, callback);
  }
  
};

const sendWebActivityAutomatically = async (): Promise<void> => {
  const preferences: Preferences = await getSettings();
  if (preferences.connectionStatus !== ConnectionStatus.Connected) {
    Logger.warn(SOURCE, 'unable to send stats when not connected');
    await clearActiveTab()
    return;
  }

  const { timeline } = await fetchStatistics();

  await sendWebActivity(preferences, timeline, async (response) => {
    Logger.info(SOURCE, `sendWebActivityAutomatically`, response);
  });
};

export { sendWebActivityAutomatically };
