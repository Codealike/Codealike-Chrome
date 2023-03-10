import { getTabInfo } from './background/browser-api/tabs';
import { handleStateChange } from './background/controller';
import {
  handleActiveTabStateChange,
  handleAlarm,
  handleIdleStateChange,
  handleTabUpdate,
  handleWindowFocusChange,
} from './background/services/state-service';
import { sendWebActivityAutomatically } from './background/services/stats';
import { logMessage } from './background/tables/logs';
import { Tab } from './shared/browser-api.types';
import { WAKE_UP_BACKGROUND } from './shared/messages';

interface Service {
  name: string;
  intervalInMinutes: number;
  handler: () => Promise<void>;
}

const ASYNC_POLL_ALARM_NAME = 'async-poll';
const ASYNC_POLL_INTERVAL_MINUTES = 1;

const ASYNC_STATS_INTERVAL_ALARM_NAME = 'send-stats';
const ASYNC_STATS_INTERVAL_MINUTES = 1;

const asyncPollAlarmHandler = async (): Promise<void> => {
  const ts = Date.now();
  const newState = await handleAlarm();
  await handleStateChange(newState, ts);
};

const sendStatsAlarmHandler = async (): Promise<void> =>
  sendWebActivityAutomatically();

const ChromeServiceDefinition: Array<Service> = [
  {
    handler: asyncPollAlarmHandler,
    intervalInMinutes: ASYNC_POLL_INTERVAL_MINUTES,
    name: ASYNC_POLL_ALARM_NAME,
  },
  {
    handler: sendStatsAlarmHandler,
    intervalInMinutes: ASYNC_STATS_INTERVAL_MINUTES,
    name: ASYNC_STATS_INTERVAL_ALARM_NAME,
  },
];

ChromeServiceDefinition.forEach((service) => {
  chrome.alarms.create(service.name, {
    periodInMinutes: service.intervalInMinutes,
  });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  const { name } = alarm;
  await logMessage(name);
  for (let i = 0; i < ChromeServiceDefinition.length; i++) {
    const alarm: Service = ChromeServiceDefinition[i] as Service;
    if (alarm.name === name) {
      await alarm.handler();
    }
  }
});

chrome.tabs.onActivated.addListener(async (activeInfo) => {
  const ts = Date.now();
  await logMessage('tab activated: ' + activeInfo.tabId);

  const newState = await handleActiveTabStateChange(activeInfo);
  if (newState) {
    await handleStateChange(newState, ts).catch((e) => {
      logMessage('error handling tab activated: ' + e);
    });
  }
});

chrome.tabs.onUpdated.addListener(async (_tabId, _changeInfo, tab) => {
  const ts = Date.now();
  await logMessage('tab updated: ' + tab.id);

  const newState = await handleTabUpdate(tab as Tab);
  if (newState) {
    await handleStateChange(newState, ts).catch((e) => {
      logMessage('error handling tab activated: ' + e);
    });
  }
});

// onFocusChanged does not work in Windows 7/8/10 when user alt-tabs or clicks away
chrome.windows.onFocusChanged.addListener(async (windowId) => {
  const ts = Date.now();
  await logMessage('window focus changed: ' + windowId);

  const newState = await handleWindowFocusChange(windowId);
  if (newState) {
    await handleStateChange(newState, ts);
  }
});

chrome.idle.onStateChanged.addListener(async (newIdleState) => {
  await logMessage('idle state changed: ' + newIdleState);
  const ts = Date.now();

  const newTabState = await handleIdleStateChange(newIdleState);

  await handleStateChange(newTabState, ts);
});

chrome.webNavigation.onCompleted.addListener(async (details) => {
  await logMessage('web navigation: ' + details.tabId);
  const ts = Date.now();

  const tab = await getTabInfo(details.tabId);
  if (!tab) {
    return;
  }

  const newState = await handleTabUpdate(tab);
  if (!newState) {
    return;
  }

  await handleStateChange(newState, ts);
});

chrome.runtime.onMessage.addListener((message, _sender, sendMessage) => {
  if (message.type === WAKE_UP_BACKGROUND) {
    sendMessage({ alive: true });

    const ts = Date.now();
    handleAlarm().then(async (newState) => {
      await handleStateChange(newState, ts);
    });
  }
});

// This is a background script for a Google Chrome extension. It creates an alarm
// that runs a function at a regular interval, listens for events such as tab
// activation, tab updates, window focus changes, and idle state changes, and
// performs actions based on these events. It also listens for a custom message
// to wake up the background script and perform some actions. The script uses
// functions from various modules and types defined in other files.
