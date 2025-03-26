import * as React from 'react';

import { Button, ButtonType } from '../../../blocks/Button';
import { Icon, IconType } from '../../../blocks/Icon';
import { getIsoDate } from '../../../shared/utils/dates-helper';

import { MonthDatePickerProps } from './types';

export const MonthDatePicker: React.FC<MonthDatePickerProps> = ({
  onMonthChange,
  sundayDate,
}) => {
  const monthStartDate = new Date();
  monthStartDate.setDate(sundayDate.getDate() - 30);

  const handleChangeWeekButtonClick = React.useCallback(
    (direction) => {
      const newWeekEndDate = new Date(sundayDate);
      newWeekEndDate.setDate(sundayDate.getDate() + direction * 30);

      onMonthChange(newWeekEndDate);
    },
    [sundayDate, onMonthChange]
  );

  return (
    <div className="flex flex-1 justify-between items-center">
      <Button
        buttonType={ButtonType.Secondary}
        onClick={() => handleChangeWeekButtonClick(-1)}
        className='px-4'
      >
        <Icon className="m-0 flex" type={IconType.LeftArrow} />
      </Button>
      <div className="break-words break-all text-sm min-w-[120px] text-center dark:text-neutral-300">
        <span>{getIsoDate(monthStartDate)}</span>
        <br />
        <span>{getIsoDate(sundayDate)}</span>
      </div>
      <Button
        buttonType={ButtonType.Secondary}
        onClick={() => handleChangeWeekButtonClick(1)}
        className='px-4'
      >
        <Icon className="m-0 flex" type={IconType.RightArrow} />
      </Button>
    </div>
  );
};
