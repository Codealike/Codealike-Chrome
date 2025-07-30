import { TimeStore } from '../db/types';

export const mergeTimeStore = (
  storeA: TimeStore = {},
  storeB: TimeStore = {}
): TimeStore => {
  const storeAKeys = Object.keys(storeA ?? {});
  const storeBKeys = Object.keys(storeB ?? {});

  const allKeys = Array.from(new Set([...storeAKeys, ...storeBKeys]));

  return allKeys.reduce((acc, key) => {
    const storeAValue = storeA[key];
    const storeBValue = storeB[key];

    acc[key] = {
      ...storeAValue,
      ...storeBValue,
      ...Object.keys({ ...storeAValue, ...storeBValue }).reduce((nestedAcc, innerKey) => {
        const storeAValueForKey = storeAValue?.[innerKey] || storeBValue?.[innerKey] || 0;
        const storeBValueForKey = storeBValue?.[innerKey] || storeAValue?.[innerKey] || 0;

        nestedAcc[innerKey] = Math.max(storeAValueForKey, storeBValueForKey);

        return nestedAcc;
      }, {} as Record<string, number>),
    };

    return acc;
  }, {} as TimeStore);
};

function getAllKeys<T>(objA: T, objB: T): string[] {
  const keysA = Object.keys(objA ?? {});
  const keysB = Object.keys(objB ?? {});
  return Array.from(new Set([...keysA, ...keysB]));
}

function sumSubKeys(
  subA: Record<string, number> = {},
  subB: Record<string, number> = {}
): Record<string, number> {
  const allSubKeys = getAllKeys(subA, subB);
  const subResult: Record<string, number> = {};

  for (const subKey of allSubKeys) {
    const aVal = Number(subA[subKey]) || 0;
    const bVal = Number(subB[subKey]) || 0;
    const sum = aVal + bVal;
    subResult[subKey] = Number.isFinite(sum) ? sum : 0;
  }

  return subResult;
}

export function sumTimeStores(
  storeA: TimeStore = {},
  storeB: TimeStore = {}
): TimeStore {
  const allKeys = getAllKeys(storeA, storeB);
  const result: TimeStore = {};

  for (const key of allKeys) {
    const subResult = sumSubKeys(storeA[key] ?? {}, storeB[key] ?? {});
    if (Object.keys(subResult).length > 0) {
      result[key] = subResult;
    }
  }

  return result;
}