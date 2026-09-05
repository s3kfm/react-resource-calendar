import React from 'react';
import { ContinuousDateGroup, GridDateRange, GridEvent, GridResource, GridSlotClickInfo, SubHourGradingStyle } from './types';
import { GridEventCard } from './grid-event-card';
import { TimeCell } from './time-cell';
import { groupContinuousDateRanges, formatDateToYYYYMMDD, formatEventTime, computeGridContinuousColumnLayout } from './grid-utils';

export interface ResourceColumnProps<
  TData = Record<string, unknown>,
  TMeta = Record<string, unknown>
> {
  key?: React.Key;
  group?: ContinuousDateGroup;
  range?: GridDateRange;
  resource: GridResource<TMeta>;
  events: GridEvent<TData>[];
  timeSlotHeight?: number;
  intervalMinutes?: number;
  subHourGrading?: SubHourGradingStyle;
  pxPerMinute?: number;
  onGridClick?: (info: GridSlotClickInfo) => void;
  onEventClick?: (event: GridEvent<TData>, mouseEvent: React.MouseEvent | React.KeyboardEvent) => void;
  renderEvent?: (
    event: GridEvent<TData>,
    layout: { topPx: number; heightPx: number; hasConflict?: boolean }
  ) => React.ReactNode;
}

export const ResourceColumn = <
  TData = Record<string, unknown>,
  TMeta = Record<string, unknown>
>({
  group: suppliedGroup,
  range,
  resource,
  events,
  timeSlotHeight = 48,
  intervalMinutes = 15,
  subHourGrading = 'none',
  pxPerMinute = 0.8,
  onGridClick,
  onEventClick,
  renderEvent,
}: ResourceColumnProps<TData, TMeta>): React.ReactElement => {

  const group = suppliedGroup ?? (range ? groupContinuousDateRanges([range], timeSlotHeight)[0] : undefined);
  if (!Number.isFinite(intervalMinutes) || intervalMinutes <= 0) throw new RangeError('intervalMinutes must be positive.');

  // If group is provided, render continuous layout across all ranges in the group
  if (group) {
    const totalHeight = group.totalHeightPx;
    const continuousLayoutItems = computeGridContinuousColumnLayout(
      events,
      resource.id,
      group.start,
      group.end,
      pxPerMinute
    );

    return (
      <div
        id={`grid-col-group-${group.id}-${resource.id}`}
        role="region"
        aria-label={`Timeline column for ${resource.label}`}
        className="relative group/col"
        style={{
          height: `${totalHeight}px`,
          backgroundColor: 'var(--grid-surface-card)',
        }}
      >
        {/* Background interval grid cells for each range in this continuous group */}
        {group.ranges.flatMap(rangeItem => rangeItem.rows.flatMap(row => {
          const cells: React.ReactNode[] = [];
          for (let ms = row.startsAt.getTime(); ms < row.endsAt.getTime();) {
            const next = Math.min(row.endsAt.getTime(), ms + intervalMinutes * 60000);
            const date = new Date(ms);
            const slotTimeString = formatEventTime(date);
            cells.push(<TimeCell
              key={ms}
              slotTimeString={slotTimeString}
              minuteOffset={date.getMinutes()}
              isHourEnd={new Date(next).getMinutes() === 0}
              resourceLabel={resource.label}
              height={(next - ms) / 60000 * pxPerMinute}
              subHourGrading={subHourGrading}
              onClick={() => onGridClick?.({ date: new Date(date), dateStr: formatDateToYYYYMMDD(date),
                resourceId: resource.id, time: slotTimeString,
                minutesFromStart: (date.getTime() - group.start.getTime()) / 60000 })}
            />);
            ms = next;
          }
          return cells;
        }))}

        {/* Render Layout Event Cards spanning across continuous days */}
        {continuousLayoutItems.map(({ event, layout }) => (
          <GridEventCard
            key={event.id}
            event={event}
            layout={layout}
            onClick={onEventClick}
            renderEvent={renderEvent}
          />
        ))}
      </div>
    );
  }

  return <></>;
};
