import * as React from 'react';

import { TimeStore } from '../../hooks/useTimeStore';
import { get30DaysPriorDate, getIsoDate } from '../../../shared/utils/dates-helper';

import { TimeUsagePanel } from '../DailyTimeUsage/DailyTimeUsage';
import { WebsiteActivityTable } from '../WebsiteActivityTable/WebsiteActivityTable';
import { ActivityPageMonthlyActivityTabProps } from './types';
import { getTotalMonthlyActivity } from '../../selectors/get-total-monthly-activity';
import { MonthlyWebsiteActivityChart } from '../MonthlyWebsiteActivityChart/MonthlyWebsiteActivityChart';


export const ActivityPageMonthlyActivityTab: React.FC<ActivityPageMonthlyActivityTabProps> =
  ({ store, sundayDate }) => {
    const [pickedDomain, setPickedDomain] = React.useState<null | string>(null);
    const scrollToRef = React.useRef<HTMLDivElement | null>(null);

    const handleDomainRowClick = React.useCallback((domain: string) => {
      setPickedDomain(domain);
      scrollToRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, []);

    const allMonthlyActivity = React.useMemo(
      () =>
        get30DaysPriorDate(sundayDate).reduce((acc, date) => {
          const isoDate = getIsoDate(date);
          acc[isoDate] = store[isoDate] || {};

          return acc;
        }, {} as TimeStore),
      [store, sundayDate]
    );

    const filteredWebsiteMonthActivity = React.useMemo(() => {
      if (pickedDomain === null) {
        return allMonthlyActivity;
      }

      return Object.entries(allMonthlyActivity).reduce(
        (acc, [date, dateWebsitesUsage]) => {
          acc[date] = {
            [pickedDomain]: dateWebsitesUsage[pickedDomain] || 0,
          };

          return acc;
        },
        {} as typeof allMonthlyActivity
      );
    }, [allMonthlyActivity, pickedDomain]);

    const totalWebsiteMonthlyActivity = React.useMemo(
      () =>
        Object.values(allMonthlyActivity).reduce((acc, dailyUsage) => {
          Object.entries(dailyUsage).forEach(([key, value]) => {
            acc[key] ??= 0;
            acc[key] += value;
          });

          return acc;
        }, {} as Record<string, number>),
      [allMonthlyActivity]
    );

    const averageMonthlyActivity = React.useMemo(() => {
      const averageMonthly =
        getTotalMonthlyActivity(filteredWebsiteMonthActivity, sundayDate) / 7;
      return averageMonthly;
    }, [filteredWebsiteMonthActivity, sundayDate]);

    const presentedPickedDomain = pickedDomain ?? 'All Websites';

    return (
      <div>
        <TimeUsagePanel
          title="Average Daily Activity"
          time={averageMonthlyActivity}
        />
        <div ref={scrollToRef}>
          <MonthlyWebsiteActivityChart
            store={filteredWebsiteMonthActivity}
            sundayDate={sundayDate}
            presentChartTitle={() =>
              `Activity on ${presentedPickedDomain} per day`
            }
          />
        </div>
        <WebsiteActivityTable
          websiteTimeMap={totalWebsiteMonthlyActivity}
          title={'Websites This Month'}
          onDomainRowClicked={handleDomainRowClick}
        />
      </div>
    );
  };
