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
  id?: number ;
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
  id?: number;
}

export interface Preferences {
  connectionStatus: ConnectionStatus;
  userToken?: string;
  ignoredHosts: string[];   //urls that are be blacklisted
  allowedHosts?: string[]; //urls that are to be whitelisted
  limits: Record<string, number>;
  displayTimeOnBadge: boolean;
  enableLogging: boolean;
  lastUpdateStats?: Statistics;
  username?: string
}

export interface Statistics {
  Status: 'OK' | 'NOK';
  Datetime: string;
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

export interface ProfileResponse {
  Identity: string
  FullName: string
  DisplayName: string
  Address?: string
  State?: string
  Country?: string
  AvatarUri: string
  Email: string
}

export interface RecordWithKey<T> {
  key: IDBValidKey;
  value: T;
}

export interface LogEntry {
    timestamp: string;
    level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG';
    source: string;
    message: string;
    context ? : object | undefined;
}

