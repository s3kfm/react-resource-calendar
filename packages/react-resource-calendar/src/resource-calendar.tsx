import React, { useMemo, useRef } from 'react';
import { ContinuousDateGroup, GridDateRange, ResourceCalendarProps } from './types';
import { GridResourceHeader } from './grid-resource-header';
import { GridDateSection } from './grid-date-section';
import { groupContinuousDateRanges } from './grid-utils';
import {
  GridThemeContext,
  createGridTheme,
  gridThemePresets,
  gridThemeToCSSVariables,
} from './theme';

export const ResourceCalendar = <
  TData = Record<string, unknown>,
  TMeta = Record<string, unknown>
>({
  startsAt,
  endsAt,
  dateRanges,
  resources,
  onResourceHeaderClick,
  headerAction,
  headerActionLabel,
  onHeaderActionClick,
  renderHeaderAction,
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
  timeZoneLabel = 'TIME (EST)',
  className = '',
  ariaLabel = 'Resource scheduling grid',
  theme,
}: ResourceCalendarProps<TData, TMeta>): React.ReactElement => {
  const headerTabsRef = useRef<HTMLDivElement | null>(null);
  const gridBodyRef = useRef<HTMLDivElement | null>(null);

  // Resolve theme object from preset name or custom theme input
  const resolvedTheme = useMemo(() => {
    if (typeof theme === 'string' && theme in gridThemePresets) {
      return gridThemePresets[theme as keyof typeof gridThemePresets];
    }
    if (typeof theme === 'object' && theme !== null) {
      return createGridTheme(theme);
    }
    return gridThemePresets.default;
  }, [theme]);

  const cssVariables = useMemo(() => {
    return gridThemeToCSSVariables(resolvedTheme) as React.CSSProperties;
  }, [resolvedTheme]);

  // Compute effective date ranges (either from dateRanges prop or generated from startsAt/endsAt)
  const computedRanges = useMemo<GridDateRange[]>(() => {
    if (dateRanges && dateRanges.length > 0) {
      return dateRanges;
    }

    if (startsAt && endsAt) {
      const ranges: GridDateRange[] = [];
      const current = new Date(startsAt);
      current.setHours(0, 0, 0, 0);

      const targetEnd = new Date(endsAt);
      targetEnd.setHours(23, 59, 59, 999);

      while (current <= targetEnd) {
        const dayStart = new Date(current);
        const dayEnd = new Date(current);
        dayEnd.setHours(23, 59, 59, 999);

        ranges.push({
          startsAt: dayStart,
          endsAt: dayEnd,
        });

        current.setDate(current.getDate() + 1);
      }
      return ranges;
    }

    // Default fallback: today
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    return [{ startsAt: todayStart, endsAt: todayEnd }];
  }, [dateRanges, startsAt, endsAt]);

  // Group continuous date ranges
  const continuousGroups = useMemo<ContinuousDateGroup[]>(() => {
    return groupContinuousDateRanges(computedRanges, startHour, endHour, timeSlotHeight);
  }, [computedRanges, startHour, endHour, timeSlotHeight]);

  // Synchronize horizontal scrolling between header tabs and grid body
  const handleBodyScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (headerTabsRef.current) {
      headerTabsRef.current.scrollLeft = e.currentTarget.scrollLeft;
    }
  };

  return (
    <GridThemeContext.Provider value={resolvedTheme}>
      <div
        role="grid"
        aria-label={ariaLabel}
        data-grid-theme={resolvedTheme.name}
        style={{
          ...cssVariables,
          backgroundColor: resolvedTheme.palette.surface,
          color: resolvedTheme.palette.textPrimary,
        }}
        className={`react-resource-calendar h-full flex flex-col overflow-hidden select-none relative ${className}`}
        id="react-resource-calendar-container"
      >
        {/* Top Resource Column Header */}
        <GridResourceHeader<TMeta>
          scrollRef={headerTabsRef}
          resources={resources}
          onResourceHeaderClick={onResourceHeaderClick}
          headerAction={headerAction}
          headerActionLabel={headerActionLabel}
          onHeaderActionClick={onHeaderActionClick}
          renderHeaderAction={renderHeaderAction}
          timeColumnWidth={timeColumnWidth}
          resourceColumnWidth={resourceColumnWidth}
          timeZoneLabel={timeZoneLabel}
        />

        {/* Main Grid Scroll Area */}
        <div
          ref={gridBodyRef}
          onScroll={handleBodyScroll}
          style={{ backgroundColor: resolvedTheme.palette.surface }}
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
                startHour={startHour}
                endHour={endHour}
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
    </GridThemeContext.Provider>
  );
};
