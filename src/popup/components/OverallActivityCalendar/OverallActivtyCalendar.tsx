import * as React from 'react';

import { Icon, IconType } from '../../../blocks/Icon';
import { Panel, PanelBody, PanelHeader } from '../../../blocks/Panel';
import { getTimeWithoutSeconds } from '../../../shared/utils/dates-helper';

import { GithubCalendarWrapper } from '../GithubCalendarWrapper/GithubCalendarWrapper';

import {
  convertCombinedDailyActivityToCalendarActivity,
  getCombinedTotalDailyActivity,
} from './helpers';
import { OverallActivityCalendarProps } from './types';

export const OverallActivityCalendarPanel: React.FC<OverallActivityCalendarProps> =
  ({ store, navigateToDateActivityPage }) => {
    const totalDailyActivity = getCombinedTotalDailyActivity(store);
    const calendarActivity =
      convertCombinedDailyActivityToCalendarActivity(totalDailyActivity);

    const getTooltipForDateButton = React.useCallback(
      (isoDate) => {
        const time = totalDailyActivity[isoDate];
        if (time !== undefined) {
          return `${isoDate} ${getTimeWithoutSeconds(time)}`;
        }

        return isoDate;
      },
      [totalDailyActivity]
    );

    return (
      <Panel>
        <PanelHeader>
          <Icon type={IconType.CalendarClock} />
          Overall Activity
        </PanelHeader>
        <PanelBody className="min-h-[115px]">
          <GithubCalendarWrapper
            activity={calendarActivity}
            onDateClick={navigateToDateActivityPage}
            getTooltip={getTooltipForDateButton}
          />
        </PanelBody>
      </Panel>
    );
  };
