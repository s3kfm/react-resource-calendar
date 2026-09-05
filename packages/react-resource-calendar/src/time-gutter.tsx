import React from 'react';
import { GridTimeRow } from './types';
import { formatEventTime } from './grid-utils';

export interface TimeGutterProps {
  rows: GridTimeRow[];
}

export const TimeGutter: React.FC<TimeGutterProps> = ({
  rows,
}) => {
  const totalHeight = rows.reduce((sum, row) => sum + row.heightPx, 0);

  return (
    <div
      role="rowgroup"
      aria-label="Time indicators"
      style={{
        height: `${totalHeight}px`,
        backgroundColor: 'var(--grid-surface-subtle)',
      }}
      className="flex flex-col relative select-none"
    >
      {rows.map((row, idx) => (
        <div
          key={`${row.startsAt.getTime()}-${idx}`}
          role="rowheader"
          aria-label={`Time: ${formatEventTime(row.startsAt)}`}
          style={{
            height: `${row.heightPx}px`,
            borderColor: 'var(--grid-border)',
            color: 'var(--grid-text-secondary)',
          }}
          className="shrink-0 overflow-hidden flex justify-end pr-2 items-center font-mono text-[12px] font-medium border-b opacity-90"
        >
          {formatEventTime(row.startsAt)}
        </div>
      ))}
    </div>
  );
};
