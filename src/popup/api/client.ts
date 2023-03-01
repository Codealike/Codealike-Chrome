import { TokenProperties } from '../../shared/db/types';
import { CodealikeHost, InvalidTokenError } from './constants';
import { AxiosRequestConfig } from 'axios';
import axios from 'axios';

export const getRequestConfig = (
  requestMethod: string,
  clientId: string,
  identity: string,
  token: string,
): AxiosRequestConfig => {
  return {
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Identity': identity,
      'X-Api-Token': token,
      'X-Eauth-Client': clientId,
    },
    method: requestMethod,
  };
};

export const authorize = (token: string): Promise<{ result: boolean }> => {
  return new Promise((resolve, reject) => {
    try {
      const { userId, uuid } = getTokenProperties(token);
      const url = `${CodealikeHost}/account/${userId}/authorized`;
      const config = getRequestConfig('GET', 'defaultClient', userId, uuid);

      axios(url, config)
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
