import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { GridDateRange } from './types';
import { formatDateRangeTitle } from './grid-utils';
import { useGridTheme } from './theme';

export interface GridDateHeaderProps {
  range: GridDateRange;
  dateStr: string;
  dayEventsCount: number;
  isFirstSection?: boolean;
}

export const GridDateHeader: React.FC<GridDateHeaderProps> = ({
  range,
  dateStr,
  dayEventsCount,
}) => {
  const theme = useGridTheme();
  const title = formatDateRangeTitle(range);

  return (
    <div
      id={`grid-date-header-${dateStr}`}
      style={{
        backgroundColor: theme.palette.surfaceContainer,
        borderColor: theme.palette.borderStrong,
        color: theme.palette.textPrimary,
      }}
      className="h-[42px] w-full border-b-2 px-4 flex items-center justify-between shadow-xs select-none"
    >
      <div className="flex items-center gap-2">
        <CalendarIcon
          style={{ color: theme.palette.primary }}
          className="w-4 h-4"
        />
        <span
          style={{ color: theme.palette.textPrimary }}
          className="font-bold text-[15px] md:text-headline-sm tracking-wide"
        >
          {title}
        </span>
      </div>
      <div
        style={{ color: theme.palette.textSecondary }}
        className="text-xs font-mono"
      >
        {dayEventsCount} scheduled {dayEventsCount === 1 ? 'item' : 'items'}
      </div>
    </div>
  );
};
