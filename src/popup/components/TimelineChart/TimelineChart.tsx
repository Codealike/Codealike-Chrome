import { useIsDarkMode } from '../../hooks/useTheme';
import {
  getChartTimeLabels,
  joinNeighborTimelineEvents,
  transformTimelineDataset,
} from './helpers';
import { TimelineChartProps } from './types';
import * as React from 'react';
import { Bar } from 'react-chartjs-2';

const OPTIONS = {
  plugins: {
    legend: {
      display: false,
    },
    title: {
      display: false,
    },
    tooltip: {
      callbacks: {
        label: () => void 0,
        title: (items: any[]) => {
          const totalActivityThisHour = items.reduce((acc, item) => {
            const { raw } = item;
            const [startMin = 0, endMin = 0] = raw;
            return acc + (endMin - startMin);
          }, 0);
          return `${totalActivityThisHour}m surfed between ${items[0].label}`;
        },
      },
      display: false,
    },
  },
  responsive: true,
  scales: {
    x: {
      stacked: true,
      ticks: {
        color: '#222222',
      },
    },
    y: {
      max: 60,
      min: 0,
      ticks: {
        callback: (value: number) => {
          return `:${value.toString().padStart(2, '0')}`;
        },
        color: '#222222',
      },
    },
  },
};

const DARK_OPTIONS = {
  ...OPTIONS,
  scales: {
    ...OPTIONS.scales,
    x: {
      ...OPTIONS.scales.x,
      grid: {
        color: '#444444',
      },
      ticks: {
        ...OPTIONS.scales.x.ticks,
        color: '#e5e5e5',
      },
    },
    y: {
      ...OPTIONS.scales.y,
      grid: {
        color: '#444444',
      },
      ticks: {
        ...OPTIONS.scales.y.ticks,
        color: '#e5e5e5',
      },
    },
  },
};

export const TimelineChart: React.FC<TimelineChartProps> = ({
  timelineEvents = [],
  emptyHoursMarginCount = 2,
}) => {
  const isDarkMode = useIsDarkMode();
  const joinedEvents = joinNeighborTimelineEvents(timelineEvents);
  const { chartDatasetData, timelineStartHour, timelineEndHour } =
    transformTimelineDataset(joinedEvents);
  const chartStartHour = Math.max(0, timelineStartHour - emptyHoursMarginCount);
  const chartEndHour = Math.min(23, timelineEndHour + emptyHoursMarginCount);

  const datasets = chartDatasetData.map((d, i) => ({
    backgroundColor: '#4b76e3',
    borderRadius: 8,
    borderSkipped: false,
    data: d.slice(chartStartHour, chartEndHour + 1),
    label: 'dataset ' + i,
  }));

  const chartData = {
    datasets,
    labels: getChartTimeLabels(chartStartHour, chartEndHour),
  };

  return <Bar options={isDarkMode ? DARK_OPTIONS : OPTIONS} data={chartData} />;
};
