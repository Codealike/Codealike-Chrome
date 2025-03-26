import { TimeStore } from '../../hooks/useTimeStore';

export interface WeeklyWebsiteActivityChartProps {
  store: TimeStore;
  sundayDate: Date;
  presentChartTitle?: (weekName: string) => string;
}

export interface BarItemType {
  formattedValue: string | number;
}

export interface BarItemTitleType {
  label: number |string | undefined;
}