import {
  TokenProperties,
  WebActivityLog,
  WebActivityRecord,
} from '../db/types';
import {
  CodealikeHost,
  CurrentClientVersion,
  InvalidTokenError,
} from './constants';

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
): Promise<{ result: boolean }> => {
  return new Promise((resolve, reject) => {
    try {
      const { userId, uuid } = getTokenProperties(token);
      const url = `${CodealikeHost}/webactivity/SaveWebActivity`;

      fetch(url, {
        body: JSON.stringify({
          Extension: CurrentClientVersion,
          WebActivity: records,
          WebActivityLog: states,
        }),
        headers: getHeaders(userId, uuid),
        method: 'POST',
      })
        .then((result) => {
          if (result.status === 200) {
            resolve({ result: true });
          } else {
            reject();
          }
        })
        .catch((err) => {
          console.log(err);
          reject();
        });
    } catch (err) {
      console.log((err as Error).message);
      reject();
    }
  });
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
