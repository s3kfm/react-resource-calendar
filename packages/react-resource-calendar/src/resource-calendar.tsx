import React, { useMemo, useRef } from 'react';
import { ContinuousDateGroup, GridDateRange, ResourceCalendarProps } from './types';
import { GridResourceHeader } from './grid-resource-header';
import { GridDateSection } from './grid-date-section';
import { groupContinuousDateRanges } from './grid-utils';

export const ResourceCalendar = <
  TData = Record<string, unknown>,
  TMeta = Record<string, unknown>
>({
  startsAt,
  endsAt,
  dateRanges,
  resources,
  onResourceHeaderClick,
  events,
  onGridClick,
  onEventClick,
  renderEvent,
  timeSlotHeight = 48,
  timeColumnWidth = 80,
  resourceColumnWidth = 180,
  intervalMinutes = 15,
  subHourGrading = 'none',
  cornerLabel,
  className = '',
  ariaLabel = 'Resource scheduling grid',
  theme,
}: ResourceCalendarProps<TData, TMeta>): React.ReactElement => {
  const headerTabsRef = useRef<HTMLDivElement | null>(null);
  const gridBodyRef = useRef<HTMLDivElement | null>(null);

  // Compute effective date ranges (either from dateRanges prop or generated from startsAt/endsAt)
  const computedRanges = useMemo<GridDateRange[]>(() => {
    if (dateRanges !== undefined) {
      return dateRanges;
    }

    if (startsAt || endsAt) {
      if (!startsAt || !endsAt) throw new RangeError('Provide both startsAt and endsAt.');
      return [{ startsAt, endsAt }];
    }

    // Default fallback: today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(24, 0, 0, 0);

    return [{ startsAt: todayStart, endsAt: todayEnd }];
  }, [dateRanges, startsAt, endsAt]);

  // Group continuous date ranges
  const continuousGroups = useMemo<ContinuousDateGroup[]>(() => {
    return groupContinuousDateRanges(computedRanges, timeSlotHeight);
  }, [computedRanges, timeSlotHeight]);

  // Synchronize horizontal scrolling between header tabs and grid body
  const handleBodyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (headerTabsRef.current) {
      headerTabsRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  return (
    <div
      role="grid"
      aria-label={ariaLabel}
      data-grid-theme={theme}
      className={`react-resource-calendar h-full flex flex-col overflow-hidden select-none relative ${className}`}
      id="react-resource-calendar-container"
    >
      {/* Top Resource Column Header */}
      <GridResourceHeader<TMeta>
        scrollRef={headerTabsRef}
        resources={resources}
        onResourceHeaderClick={onResourceHeaderClick}
        timeColumnWidth={timeColumnWidth}
        resourceColumnWidth={resourceColumnWidth}
        cornerLabel={cornerLabel}
      />

      {/* Main Grid Scroll Area */}
      <div
        ref={gridBodyRef}
        onScroll={handleBodyScroll}
        style={{ backgroundColor: 'var(--grid-surface)' }}
        className="flex-1 overflow-auto relative"
        id="react-resource-calendar-body"
      >
        <div className="pb-16">
          {continuousGroups.map((group, index) => (
            <GridDateSection<TData, TMeta>
              key={group.id}
              group={group}
              resources={resources}
              events={events}
              onGridClick={onGridClick}
              onEventClick={onEventClick}
              renderEvent={renderEvent}
              timeSlotHeight={timeSlotHeight}
              timeColumnWidth={timeColumnWidth}
              resourceColumnWidth={resourceColumnWidth}
              intervalMinutes={intervalMinutes}
              subHourGrading={subHourGrading}
              isFirstSection={index === 0}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
