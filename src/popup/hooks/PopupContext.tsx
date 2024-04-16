import { Preferences } from '../../shared/db/types';
import { DEFAULT_PREFERENCES } from '../../shared/preferences';
import { useActiveTabHostname } from './useActiveTab';
import { useSettings } from './useSettings';
import { TimeStore, useTimeStore } from './useTimeStore';
import * as React from 'react';

export type PopupContextType = {
  store: TimeStore;
  activeHostname: string;
  settings: Preferences;
  updateSettings: (updated: Partial<Preferences>) => void;
};

const DEFAULT_CONTEXT: PopupContextType = {
  activeHostname: '',
  settings: DEFAULT_PREFERENCES,
  store: {},
  updateSettings: () => 0,
};

export const PopupContext =
  React.createContext<PopupContextType>(DEFAULT_CONTEXT);

export const usePopupContext = () => React.useContext(PopupContext);

export const PopupContextProvider: React.FC = ({ children }) => {
  const store = useTimeStore();
  const host = useActiveTabHostname();
  const [settings, updateSettings] = useSettings();

  const filterDomainsFromStore = React.useCallback(
    (store: Record<string, number>) => {
      let filteredStore = Object.fromEntries(
        Object.entries(store).filter(
          ([key]) => !settings.ignoredHosts.includes(key),
        ),
      );

      // Handling whitelisting of hosts
      const allowedHosts = settings.allowedHosts ?? [];
      if (allowedHosts.length > 0) {
        filteredStore = Object.fromEntries(
          Object.entries(filteredStore).filter(
            ([key]) => allowedHosts.includes(key),
          ),
        );
      }

      return filteredStore;
    },
    [settings.ignoredHosts, settings.allowedHosts],
  );

  const filteredStore = React.useMemo(
    () =>
      Object.fromEntries(
        Object.entries(store).map(([day, value]) => [
          day,
          filterDomainsFromStore(value),
        ]),
      ),
    [store, filterDomainsFromStore],
  );

  return (
    <PopupContext.Provider
      value={{
        activeHostname: host || '',
        settings,
        store: filteredStore,
        updateSettings,
      }}
    >
      {children}
    </PopupContext.Provider>
  );
};
