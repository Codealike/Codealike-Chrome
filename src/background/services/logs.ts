import { connect, TimeTrackerStoreTables } from '../../shared/db/idb';

const getIdsToDelete = async (cutOffDate: Date) => {
  console.log(`Cut Off Date: ${cutOffDate.getTime()}`);
  const db = await connect();
  const logs = await db.getAll(
    TimeTrackerStoreTables.Logs,
  );
  const idsToDelete: number[] = [];

  for (const log of logs) {
    const recordDate = new Date(log.timestamp).getTime();
    if (recordDate < cutOffDate.getTime()) {
      const id: number = log.id as number;
      // Should be deleted
      idsToDelete.push(id);
    }
  }

  return idsToDelete;
};

const deleteRecordsById = async (idsToDelete: number[]) => {
  try {

    const db = await connect();
    const transaction = db.transaction(
      TimeTrackerStoreTables.Logs,
      'readwrite',
    );
    const store = transaction.objectStore(TimeTrackerStoreTables.Logs);

    for (const id of idsToDelete) {
      // Using any as delete function expects string but we store id as number
      // this throws lint error
      const delId: any = id;
      await store.delete(delId);
    }

    await transaction.done;
    console.log('Logs deleted successfully.');
    return 'Logs deleted successfully.';
  } catch (error) {
    console.error('Error deleting IDB records:', error);
    return 'Failed to delete records.';
  }
};

const cleanUpLogIndexedDBTable = async (cutOff: number) => {
  console.log(`handling log table cleanup with cutoff of ${cutOff}`)
  if (process.env.NODE_ENV === 'production') {
    return;
  }

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - cutOff);

  const idsToDelete = await getIdsToDelete(cutoffDate);

  console.log(
    `Records to Delete: ${JSON.stringify(idsToDelete, null, 2)}`,
  );

  if (idsToDelete.length > 0) {
    return await deleteRecordsById(idsToDelete);
  }

  return `No logs data available for keeping beyond the ${cutOff} days period.`
};


export { cleanUpLogIndexedDBTable }
