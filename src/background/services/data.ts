import { connect, TimeTrackerStoreTables } from '../../shared/db/idb';
import { logMessage } from '../tables/logs';

const getIdsToDelete = async (cutOffDate: Date) => {
  await logMessage(`Cut Off Date: ${cutOffDate.getTime()}`);
  const db = await connect();
  const timeline = await db.getAll(
    TimeTrackerStoreTables.Timeline,
  );
  const idsToDelete: number[] = [];

  for (const data of timeline) {
    const recordDate = new Date(data.date).getTime();
    if (recordDate < cutOffDate.getTime()) {
      const id: number = data.id as number;
      // Should be deleted
      idsToDelete.push(id);
    }
  }

  return idsToDelete;
};

const deleteRecordsById = async (idsToDelete: number[]): Promise<string> => {
  try {
    
    const db = await connect();
    const transaction = db.transaction(
      TimeTrackerStoreTables.Timeline,
      'readwrite',
    );
    const store = transaction.objectStore(TimeTrackerStoreTables.Timeline);

    for (const id of idsToDelete) {
      // Using any as delete function expects string but we store id as number
      // this throws lint error
      const delId: any = id;
      await store.delete(delId);
    }

    await transaction.done;
    await logMessage('Records deleted successfully.');
    return 'Records deleted successfully.';
  } catch (error) {
    console.error('Error deleting IDB records:', error);
    return 'Failed to delete records.';
  }
};

const manageLocalStoreSpace = async (
  defaultCutOff: number,
): Promise<string> => {
  await logMessage(`Handling Old Data Cleanup`);
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - defaultCutOff);
  const idsToDelete = await getIdsToDelete(cutoffDate);

  await logMessage(
    `Records to Delete: ${JSON.stringify(idsToDelete, null, 2)}`,
  );

  if (idsToDelete.length > 0) {
    return await deleteRecordsById(idsToDelete);
  }

  return 'No data available for deletion beyond the 60 days timeframe.'
};

export { manageLocalStoreSpace };
