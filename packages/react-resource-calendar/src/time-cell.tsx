import React from 'react';
import { Plus } from 'lucide-react';
import { SubHourGradingStyle } from './types';

export interface TimeCellProps {
  slotTimeString: string;
  minuteOffset: number;
  isHourEnd?: boolean;
  resourceLabel: string;
  height: number;
  subHourGrading?: SubHourGradingStyle;
  onClick?: () => void;
}

export const TimeCell: React.FC<TimeCellProps> = ({
  slotTimeString,
  minuteOffset,
  isHourEnd = false,
  resourceLabel,
  height,
  subHourGrading = 'none',
  onClick,
}) => {

  // Determine border style: hour boundary gets solid border, sub-hour intervals follow subHourGrading
  let borderBottomStyle: React.CSSProperties = {};
  if (isHourEnd) {
    borderBottomStyle = { borderBottom: `1px solid var(--grid-border)` };
  } else {
    if (subHourGrading === 'dashed') {
      borderBottomStyle = { borderBottom: `1px dashed var(--grid-border)` };
    } else if (subHourGrading === 'solid') {
      borderBottomStyle = { borderBottom: `1px solid var(--grid-border)` };
    } else if (subHourGrading === 'dotted') {
      borderBottomStyle = { borderBottom: `1px dotted var(--grid-border)` };
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      role="gridcell"
      tabIndex={0}
      aria-label={`Time slot: ${slotTimeString} in ${resourceLabel}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      style={{
        height: `${height}px`,
        backgroundColor: 'var(--grid-surface-card)',
        ...borderBottomStyle,
      }}
      className="relative group/slot cursor-pointer select-none transition-colors hover:brightness-95 focus-visible:ring-2 focus-visible:ring-inset focus-visible:outline-none"
      title={`Click or press Enter to schedule in ${resourceLabel} at ${slotTimeString}`}
      data-minute={minuteOffset}
    >
      <div
        style={{ color: 'var(--grid-primary)' }}
        className="hidden group-hover/slot:flex group-focus-visible/slot:flex absolute right-1 top-1/2 -translate-y-1/2 opacity-75 pointer-events-none"
      >
        <Plus className="w-2.5 h-2.5" />
      </div>
    </div>
  );
};
