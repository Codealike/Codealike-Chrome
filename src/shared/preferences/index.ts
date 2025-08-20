import { ConnectionStatus, Preferences } from '../db/types';

export const DEFAULT_PREFERENCES: Preferences = {
  allowedHosts: [], //whitelisted domains
  connectionStatus: ConnectionStatus.Disconnected,
  displayTimeOnBadge: true,
  enableLogging: false,
  ignoredHosts: [],
  limits: {},
};

export const setSettings = async (settings: Partial<Preferences>) => {
  const currentSettings = await getSettings();
  await chrome.storage.local.set({
    settings: { ...currentSettings, ...settings },
  });
};

export const getSettings = async () => {

      if(!(chrome && chrome?.storage && chrome?.storage.local)){
        console.log("chrome object not existing");
        return {...DEFAULT_PREFERENCES};
      }

      const { settings = {} } = await chrome.storage.local.get('settings');
      return {
        ...DEFAULT_PREFERENCES,
        ...settings,
      } as Preferences;
};
