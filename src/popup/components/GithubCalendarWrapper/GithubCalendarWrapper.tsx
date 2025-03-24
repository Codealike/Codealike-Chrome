import * as React from 'react';
import Calendar from 'react-github-contribution-calendar';
import ReactTooltip from 'react-tooltip';
import { debounce } from 'throttle-debounce';

import { getIsoDate } from '../../../shared/utils/dates-helper';

import { GithubCalendarProps } from './types';
import { getAppTheme } from '../../hooks/useTheme';

let INACTIVE_DAY_COLOR = '#444444';
let LOW_ACTIVITY_DAY_COLOR = '#114A74';
let MEDIUM_ACTIVITY_DAY_COLOR = '#0073C1';
let HIGH_ACTIVITY_DAY_COLOR = '#5BC0FB';
let COLORS = [
  INACTIVE_DAY_COLOR,
  LOW_ACTIVITY_DAY_COLOR,
  MEDIUM_ACTIVITY_DAY_COLOR,
  HIGH_ACTIVITY_DAY_COLOR,
];

const BUTTON_DATE_ATTRIBUTE = 'data-date';
const REACT_TOOLTIP_ID = 'activity-calendar';
const REACT_TOOLTIP_SHOW_DELAY_MS = 100;

const getDefaultTooltip = (date: string) => date;

const debouncedSetCalendarTooltips = debounce(
  200,
  (
    calendarContainer: HTMLDivElement,
    getTooltip: Required<GithubCalendarProps>['getTooltip']
  ) => {
    const elements = calendarContainer.querySelectorAll('rect');

    const elementDate = new Date();
    Array.from(elements)
      .reverse()
      .forEach((el, index) => {
        elementDate.setDate(elementDate.getDate() - Math.min(1, index));

        const elementIsoDate = getIsoDate(elementDate);

        el.setAttribute(BUTTON_DATE_ATTRIBUTE, elementIsoDate);
        el.setAttribute('data-tip', getTooltip(elementIsoDate));
        el.setAttribute('data-for', REACT_TOOLTIP_ID);
      });

    ReactTooltip.rebuild();
  }
);

export const GithubCalendarWrapper: React.FC<GithubCalendarProps> = ({
  activity,
  onDateClick,
  getTooltip = getDefaultTooltip,
}) => {
  const calendarRef = React.useRef<HTMLDivElement>(null);

  const theme = getAppTheme();

  if (theme === 'light') {
    INACTIVE_DAY_COLOR = '#F0F0F0';
    LOW_ACTIVITY_DAY_COLOR = '#FFE0B2';
    MEDIUM_ACTIVITY_DAY_COLOR = '#FFB74D';
    HIGH_ACTIVITY_DAY_COLOR = '#FFA744';

    COLORS = [
      INACTIVE_DAY_COLOR,
      LOW_ACTIVITY_DAY_COLOR,
      MEDIUM_ACTIVITY_DAY_COLOR,
      HIGH_ACTIVITY_DAY_COLOR,
    ]
  }

  if (theme === 'dark') {
    INACTIVE_DAY_COLOR = '#2C2C2C';
    LOW_ACTIVITY_DAY_COLOR = '#5C3B1A';
    MEDIUM_ACTIVITY_DAY_COLOR = '#AB6C33';
    HIGH_ACTIVITY_DAY_COLOR = '#FFA744';

    COLORS = [
      INACTIVE_DAY_COLOR,
      LOW_ACTIVITY_DAY_COLOR,
      MEDIUM_ACTIVITY_DAY_COLOR,
      HIGH_ACTIVITY_DAY_COLOR,
    ]
  }

  React.useEffect(() => {
    if (!calendarRef.current) {
      return;
    }

    debouncedSetCalendarTooltips(calendarRef.current, getTooltip);
  }, [getTooltip]);

  const handleDateClick = React.useCallback(
    (el) => {
      const target = el.target as HTMLElement;
      if (target.nodeName !== 'rect') {
        return;
      }

      onDateClick(
        target.getAttribute(BUTTON_DATE_ATTRIBUTE) || getIsoDate(new Date())
      );
    },
    [onDateClick]
  );

  return (
    <div className="calendar" ref={calendarRef} onClick={handleDateClick}>
      {/* @ts-expect-error -- expected, this element does have props */}
      <Calendar values={activity} panelColors={COLORS} />
      <div className="flex items-center justify-end gap-1">
        <span className="text-gray-400">Less</span>
        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: INACTIVE_DAY_COLOR }} />
        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: LOW_ACTIVITY_DAY_COLOR }} />
        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: MEDIUM_ACTIVITY_DAY_COLOR }} />
        <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: HIGH_ACTIVITY_DAY_COLOR }} />
        <span className="text-gray-400">More</span>
      </div>
      <ReactTooltip
        id={REACT_TOOLTIP_ID}
        delayShow={REACT_TOOLTIP_SHOW_DELAY_MS}
      />
    </div>
  );
};
