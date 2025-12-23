import { get30DaysPriorDate } from '../../shared/utils/dates-helper';

import { TimeStore } from '../hooks/useTimeStore';

import { getTotalDailyActivity } from './get-total-daily-activity';

export const getTotalMonthlyActivity = (store: TimeStore, date = new Date()) =>
  get30DaysPriorDate(date).reduce((sum, date) => {
    return sum + getTotalDailyActivity(store, date);
  }, 0);
