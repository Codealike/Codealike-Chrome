import { sendStats } from '../../shared/api/client';
import { connect, /*disconnect,*/ TimeTrackerStoreTables,TimeTrackerStoreStateTableKeys } from '../../shared/db/idb';
import {
  ConnectionStatus,
  Preferences,
  TimelineRecord,
  TimeStore,
  WebActivityLog,
  WebActivityRecord,
} from '../../shared/db/types';
import { getSettings, setSettings } from '../../shared/preferences';
import { DateTime } from 'luxon';
import {getLocalActivity,getDbCache} from '../../shared/db/sync-storage'
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

const setDbCacheTimeStore = async (store: TimeStore) => {
  const db = await connect();
  await db.put(
    TimeTrackerStoreTables.State,
    store,
    TimeTrackerStoreStateTableKeys.OverallState,
  );
};

const clearStatistics = async (): Promise<void> => {
    const oldDBcacheStore = await getDbCache();
    const localStore:TimeStore = await getLocalActivity();
    // const localvalue:any = localStore["2025-07-11"];
    // const cacheOldvalue:any = oldDBcacheStore["2025-07-11"]
    // const updatedval:TimeStore =  {
    // "2025-07-11": {
    //         "chatgpt.com": localvalue["chatgpt.com"] + cacheOldvalue["chatgpt.com"],
    //     }
    // }
    const totalTimeStores = sumTimeStores(oldDBcacheStore,localStore);
    await setDbCacheTimeStore(totalTimeStores);
    
    console.log("Harman : BeforeclearStatistics: oldDBcacheStore",oldDBcacheStore)
    console.log("Harman : BeforeclearStatistics: localStore",localStore)
    
    //await disconnect(); // Ensure any existing connection is closed first
    const db = await connect();
    // const totalActivity = await getTotalActivity();
    // console.log("totalActivity merged",totalActivity);
    setTimeout(async()=>{await db.clear(TimeTrackerStoreTables.Timeline);},200)
    
    // await db.clear(TimeTrackerStoreTables.State);

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
      Status: 'OK',
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
  catch(err) {
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
    Logger.info(SOURCE, `sendWebActivityAutomatically`,response);
  });
};

export { sendWebActivityAutomatically };
