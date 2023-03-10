import { Icon, IconType } from '../../../blocks/Icon';
import { Panel, PanelHeader } from '../../../blocks/Panel';
import {
  get7DaysPriorDate,
  getHoursInMs,
  getIsoDate,
  getTimeFromMs,
  getTimeWithoutSeconds,
} from '../../../shared/utils/dates-helper';
import { useIsDarkMode } from '../../hooks/useTheme';
import { getTotalDailyActivity } from '../../selectors/get-total-daily-activity';
import { WeeklyWebsiteActivityChartProps } from './types';
import * as React from 'react';
import { Bar } from 'react-chartjs-2';

const HOUR_IN_MS = getHoursInMs(1);

const BAR_OPTIONS = {
  plugins: {
    legend: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: (item: any) => {
          return (
            ' ' + getTimeFromMs(Number(item.formattedValue || 0) * HOUR_IN_MS)
          );
        },
        title: ([item]: any) => {
          return `${item?.label}`;
        },
      },
    },
  },
  responsive: true,
  scales: {
    x: {
      ticks: {
        color: '#222',
      },
    },
    y: {
      ticks: {
        callback: (value: number) => {
          return getTimeWithoutSeconds(value * HOUR_IN_MS);
        },
        color: '#222',
      },
    },
  },
};

const DARK_MODE_BAR_OPTIONS = {
  ...BAR_OPTIONS,
  scales: {
    ...BAR_OPTIONS.scales,
    x: {
      ...BAR_OPTIONS.scales.x,
      grid: {
        color: '#444444',
      },
      ticks: {
        ...BAR_OPTIONS.scales.x.ticks,
        color: '#e5e5e5',
      },
    },
    y: {
      ...BAR_OPTIONS.scales.y,
      grid: {
        color: '#444444',
      },
      ticks: {
        ...BAR_OPTIONS.scales.y.ticks,
        color: '#e5e5e5',
      },
    },
  },
};

export const WeeklyWebsiteActivityChart: React.FC<
  WeeklyWebsiteActivityChartProps
> = ({ store, sundayDate, presentChartTitle }) => {
  const isDarkMode = useIsDarkMode();

  const [labels, data] = React.useMemo(() => {
    const week = get7DaysPriorDate(sundayDate).reverse();
    const labels = week.map((date) => getIsoDate(date));
    const data = week.map(
      (date) => getTotalDailyActivity(store, date) / HOUR_IN_MS,
    );

    return [labels, data];
  }, [store, sundayDate]);

  const weekName = React.useMemo(
    () => `${labels[0]} - ${labels[labels.length - 1]}`,
    [labels],
  );

  const chartData = React.useMemo(
    () => ({
      datasets: [
        {
          backgroundColor: '#4b76e3',
          borderRadius: 12,
          borderSkipped: false,
          data: data,
          label: 'Weekly activity',
        },
      ],
      labels: labels,
    }),
    [labels, data],
  );

  return (
    <Panel>
      <PanelHeader>
        <Icon type={IconType.ChartHistogram} />
        {presentChartTitle?.(weekName) ?? weekName}
      </PanelHeader>
      <Bar
        options={isDarkMode ? DARK_MODE_BAR_OPTIONS : BAR_OPTIONS}
        data={chartData}
      />
    </Panel>
  );
};
