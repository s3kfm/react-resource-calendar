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
  type?: 'room' | 'practitioner' | 'equipment' | 'staff' | string;
  category?: string;
  location?: string;
  active?: boolean;
  order?: number;
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
  startHour?: number; // Optional custom start hour for this specific date range (e.g. 1 for 01:00 AM)
  endHour?: number;   // Optional custom end hour for this specific date range (e.g. 24 for 24:00)
}

/**
 * Metadata for an individual date range slice within a continuous group
 */
export interface ContinuousDateRangeItem {
  range: GridDateRange;
  start: Date;
  end: Date;
  startHour: number;
  endHour: number;
  displayHours: string[];
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
  resourceId?: string; // Primary resource (e.g. 'rm-101')
  resourceIds?: string[]; // Multiple resources (e.g. ['rm-101', 'rm-102'] or ['rm-101', 'dr-smith'])
  /**
   * Primary start timestamp (Date object or ISO-8601 string)
   */
  startsAt: Date | string;
  /**
   * Primary end timestamp (Date object or ISO-8601 string)
   */
  endsAt: Date | string;
  subTitle?: string;
  patient?: string;
  practitioner?: string;
  roomName?: string;
  type?: string;
  colorTheme?: 'blue' | 'teal' | 'amber' | 'purple' | 'rose' | string;
  hasConflict?: boolean;
  conflictOverlapSide?: 'left' | 'right' | 'full';
  notes?: string;
  status?: 'confirmed' | 'pending' | 'in-progress' | 'completed' | string;
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
   * Continuous Date Range mode: specify start date and end date
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
   * Currently active/selected resource ID (optional)
   */
  activeResourceId?: string | null;

  /**
   * Callback when a resource header is selected/clicked
   */
  onSelectResourceTab?: (resourceId: string) => void;

  /**
   * Callback when a resource header column is clicked.
   * Can be used to open dropdown menus, resource details, or deletion modals.
   */
  onResourceHeaderClick?: (resource: GridResource<TMeta>, event: React.MouseEvent | React.KeyboardEvent) => void;

  /**
   * Custom JSX element rendered on the right side of the resource header row.
   * If not provided (and no onHeaderActionClick is provided), nothing is rendered.
   */
  headerAction?: React.ReactNode;

  /**
   * Label or custom JSX for the header action button.
   */
  headerActionLabel?: React.ReactNode;

  /**
   * Callback fired when the header action slot is clicked or activated.
   */
  onHeaderActionClick?: (event: React.MouseEvent | React.KeyboardEvent) => void;

  /**
   * Custom render function for the header action slot.
   */
  renderHeaderAction?: (resources: GridResource<TMeta>[]) => React.ReactNode;

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
   * Callback when a resource header is clicked
   */
  onResourceClick?: (resource: GridResource<TMeta>) => void;

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
   * Start hour of the daily timeline (default: 8 for 08:00)
   */
  startHour?: number;

  /**
   * End hour of the daily timeline (default: 24 for 24:00/midnight)
   */
  endHour?: number;

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
