import React from 'react';
import { Calendar } from 'lucide-react';
import { ContinuousDateRangeItem } from './types';
import { formatDateRangeTitle } from './grid-utils';
import { useGridTheme } from './theme';

export interface ContinuousDateDividerProps {
  rangeItem: ContinuousDateRangeItem;
}

export const ContinuousDateDivider: React.FC<ContinuousDateDividerProps> = ({ rangeItem }) => {
  const theme = useGridTheme();
  const title = formatDateRangeTitle(rangeItem.range);

  return (
    <div
      className="w-full relative flex items-center justify-center py-1 pointer-events-none select-none"
      id={`continuous-divider-${rangeItem.dateStr}`}
    >
      {/* 1px Full-Width Thin Line */}
      <div
        style={{
          borderColor: theme.palette.borderStrong,
          backgroundColor: theme.palette.border,
        }}
        className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-[1px] border-t shadow-xs"
      />

      {/* Centered Date Badge */}
      <div
        style={{
          backgroundColor: theme.palette.surfaceContainer,
          color: theme.palette.textPrimary,
          borderColor: theme.palette.borderStrong,
        }}
        className="relative z-10 border shadow-xs px-3.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5 backdrop-blur-xs select-none"
      >
        <Calendar
          style={{ color: theme.palette.primary }}
          className="w-3 h-3"
        />
        <span>{title}</span>
      </div>
    </div>
  );
};
