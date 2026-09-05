import React from 'react';
import { Calendar as CalendarIcon } from 'lucide-react';
import { GridDateRange } from './types';
import { formatDateRangeTitle } from './grid-utils';

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
  const title = formatDateRangeTitle(range);

  return (
    <div
      id={`grid-date-header-${dateStr}`}
      style={{
        backgroundColor: 'var(--grid-surface-container)',
        borderColor: 'var(--grid-border-strong)',
        color: 'var(--grid-text-primary)',
      }}
      className="h-[42px] w-full border-b-2 px-4 flex items-center justify-between shadow-xs select-none"
    >
      <div className="flex items-center gap-2">
        <CalendarIcon
          style={{ color: 'var(--grid-primary)' }}
          className="w-4 h-4"
        />
        <span
          style={{ color: 'var(--grid-text-primary)' }}
          className="font-bold text-[15px] md:text-headline-sm tracking-wide"
        >
          {title}
        </span>
      </div>
      <div
        style={{ color: 'var(--grid-text-secondary)' }}
        className="text-xs font-mono"
      >
        {dayEventsCount} scheduled {dayEventsCount === 1 ? 'item' : 'items'}
      </div>
    </div>
  );
};
