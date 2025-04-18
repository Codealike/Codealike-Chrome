import { cleanUpLogIndexedDBTable } from '../../background/services/logs';

export const handleLogTableCleanUp = async (days: number) => {
  return await cleanUpLogIndexedDBTable(days);
};
