import React from 'react';

/**
 * Resource item definition for the grid header and columns.
 * Supports a generic metadata type TMeta for type-safe domain attributes.
 */
export interface GridResource<TMeta = Record<string, unknown>> {
  id: string;
  label: string;
  subTitle?: string;
  color?: string;
  colorTheme?: 'blue' | 'teal' | 'amber' | 'purple' | 'rose' | string;
  /**
   * Custom render function for the resource header column.
   * If provided, this function will be called instead of the default header rendering.
   */
  render?: (resource: GridResource<TMeta>) => React.ReactNode;
  /**
   * Optional custom domain metadata payload
   */
  meta?: TMeta;
}

/**
 * Discrete date range configuration for dateRanges mode
 */
export interface GridDateRange {
  startsAt: Date;
  endsAt: Date;
  label?: string; // Optional custom title (e.g., "MONDAY, OCT 23")
  id?: string;
}

/**
 * Metadata for an individual date range slice within a continuous group
 */
export interface GridTimeRow {
  startsAt: Date;
  endsAt: Date;
  heightPx: number;
}

export interface ContinuousDateRangeItem {
  range: GridDateRange;
  start: Date;
  end: Date;
  rows: GridTimeRow[];
  dateStr: string;
  offsetMinutesFromGroupStart: number;
  offsetPxFromGroupStart: number;
  heightPx: number;
}

/**
 * Group of consecutive date ranges that form an unbroken, continuous timeline
 */
export interface ContinuousDateGroup {
  id: string;
  ranges: ContinuousDateRangeItem[];
  start: Date;
  end: Date;
  totalMinutes: number;
  totalHeightPx: number;
  isFirstGroup: boolean;
}

/**
 * Layout calculation result for an event card
 */
export interface GridEventLayout {
  topPx: number;
  heightPx: number;
  leftPx?: number;
  widthPx?: number;
  hasConflict?: boolean;
  conflictOverlapSide?: 'left' | 'right' | 'full';
  extendsBeyondEnd?: boolean;
  overflowMinutes?: number;
  overflowHours?: number;
  overflowText?: string;
  // Multi-resource spanning & continuation
  isMultiResource?: boolean;
  colSpan?: number;
  segmentIndex?: number;
  totalSegments?: number;
  dashedBorderLeft?: boolean;
  dashedBorderRight?: boolean;
  resourceIds?: string[];
  connectedResourceNames?: string[];
}

/**
 * Event item rendered on the grid.
 * Supports a generic data payload TData for custom domain models.
 * Standard temporal fields: `startsAt` and `endsAt` (ISO 8601 string or Date object).
 */
export interface GridEvent<TData = Record<string, unknown>> {
  id: string;
  title: string;
  /** Assigned resources. Use an array even for a single resource. Empty means unassigned. */
  resourceIds: string[];
  /**
   * Primary start timestamp (Date object or ISO-8601 string)
   */
  startsAt: Date | string;
  /**
   * Primary end timestamp (Date object or ISO-8601 string)
   */
  endsAt: Date | string;
  subTitle?: string;
  colorTheme?: 'blue' | 'teal' | 'amber' | 'purple' | 'rose' | string;
  hasConflict?: boolean;
  /**
   * Custom render function for this specific event card
   */
  render?: (event: GridEvent<TData>, layout: GridEventLayout) => React.ReactNode;
  /**
   * Optional custom domain data payload
   */
  data?: TData;
}

export interface GridSlotClickInfo {
  date: Date;
  dateStr: string;
  resourceId: string;
  time: string; // e.g. "09:00"
  minutesFromStart: number;
}

export type SubHourGradingStyle = 'none' | 'dashed' | 'solid' | 'dotted';

export interface ResourceCalendarProps<
  TData = Record<string, unknown>,
  TMeta = Record<string, unknown>
> {
  /**
   * Exact time window: start inclusive, end exclusive. Supply both endpoints.
   */
  startsAt?: Date;
  endsAt?: Date;

  /**
   * Discrete Date Ranges mode: array of date windows to display
   */
  dateRanges?: GridDateRange[];

  /**
   * Resources to display as columns
   */
  resources: GridResource<TMeta>[];

  /**
   * Callback when a resource header column is clicked.
   * Can be used to open dropdown menus, resource details, or deletion modals.
   */
  onResourceHeaderClick?: (resource: GridResource<TMeta>, event: React.MouseEvent | React.KeyboardEvent) => void;

  /**
   * Scheduled events to display in the grid
   */
  events: GridEvent<TData>[];

  /**
   * Callback when an empty slot in the grid is clicked or activated with keyboard
   */
  onGridClick?: (info: GridSlotClickInfo) => void;

  /**
   * Callback when a scheduled event card is clicked or activated with keyboard
   */
  onEventClick?: (event: GridEvent<TData>, mouseEvent: React.MouseEvent | React.KeyboardEvent) => void;

  /**
   * Optional custom event renderer for all events in the grid
   */
  renderEvent?: (event: GridEvent<TData>, layout: GridEventLayout) => React.ReactNode;

  /**
   * Interval duration in minutes for grid clicking slots (default: 15)
   */
  intervalMinutes?: number;

  /**
   * Visual grading/dividers style between sub-hour intervals inside an hour (default: 'none')
   */
  subHourGrading?: SubHourGradingStyle;

  /**
   * Height in pixels per 1-hour time slot (default: 48)
   */
  timeSlotHeight?: number;

  /**
   * Width of the sticky time column (default: 80px)
   */
  timeColumnWidth?: number;

  /**
   * Width of each resource column (default: 180px)
   */
  resourceColumnWidth?: number;

  /**
   * Timezone display label (default: "TIME (EST)")
   */
  timeZoneLabel?: string;

  /**
   * Optional accessible label for the grid region
   */
  ariaLabel?: string;

  /**
   * CSS theme name, applied as data-grid-theme. Built-ins: default, warm, clinical, dark.
   */
  theme?: string;

  /**
   * Optional extra CSS class names for the outer grid container
   */
  className?: string;
}
