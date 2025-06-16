import { connect, TimeTrackerStoreTables } from '../../shared/db/idb';
import { LogMessage } from '../../shared/db/types';

export async function logMessage(message: string) {
  if (process.env.NODE_ENV === 'production') {
    return;
  }
  const db = await connect();
  await db.add(TimeTrackerStoreTables.Logs, { message, timestamp: Date.now() });
}

export async function getLogs(): Promise<LogMessage[] | []> {
  if (process.env.NODE_ENV === 'production') {
    return [];
  }

  const db = await connect();
  return await db.getAll(TimeTrackerStoreTables.Logs);
}