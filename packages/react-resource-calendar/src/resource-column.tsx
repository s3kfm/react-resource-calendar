import React from 'react';
import { ContinuousDateGroup, ContinuousDateRangeItem, GridDateRange, GridEvent, GridResource, GridSlotClickInfo, SubHourGradingStyle } from './types';
import { GridEventCard } from './grid-event-card';
import { TimeCell } from './time-cell';
import { computeGridColumnLayout, computeGridContinuousColumnLayout } from './grid-utils';
import { useGridTheme } from './theme';

export interface ResourceColumnProps<
  TData = Record<string, unknown>,
  TMeta = Record<string, unknown>
> {
  key?: React.Key;
  group?: ContinuousDateGroup;
  range?: GridDateRange;
  dateStr?: string;
  resource: GridResource<TMeta>;
  events: GridEvent<TData>[];
  displayHours?: string[];
  startHour?: number;
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
  group,
  range,
  dateStr,
  resource,
  events,
  displayHours = [],
  startHour = 8,
  timeSlotHeight = 48,
  intervalMinutes = 15,
  subHourGrading = 'none',
  pxPerMinute = 0.8,
  onGridClick,
  onEventClick,
  renderEvent,
}: ResourceColumnProps<TData, TMeta>): React.ReactElement => {
  const theme = useGridTheme();

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

    // Calculate slot steps
    const slotsPerHour = Math.max(1, Math.floor(60 / intervalMinutes));
    const slotHeight = timeSlotHeight / slotsPerHour;
    const minuteSteps: number[] = [];
    for (let i = 0; i < slotsPerHour; i++) {
      minuteSteps.push(i * intervalMinutes);
    }

    return (
      <div
        id={`grid-col-group-${group.id}-${resource.id}`}
        role="region"
        aria-label={`Timeline column for ${resource.label}`}
        className="relative group/col"
        style={{
          height: `${totalHeight}px`,
          backgroundColor: theme.palette.surfaceCard,
        }}
      >
        {/* Background interval grid cells for each range in this continuous group */}
        {group.ranges.map((rangeItem: ContinuousDateRangeItem) => (
          <React.Fragment key={`range-block-${rangeItem.dateStr}`}>
            {rangeItem.displayHours.map((hour, hourIdx) => {
              const slotHourNum = rangeItem.startHour + hourIdx;

              return (
                <React.Fragment key={`${rangeItem.dateStr}-${hour}`}>
                  {minuteSteps.map((minOffset, stepIdx) => {
                    const slotTimeString = `${String(slotHourNum).padStart(2, '0')}:${String(minOffset).padStart(2, '0')}`;
                    const minutesFromGroupStart =
                      rangeItem.offsetMinutesFromGroupStart + hourIdx * 60 + minOffset;
                    const isHourEnd = stepIdx === slotsPerHour - 1;

                    const handleSlotClick = () => {
                      if (onGridClick) {
                        const slotDate = new Date(rangeItem.start);
                        slotDate.setHours(slotHourNum, minOffset, 0, 0);
                        onGridClick({
                          date: slotDate,
                          dateStr: rangeItem.dateStr,
                          resourceId: resource.id,
                          time: slotTimeString,
                          minutesFromStart: minutesFromGroupStart,
                        });
                      }
                    };

                    return (
                      <TimeCell
                        key={`${rangeItem.dateStr}-${slotHourNum}-${minOffset}`}
                        slotTimeString={slotTimeString}
                        minuteOffset={minOffset}
                        isHourEnd={isHourEnd}
                        resourceLabel={resource.label}
                        height={slotHeight}
                        subHourGrading={subHourGrading}
                        onClick={handleSlotClick}
                      />
                    );
                  })}
                </React.Fragment>
              );
            })}
          </React.Fragment>
        ))}

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

  // Fallback single range rendering
  const effectiveDateStr = dateStr || (range ? range.startsAt.toISOString().slice(0, 10) : '');
  const totalHeight = displayHours.length * timeSlotHeight;
  const effectiveEndHour = range?.endHour !== undefined ? range.endHour : startHour + displayHours.length;
  const columnLayoutItems = computeGridColumnLayout(
    events,
    effectiveDateStr,
    resource.id,
    startHour,
    effectiveEndHour,
    pxPerMinute
  );

  const slotsPerHour = Math.max(1, Math.floor(60 / intervalMinutes));
  const slotHeight = timeSlotHeight / slotsPerHour;
  const minuteSteps: number[] = [];
  for (let i = 0; i < slotsPerHour; i++) {
    minuteSteps.push(i * intervalMinutes);
  }

  return (
    <div
      id={`grid-col-${effectiveDateStr}-${resource.id}`}
      role="region"
      aria-label={`Timeline column for ${resource.label}`}
      className="relative group/col"
      style={{
        height: `${totalHeight}px`,
        backgroundColor: theme.palette.surfaceCard,
      }}
    >
      {/* Background interval grid cells */}
      {displayHours.map((hour, hourIdx) => {
        const slotHourNum = startHour + hourIdx;

        return (
          <React.Fragment key={hour}>
            {minuteSteps.map((minOffset, stepIdx) => {
              const slotTimeString = `${String(slotHourNum).padStart(2, '0')}:${String(minOffset).padStart(2, '0')}`;
              const minutesFromStart = hourIdx * 60 + minOffset;
              const isHourEnd = stepIdx === slotsPerHour - 1;

              const handleSlotClick = () => {
                if (onGridClick && range) {
                  const slotDate = new Date(range.startsAt);
                  slotDate.setHours(slotHourNum, minOffset, 0, 0);
                  onGridClick({
                    date: slotDate,
                    dateStr: effectiveDateStr,
                    resourceId: resource.id,
                    time: slotTimeString,
                    minutesFromStart,
                  });
                }
              };

              return (
                <TimeCell
                  key={`${slotHourNum}-${minOffset}`}
                  slotTimeString={slotTimeString}
                  minuteOffset={minOffset}
                  isHourEnd={isHourEnd}
                  resourceLabel={resource.label}
                  height={slotHeight}
                  subHourGrading={subHourGrading}
                  onClick={handleSlotClick}
                />
              );
            })}
          </React.Fragment>
        );
      })}

      {/* Render Layout Event Cards */}
      {columnLayoutItems.map(({ event, layout }) => (
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
};
