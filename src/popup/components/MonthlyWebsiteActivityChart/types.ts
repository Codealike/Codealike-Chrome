import { TimeStore } from '../../hooks/useTimeStore';

export interface MonthlyWebsiteActivityChartProps {
  store: TimeStore;
  sundayDate: Date;
  presentChartTitle?: (weekName: string) => string;
}
