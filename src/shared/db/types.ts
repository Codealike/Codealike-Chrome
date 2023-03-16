import { IdleState, Tab } from '../browser-api.types';
import { DateTime } from 'luxon';

export type TimeStore = Record<string, Record<string, number>>;

export interface WebActivityLog {
  Duration: number;
  Status: string;
  From: DateTime;
}

export interface WebActivityRecord {
  Duration: number;
  FavIconUrl?: string;
  From: DateTime;
  Secure: boolean;
  Status?: string;
  Title: string;
  Url: string;
}

export type TimelineRecordStatus = 'navigation' | 'debugging' | 'debugger';

export interface TimelineRecord {
  tabId: number;
  url: string;
  hostname: string;
  docTitle: string;
  favIconUrl: string | undefined;
  date: string;
  status: TimelineRecordStatus;
  secure: boolean;
  activityPeriodStart: number;
  activityPeriodEnd: number;
}

export type ActiveTabState = {
  activeTabs: Tab[];
  focusedActiveTab?: Tab | null;
  focusedWindowId?: number;
  idleState?: IdleState;
};

export interface DebugTab {
  tabId?: number;
  title?: string;
  url?: string;
  windowId: number;
}

export interface LogMessage {
  message: string;
  timestamp: number;
}

export interface Preferences {
  connectionStatus: ConnectionStatus;
  userToken?: string;
  ignoredHosts: string[];
  limits: Record<string, number>;
  displayTimeOnBadge: boolean;
  lastUpdateStats?: Statistics;
}

export interface Statistics {
  Status: 'OK' | 'NOK';
  Datetime: DateTime;
}

export enum ConnectionStatus {
  'Connecting',
  'Connected',
  'Disconnected',
}

export interface TokenProperties {
  userId: string;
  uuid: string;
}
