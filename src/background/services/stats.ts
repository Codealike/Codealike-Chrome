import { sendStats } from '../../shared/api/client';
import { connect, TimeTrackerStoreTables } from '../../shared/db/idb';
import {
  ConnectionStatus,
  Preferences,
  TimelineRecord,
  WebActivityLog,
  WebActivityRecord,
} from '../../shared/db/types';
import { getSettings, setSettings } from '../../shared/preferences';
import { logMessage } from '../tables/logs';
import { DateTime } from 'luxon';

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
  const db = await connect();
  await db.clear(TimeTrackerStoreTables.Timeline);
};

const emitSuccessSyncStats = async (
  preferences: Preferences,
  callback: (input: { result: string }) => Promise<void>,
): Promise<void> => {
  await callback({
    result: 'ok',
  });
  const lastUpdateDateTime = preferences.lastUpdateStats?.Datetime;
  await chrome.action.setTitle({
    title:
      "Codealike time tracker. You're authenticated to Codealike. Last bundle of stats sent " +
        lastUpdateDateTime ?? DateTime.now() + '.',
  });
  await chrome.action.setBadgeText({
    text: '',
  });
  await setSettings({
    lastUpdateStats: {
      Datetime: DateTime.fromJSDate(new Date()),
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
  const lastUpdateDateTime = preferences.lastUpdateStats?.Datetime;
  await chrome.action.setTitle({
    title:
      'Codealike time tracker. An error happened trying to send Web Activity ' +
        lastUpdateDateTime ?? DateTime.now() + '.',
  });
  await chrome.action.setBadgeText({
    text: '',
  });
  await setSettings({
    lastUpdateStats: {
      Datetime: DateTime.fromJSDate(new Date()),
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
  const result = await sendStats(userToken, records, states);

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
    await logMessage('unable to send stats when not connected');
    return;
  }

  const { timeline } = await fetchStatistics();

  await sendWebActivity(preferences, timeline, async (response) => {
    await logMessage(JSON.stringify(response));
  });
};

export { sendWebActivityAutomatically };
