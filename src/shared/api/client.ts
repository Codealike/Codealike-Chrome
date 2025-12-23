import {
  ProfileResponse,
  TokenProperties,
  WebActivityLog,
  WebActivityRecord,
} from '../db/types';

import {
  CodealikeHost,
  CurrentClientVersion,
  InvalidTokenError,
} from './constants';

import { Logger } from '../utils/logger';

const SOURCE = 'SHARED/API/CLIENT';

const getHeaders = (userId: string, uuid: string): Record<string, string> => {
  return {
    'Content-Type': 'application/json;charset=utf-8',
    'X-Api-Identity': userId,
    'X-Api-Token': uuid,
    'X-Eauth-Client': 'Codealike Chrome Plugin',
  };
};

export const sendStats = async (
  token: string,
  records: WebActivityRecord[],
  states: WebActivityLog[],
): Promise<boolean> => {
  try {
    const { userId, uuid } = getTokenProperties(token);
    const url = `${CodealikeHost}/webactivity/SaveWebActivity`;

    const response = await fetch(url, {
      body: JSON.stringify({
        Extension: CurrentClientVersion,
        WebActivity: records,
        WebActivityLog: states,
      }),
      headers: getHeaders(userId, uuid),
      method: 'POST',
    });

    if (response.status === 200) {
      return true;
    } else {
      throw new Error(`Request failed with status ${response.status}`);
    }
  } catch (err) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    Logger.error(SOURCE,`sendStats:`, errorObj)
    return false;
  }
};

export const authorize = (token: string): Promise<{ result: boolean }> => {
  return new Promise((resolve, reject) => {
    try {
      const { userId, uuid } = getTokenProperties(token);
      const url = `${CodealikeHost}/account/${userId}/authorized`;

      fetch(url, {
        headers: getHeaders(userId, uuid),
        method: 'GET',
      })
        .then((result) => {
          if (result.status === 200) {
            resolve({ result: true });
          } else {
            reject();
          }
        })
        .catch(() => {
          reject();
        });
    } catch (err) {
      console.log((err as Error).message);
      reject();
    }
  });
};

export const getProfile = (token: string): Promise<ProfileResponse> => {
  return new Promise((resolve, reject) => {
    const { userId, uuid } = getTokenProperties(token);
    const url = `${CodealikeHost}/account/${userId}/profile`;
    console.log(`url: ${url}`)

    fetch(url, {
      headers: getHeaders(userId, uuid),
      method: 'GET',
    })
      .then((result) => {
        if (result.status === 200) {
          return result.json()
        } else {
          reject();
        }
      })
      .then((response) => {
        console.log('Response body:', response);
        resolve(response);
      })
      .catch((err) => {
        console.log((err as Error).message);
        reject();
      });
  });
};

const getTokenProperties = (token: string): TokenProperties => {
  if (token === undefined) {
    throw new Error(InvalidTokenError);
  }
  const properties = token.split('/');
  if (properties.length != 2) {
    throw new Error(InvalidTokenError);
  }
  return {
    userId: properties[0] as string,
    uuid: properties[1] as string,
  };
};
