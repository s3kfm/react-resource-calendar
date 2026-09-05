import React, { useMemo } from 'react';
import { ContinuousDateGroup, GridDateRange, GridEvent, GridResource, GridSlotClickInfo, SubHourGradingStyle } from './types';
import {
  formatDateToYYYYMMDD,
  generateDisplayHours,
  getEventAbsoluteTimestamps,
  getEventTimeInfo,
  computeGridContinuousSectionLayout,
  computeGridDiscreteSectionLayout,
} from './grid-utils';
import { GridDateHeader } from './grid-date-header';
import { TimeGutter } from './time-gutter';
import { ResourceColumn } from './resource-column';
import { ContinuousDateDivider } from './continuous-date-divider';
import { GridEventCard } from './grid-event-card';

const EMPTY_EVENTS: never[] = [];

export interface GridDateSectionProps<
  TData = Record<string, unknown>,
  TMeta = Record<string, unknown>
> {
  key?: React.Key;
  group?: ContinuousDateGroup;
  range?: GridDateRange;
  resources: GridResource<TMeta>[];
  events: GridEvent<TData>[];
  onGridClick?: (info: GridSlotClickInfo) => void;
  onEventClick?: (event: GridEvent<TData>, mouseEvent: React.MouseEvent | React.KeyboardEvent) => void;
  renderEvent?: (
    event: GridEvent<TData>,
    layout: { topPx: number; heightPx: number; hasConflict?: boolean }
  ) => React.ReactNode;
  startHour?: number;
  endHour?: number;
  timeSlotHeight?: number;
  timeColumnWidth?: number;
  resourceColumnWidth?: number;
  intervalMinutes?: number;
  subHourGrading?: SubHourGradingStyle;
  isFirstSection?: boolean;
}

export const GridDateSection = <
  TData = Record<string, unknown>,
  TMeta = Record<string, unknown>
>({
  group,
  range,
  resources,
  events,
  onGridClick,
  onEventClick,
  renderEvent,
  startHour = 8,
  endHour = 24,
  timeSlotHeight = 48,
  timeColumnWidth = 80,
  resourceColumnWidth = 180,
  intervalMinutes = 15,
  subHourGrading = 'none',
  isFirstSection = false,
}: GridDateSectionProps<TData, TMeta>): React.ReactElement | null => {
  const pxPerMinute = timeSlotHeight / 60;

  // Memoize continuous calculations if group is provided
  const groupEventsCount = useMemo(() => {
    if (!group) return 0;
    const groupStartMs = group.start.getTime();
    const groupEndMs = group.end.getTime();
    return events.filter((e) => {
      const timestamps = getEventAbsoluteTimestamps(e);
      return timestamps.startMs < groupEndMs && timestamps.endMs > groupStartMs;
    }).length;
  }, [group, events]);

  const allDisplayHours = useMemo(() => {
    return group ? group.ranges.flatMap((r) => r.displayHours) : [];
  }, [group]);

  const continuousSectionEventLayouts = useMemo(() => {
    if (!group) return [];
    return computeGridContinuousSectionLayout(
      events,
      resources,
      group.start,
      group.end,
      timeColumnWidth,
      resourceColumnWidth,
      pxPerMinute
    );
  }, [group, events, resources, timeColumnWidth, resourceColumnWidth, pxPerMinute]);

  // Discrete range calculations
  const effectiveStartHour =
    range?.startHour !== undefined
      ? range.startHour
      : range?.startsAt instanceof Date
      ? range.startsAt.getHours()
      : startHour;

  const effectiveEndHour =
    range?.endHour !== undefined
      ? range.endHour
      : endHour;

  const dateStr = range ? formatDateToYYYYMMDD(range.startsAt) : '';

  const displayHours = useMemo(() => {
    if (!range) return [];
    return generateDisplayHours(effectiveStartHour, effectiveEndHour);
  }, [range, effectiveStartHour, effectiveEndHour]);

  const dayEventsCount = useMemo(() => {
    if (!range || !dateStr) return 0;
    return events.filter((e) => {
      const info = getEventTimeInfo(e, effectiveStartHour);
      return info.dateStr === dateStr;
    }).length;
  }, [range, dateStr, events, effectiveStartHour]);

  const discreteSectionEventLayouts = useMemo(() => {
    if (!range || !dateStr) return [];
    return computeGridDiscreteSectionLayout(
      events,
      resources,
      dateStr,
      effectiveStartHour,
      effectiveEndHour,
      timeColumnWidth,
      resourceColumnWidth,
      pxPerMinute
    );
  }, [range, dateStr, events, resources, effectiveStartHour, effectiveEndHour, timeColumnWidth, resourceColumnWidth, pxPerMinute]);

  // If group is provided, render continuous group
  if (group) {
    const firstRangeItem = group.ranges[0];

    return (
      <div
        role="rowgroup"
        className="relative mb-6"
        id={`grid-continuous-section-${group.id}`}
      >
        {/* Day 0 Sticky Header Container - scoped strictly to Day 0's height so it scrolls off when Day 0 ends */}
        <div
          className="absolute left-0 right-0 pointer-events-none z-20"
          style={{
            top: 0,
            height: `${firstRangeItem.heightPx + 42}px`,
          }}
        >
          <div className="sticky top-0 pointer-events-auto">
            <GridDateHeader
              range={firstRangeItem.range}
              dateStr={firstRangeItem.dateStr}
              dayEventsCount={groupEventsCount}
              isFirstSection={isFirstSection}
            />
          </div>
        </div>

        {/* Header spacer to offset grid under initial header */}
        <div className="h-[42px] w-full pointer-events-none" />

        {/* Grid container with 1px border gap */}
        <div
          role="row"
          className="relative grid gap-[1px]"
          style={{
            backgroundColor: 'var(--grid-border)',
            gridTemplateColumns: `${timeColumnWidth}px repeat(${resources.length}, ${resourceColumnWidth}px)`,
            minWidth: `${timeColumnWidth + resources.length * resourceColumnWidth}px`,
          }}
        >
          {/* Time Gutter Column for all continuous hours */}
          <TimeGutter
            displayHours={allDisplayHours}
            timeSlotHeight={timeSlotHeight}
          />

          {/* Unified Resource Columns (Grid Background Slots) */}
          {resources.map((resource) => (
            <ResourceColumn
              key={resource.id}
              group={group}
              resource={resource}
              events={EMPTY_EVENTS} // Handled by section-level multi-resource overlay
              timeSlotHeight={timeSlotHeight}
              intervalMinutes={intervalMinutes}
              subHourGrading={subHourGrading}
              pxPerMinute={pxPerMinute}
              onGridClick={onGridClick}
              onEventClick={onEventClick}
              renderEvent={renderEvent}
            />
          ))}

          {/* Sticky Continuous Date Dividers for 2nd and subsequent continuous days */}
          {group.ranges.slice(1).map((rangeItem) => (
            <div
              key={`continuous-wrapper-${rangeItem.dateStr}`}
              className="absolute left-0 right-0 pointer-events-none z-15"
              style={{
                top: `${rangeItem.offsetPxFromGroupStart}px`,
                height: `${rangeItem.heightPx}px`,
              }}
            >
              <div className="sticky top-0 z-20 pointer-events-none -mt-3">
                <ContinuousDateDivider rangeItem={rangeItem} />
              </div>
            </div>
          ))}

          {/* Multi-Resource Aware Event Overlay Layer */}
          <div className="absolute inset-0 pointer-events-none z-10">
            {continuousSectionEventLayouts.map(({ event, layout, segmentKey }) => (
              <GridEventCard
                key={segmentKey}
                event={event}
                layout={layout}
                onClick={onEventClick}
                renderEvent={renderEvent}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  // Fallback single range rendering
  if (!range) return null;

  return (
    <div role="rowgroup" className="relative mb-6" id={`grid-date-section-${dateStr}`}>
      {/* Date Header - Sticky for this date section */}
      <div className="sticky top-0 z-20">
        <GridDateHeader
          range={range}
          dateStr={dateStr}
          dayEventsCount={dayEventsCount}
          isFirstSection={isFirstSection}
        />
      </div>

      {/* Grid container with 1px border gap */}
      <div
        role="row"
        className="relative grid gap-[1px]"
        style={{
          backgroundColor: 'var(--grid-border)',
          gridTemplateColumns: `${timeColumnWidth}px repeat(${resources.length}, ${resourceColumnWidth}px)`,
          minWidth: `${timeColumnWidth + resources.length * resourceColumnWidth}px`,
        }}
      >
        {/* Time Gutter Column */}
        <TimeGutter
          displayHours={displayHours}
          timeSlotHeight={timeSlotHeight}
        />

        {/* Resource Columns */}
        {resources.map((resource) => (
          <ResourceColumn
            key={resource.id}
            range={range}
            dateStr={dateStr}
            resource={resource}
            events={EMPTY_EVENTS} // Handled by section-level multi-resource overlay
            displayHours={displayHours}
            startHour={effectiveStartHour}
            timeSlotHeight={timeSlotHeight}
            intervalMinutes={intervalMinutes}
            subHourGrading={subHourGrading}
            pxPerMinute={pxPerMinute}
            onGridClick={onGridClick}
            onEventClick={onEventClick}
            renderEvent={renderEvent}
          />
        ))}

        {/* Multi-Resource Aware Event Overlay Layer */}
        <div className="absolute inset-0 pointer-events-none z-10">
          {discreteSectionEventLayouts.map(({ event, layout, segmentKey }) => (
            <GridEventCard
              key={segmentKey}
              event={event}
              layout={layout}
              onClick={onEventClick}
              renderEvent={renderEvent}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
