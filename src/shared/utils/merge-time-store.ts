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

export const sumTimeStores = (
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
        const storeAValueForKey = storeAValue?.[innerKey] || 0;
        const storeBValueForKey = storeBValue?.[innerKey] || 0;

        nestedAcc[innerKey] = storeAValueForKey + storeBValueForKey;

        return nestedAcc;
      }, {} as Record<string, number>),
    };

    return acc;
  }, {} as TimeStore);
};