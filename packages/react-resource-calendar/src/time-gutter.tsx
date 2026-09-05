import React from 'react';

export interface TimeGutterProps {
  displayHours: string[];
  timeSlotHeight?: number;
}

export const TimeGutter: React.FC<TimeGutterProps> = ({
  displayHours,
  timeSlotHeight = 48,
}) => {
  const totalHeight = displayHours.length * timeSlotHeight;

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
      {displayHours.map((hour, idx) => (
        <div
          key={`${hour}-${idx}`}
          role="rowheader"
          aria-label={`Time: ${hour}`}
          style={{
            height: `${timeSlotHeight}px`,
            borderColor: 'var(--grid-border)',
            color: 'var(--grid-text-secondary)',
          }}
          className="flex justify-end pr-2 items-center font-mono text-[12px] font-medium border-b opacity-90"
        >
          {hour}
        </div>
      ))}
    </div>
  );
};
