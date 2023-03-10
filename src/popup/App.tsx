import { Icon, IconType } from '../blocks/Icon';
import { Panel } from '../blocks/Panel';
import './App.css';
import { PopupContextProvider } from './hooks/PopupContext';
import { ActivityPage } from './pages/ActivityPage';
import { OverallPage } from './pages/OverallPage';
import { PreferencesPage } from './pages/PreferencesPage';
import * as React from 'react';
import { twMerge } from 'tailwind-merge';

enum Pages {
  Overview = 'time',
  Detailed = 'detailed',
  Preferences = 'preferences',
}

const PAGES_VALUES = Object.values(Pages);

export const PopupApp: React.FC = () => {
  const [activePage, setPage] = React.useState({
    params: {} as Record<string, any>,
    tab: Pages.Overview,
  });

  const handleNavigateToActivityDatePage = React.useCallback((date: string) => {
    setPage({
      params: {
        date,
      },
      tab: Pages.Detailed,
    });
  }, []);

  const renderedActiveTab = React.useMemo(() => {
    switch (activePage.tab) {
      case Pages.Overview:
        return (
          <OverallPage
            onNavigateToActivityPage={handleNavigateToActivityDatePage}
          />
        );
      case Pages.Detailed:
        return <ActivityPage date={activePage.params?.date} />;
      case Pages.Preferences:
        return <PreferencesPage />;

      default:
        return null;
    }
  }, [
    activePage.params?.date,
    activePage.tab,
    handleNavigateToActivityDatePage,
  ]);

  const tabs = React.useMemo(
    () =>
      PAGES_VALUES.map((tab) => {
        return (
          <div
            className={twMerge(
              'cursor-pointer flex-1 capitalize text-center rounded-xl p-2 text-lg font-light transition-colors duration-300',
              activePage.tab === tab &&
                'bg-neutral-300 text-neutral-800 dark:bg-neutral-900 dark:text-neutral-200',
              activePage.tab !== tab &&
                'hover:bg-neutral-100 text-neutral-400 dark:hover:bg-neutral-900 dark:text-neutral-400',
              tab === Pages.Preferences && 'max-w-[75px]',
            )}
            key={tab}
            onClick={() => setPage({ params: {}, tab })}
          >
            {tab === Pages.Preferences ? (
              <Icon type={IconType.Settings} className="m-0" />
            ) : (
              tab
            )}
          </div>
        );
      }),
    [activePage.tab],
  );

  return (
    <PopupContextProvider>
      <div className="flex flex-col p-2 pt-4 dark:bg-neutral-900">
        <div className="text-orange-500 p-2 border-none bg-slate-200 dark:bg-slate-800 tab-body-shadow dark:dark-tab-body-shadow">
          <img src="./icons/icon-16.png"></img>
          Codealike
        </div>
        <Panel className="flex gap-2 p-2 font-semibold">{tabs}</Panel>
        <Panel className="p-2 border-none bg-slate-200 dark:bg-slate-800 tab-body-shadow dark:dark-tab-body-shadow">
          {renderedActiveTab}
        </Panel>
      </div>
    </PopupContextProvider>
  );
};
