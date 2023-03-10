import { DBSchema, openDB } from 'idb';

import { ActiveTabState, LogMessage, TimeStore, TimelineRecord } from './types';

export enum Database {
  TimeTrackerStore = 'btt-store',
}

export enum TimeTrackerStoreTables {
  Timeline = 'timeline',
  State = 'state',
  Logs = 'logs',
}

export enum TimeTrackerStoreStateTableKeys {
  ActiveTab = 'active-tab',
  AppState = 'app-state',
  OverallState = 'overall-state',
}

export const DB_VERSION = 2;

export interface TimelineDatabase extends DBSchema {
  [TimeTrackerStoreTables.Timeline]: {
    value: TimelineRecord;
    key: string;
    indexes: {
      date: string;
      hostname: string;
      recordId: number;
    };
  };
  [TimeTrackerStoreTables.Logs]: {
    value: LogMessage;
    key: string;
  };
  [TimeTrackerStoreTables.State]: {
    value: ActiveTabState | TimelineRecord | TimeStore | null;
    key: string;
  };
}

export const connect = () =>
  openDB<TimelineDatabase>(Database.TimeTrackerStore, DB_VERSION, {
    upgrade(db, oldVersion, newVersion, transaction) {
      if (oldVersion < 1) {
        const tabsStateStore = db.createObjectStore(
          TimeTrackerStoreTables.State
        );
        tabsStateStore.put(null, TimeTrackerStoreStateTableKeys.ActiveTab);
        tabsStateStore.put(
          {
            activeTabs: [],
            focusedActiveTab: null,
            focusedWindowId: undefined,
            idleState: undefined,
          },
          TimeTrackerStoreStateTableKeys.AppState
        );

        const timelineStore = db.createObjectStore(
          TimeTrackerStoreTables.Timeline,
          {
            
            // If it isn't explicitly set, create a value by auto incrementing.
autoIncrement: true,
            
            // The 'id' property of the object will be the key.
keyPath: 'id',
          }
        );

        timelineStore.createIndex('date', 'date', { unique: false });
        timelineStore.createIndex('hostname', 'hostname', { unique: false });

        db.createObjectStore(TimeTrackerStoreTables.Logs, {
          autoIncrement: true,
          keyPath: 'id',
        });
      }

      // Activity period start is a unique id for each record if there is a race condition
      if (oldVersion < 2) {
        const timeline = transaction.objectStore(
          TimeTrackerStoreTables.Timeline
        );

        timeline.createIndex('recordId', 'activityPeriodStart', {
          unique: true,
        });
      }
    },
  });
