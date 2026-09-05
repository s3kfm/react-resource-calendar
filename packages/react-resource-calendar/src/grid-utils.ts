import { ContinuousDateGroup, ContinuousDateRangeItem, GridDateRange, GridEvent, GridResource, GridEventLayout } from './types';

export interface SectionEventLayoutItem<TData = Record<string, unknown>> {
  event: GridEvent<TData>;
  layout: GridEventLayout;
  segmentKey: string;
}

/** Formats a timestamp as local HH:mm for event labels. */
export function formatEventTime(value: Date | string): string {
  const date = new Date(value);
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

/** Derives display information from the event's two timestamps. */
export function getEventTimeInfo<TData = unknown>(event: GridEvent<TData>) {
  const { startMs, endMs } = getEventAbsoluteTimestamps(event);
  return {
    dateStr: formatDateToYYYYMMDD(new Date(startMs)),
    startTimeStr: formatEventTime(new Date(startMs)),
    endTimeStr: formatEventTime(new Date(endMs)),
  };
}

/** Resolves explicit timestamps; missing/invalid/reversed ranges are rejected. */
export function getEventAbsoluteTimestamps<TData = unknown>(event: GridEvent<TData>): { startMs: number; endMs: number; dateStr: string } {
  const parse = (value: Date | string): number => {
    if (value instanceof Date) return value.getTime();
    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(value)) return new Date(value).getTime();
    return NaN;
  };
  const startMs = parse(event.startsAt);
  const endMs = parse(event.endsAt);
  if (!Number.isFinite(startMs) || !Number.isFinite(endMs) || endMs <= startMs) {
    throw new RangeError(`Event "${event.id}" requires valid startsAt and endsAt timestamps with endsAt after startsAt.`);
  }
  return { startMs, endMs, dateStr: formatDateToYYYYMMDD(new Date(startMs)) };
}

/**
 * Converts "HH:mm" time string to minutes from timeline startHour
 */
export function timeToMinutesFromStart(timeStr: string, startHour: number = 8): number {
  const [hStr, mStr] = timeStr.split(':');
  const h = parseInt(hStr, 10);
  const m = parseInt(mStr, 10) || 0;
  const effectiveHours = h < startHour && h === 0 ? 24 : h;
  return (effectiveHours - startHour) * 60 + m;
}

/**
 * Generates hour labels for the time column (e.g., ['08:00', '09:00', ..., '23:00'])
 * Each label corresponds directly to the start of that 1-hour interval row.
 */
export function generateDisplayHours(startHour: number = 8, endHour: number = 24): string[] {
  const hours: string[] = [];
  for (let h = startHour; h < endHour; h++) {
    const formatted = `${String(h).padStart(2, '0')}:00`;
    hours.push(formatted);
  }
  return hours;
}

/**
 * Calculates start and end timestamps and hours for a single GridDateRange
 */
export function getEffectiveRangeBounds(
  range: GridDateRange,
  defaultStartHour = 8,
  defaultEndHour = 24
): {
  start: Date;
  end: Date;
  startHour: number;
  endHour: number;
  hoursCount: number;
} {
  const start = new Date(range.startsAt);
  const effectiveStartHour =
    range.startHour !== undefined
      ? range.startHour
      : range.startsAt instanceof Date
      ? range.startsAt.getHours()
      : defaultStartHour;

  start.setHours(effectiveStartHour, 0, 0, 0);

  const effectiveEndHour =
    range.endHour !== undefined
      ? range.endHour
      : defaultEndHour;

  const end = new Date(range.endsAt || range.startsAt);
  if (effectiveEndHour === 24) {
    end.setHours(0, 0, 0, 0);
    // If startsAt and endsAt point to the same day, adding 1 day reaches 00:00:00 of the following day
    if (end.getDate() === start.getDate()) {
      end.setDate(end.getDate() + 1);
    }
  } else {
    end.setHours(effectiveEndHour, 0, 0, 0);
  }

  const hoursCount = Math.max(1, effectiveEndHour - effectiveStartHour);

  return {
    start,
    end,
    startHour: effectiveStartHour,
    endHour: effectiveEndHour,
    hoursCount,
  };
}

/**
 * Groups consecutive GridDateRanges into continuous date blocks.
 * If range B starts exactly when range A ends (e.g. 24:00 -> 00:00), they form one continuous group.
 * If there is a gap (e.g. ends at 17:00 and next starts at 09:00), a new group is created.
 */
export function groupContinuousDateRanges(
  ranges: GridDateRange[],
  defaultStartHour = 8,
  defaultEndHour = 24,
  timeSlotHeight = 48
): ContinuousDateGroup[] {
  if (ranges.length === 0) return [];

  const groups: ContinuousDateGroup[] = [];
  let currentGroupRanges: ContinuousDateRangeItem[] = [];
  let currentGroupStart: Date | null = null;
  let currentGroupEnd: Date | null = null;
  let accumulatedMinutes = 0;
  let accumulatedPx = 0;

  for (let i = 0; i < ranges.length; i++) {
    const r = ranges[i];
    const bounds = getEffectiveRangeBounds(r, defaultStartHour, defaultEndHour);
    const displayHours = generateDisplayHours(bounds.startHour, bounds.endHour);
    const dateStr = formatDateToYYYYMMDD(bounds.start);
    const rangeMinutes = (bounds.end.getTime() - bounds.start.getTime()) / (1000 * 60);
    const rangeHeightPx = displayHours.length * timeSlotHeight;

    const isContinuousWithPrev =
      currentGroupEnd !== null &&
      Math.abs(bounds.start.getTime() - currentGroupEnd.getTime()) <= 1000;

    if (!isContinuousWithPrev && currentGroupRanges.length > 0 && currentGroupStart && currentGroupEnd) {
      // Finalize previous continuous group
      groups.push({
        id: `group-${groups.length}-${formatDateToYYYYMMDD(currentGroupStart)}`,
        ranges: currentGroupRanges,
        start: currentGroupStart,
        end: currentGroupEnd,
        totalMinutes: accumulatedMinutes,
        totalHeightPx: accumulatedPx,
        isFirstGroup: groups.length === 0,
      });

      // Reset accumulators for next group
      currentGroupRanges = [];
      currentGroupStart = null;
      currentGroupEnd = null;
      accumulatedMinutes = 0;
      accumulatedPx = 0;
    }

    if (!currentGroupStart) {
      currentGroupStart = bounds.start;
    }
    currentGroupEnd = bounds.end;

    currentGroupRanges.push({
      range: r,
      start: bounds.start,
      end: bounds.end,
      startHour: bounds.startHour,
      endHour: bounds.endHour,
      displayHours,
      dateStr,
      offsetMinutesFromGroupStart: accumulatedMinutes,
      offsetPxFromGroupStart: accumulatedPx,
      heightPx: rangeHeightPx,
    });

    accumulatedMinutes += rangeMinutes;
    accumulatedPx += rangeHeightPx;
  }

  if (currentGroupRanges.length > 0 && currentGroupStart && currentGroupEnd) {
    groups.push({
      id: `group-${groups.length}-${formatDateToYYYYMMDD(currentGroupStart)}`,
      ranges: currentGroupRanges,
      start: currentGroupStart,
      end: currentGroupEnd,
      totalMinutes: accumulatedMinutes,
      totalHeightPx: accumulatedPx,
      isFirstGroup: groups.length === 0,
    });
  }

  return groups;
}

/**
 * Formats a Date object to YYYY-MM-DD
 */
export function formatDateToYYYYMMDD(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Formats a Date range header title, e.g. "MONDAY, OCT 23"
 */
export function formatDateRangeTitle(range: GridDateRange): string {
  if (range.label) return range.label;
  const d = range.startsAt;
  const weekday = d.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const monthName = d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  const day = d.getDate();
  return `${weekday}, ${monthName} ${day}`;
}

/**
 * Formats overflow duration into clean human-readable text (e.g. "1.3 hours more" or "1 hour more")
 */
export function formatOverflowDuration(minutes: number): string {
  const hours = minutes / 60;
  const roundedHours = Math.round(hours * 10) / 10;
  const formattedHours = roundedHours % 1 === 0 ? roundedHours.toFixed(0) : roundedHours.toFixed(1);
  const unit = formattedHours === '1' ? 'hour' : 'hours';
  return `${formattedHours} ${unit} more`;
}

/**
 * Calculates continuous layout positions and conflict overlaps for events in a column
 * across the entire continuous date group. Supports overnight & multi-day spans,
 * and detects when events extend beyond the end boundary of the timeline.
 */
export function computeGridContinuousColumnLayout<TData = any>(
  events: GridEvent<TData>[],
  resourceId: string,
  groupStart: Date,
  groupEnd: Date,
  pxPerMinute: number = 0.8
) {
  const groupStartMs = groupStart.getTime();
  const groupEndMs = groupEnd.getTime();

  // Find all events for this resource that overlap this continuous date group
  const matchingEvents = events
    .filter((e) => e.resourceId === resourceId)
    .map((e) => {
      const timestamps = getEventAbsoluteTimestamps(e);
      return {
        event: e,
        timestamps,
      };
    })
    .filter(({ timestamps }) => {
      // Overlaps if eventStart < groupEnd AND eventEnd > groupStart
      return timestamps.startMs < groupEndMs && timestamps.endMs > groupStartMs;
    });

  // Sort matching events by start time, then duration
  const sorted = matchingEvents.sort((a, b) => {
    if (a.timestamps.startMs !== b.timestamps.startMs) {
      return a.timestamps.startMs - b.timestamps.startMs;
    }
    const durA = a.timestamps.endMs - a.timestamps.startMs;
    const durB = b.timestamps.endMs - b.timestamps.startMs;
    return durB - durA;
  });

  return sorted.map(({ event, timestamps }, idx) => {
    const effectiveStartMs = Math.max(timestamps.startMs, groupStartMs);
    const effectiveEndMs = Math.min(timestamps.endMs, groupEndMs);

    const startMin = (effectiveStartMs - groupStartMs) / (1000 * 60);
    const endMin = (effectiveEndMs - groupStartMs) / (1000 * 60);

    const topPx = Math.max(0, startMin * pxPerMinute);
    const heightPx = Math.max(20, (endMin - startMin) * pxPerMinute);

    // Overflow boundary calculation
    const extendsBeyondEnd = timestamps.endMs > groupEndMs;
    const overflowMs = extendsBeyondEnd ? timestamps.endMs - groupEndMs : 0;
    const overflowMinutes = overflowMs > 0 ? Math.round(overflowMs / (1000 * 60)) : 0;
    const overflowHours = overflowMinutes > 0 ? Math.round((overflowMinutes / 60) * 10) / 10 : 0;
    const overflowText = overflowMinutes > 0 ? formatOverflowDuration(overflowMinutes) : undefined;

    // Overlap detection with other events in this continuous resource column
    const overlapping = sorted.filter((other, oIdx) => {
      if (oIdx === idx) return false;
      const otherStart = Math.max(other.timestamps.startMs, groupStartMs);
      const otherEnd = Math.min(other.timestamps.endMs, groupEndMs);
      return Math.max(effectiveStartMs, otherStart) < Math.min(effectiveEndMs, otherEnd);
    });

    const hasConflict = event.hasConflict ?? (overlapping.length > 0);
    let conflictOverlapSide: 'left' | 'right' | 'full' = 'full';

    if (overlapping.length > 0) {
      const isLaterInList = overlapping.some((other) => {
        return (
          other.timestamps.startMs < timestamps.startMs ||
          (other.timestamps.startMs === timestamps.startMs && other.event.id < event.id)
        );
      });
      conflictOverlapSide = isLaterInList ? 'right' : 'left';
    }

    return {
      event,
      layout: {
        topPx,
        heightPx,
        hasConflict,
        conflictOverlapSide,
        extendsBeyondEnd,
        overflowMinutes,
        overflowHours,
        overflowText,
      },
    };
  });
}

/**
 * Legacy single-date column layout helper
 */
export function computeGridColumnLayout<TData = any>(
  events: GridEvent<TData>[],
  targetDateStr: string,
  resourceId: string,
  startHour: number = 8,
  endHour: number = 24,
  pxPerMinute: number = 0.8
) {
  const start = new Date(`${targetDateStr}T00:00:00`);
  start.setHours(startHour);
  const end = new Date(`${targetDateStr}T00:00:00`);
  end.setHours(endHour);
  return computeGridContinuousColumnLayout(events, resourceId, start, end, pxPerMinute);
}

/**
 * Computes section-level layout for events across all resources in a continuous group.
 * Accurately handles:
 * 1. Single-resource events positioned in their respective resource column.
 * 2. Contiguous multi-resource events (e.g. Room 101 & Room 102) spanning seamlessly across columns.
 * 3. Discontinuous multi-resource events (e.g. Room 101 & Dr. Smith) rendering linked fragments
 *    with open dashed borders on the connecting sides.
 * 4. Conflict overlap positioning within shared resource columns.
 * 5. Out-of-range overflow boundary clipping and duration indicators.
 */
export function computeGridContinuousSectionLayout<TData = any, TMeta = any>(
  events: GridEvent<TData>[],
  resources: GridResource<TMeta>[],
  groupStart: Date,
  groupEnd: Date,
  timeColumnWidth: number = 80,
  resourceColumnWidth: number = 240,
  pxPerMinute: number = 0.8
): SectionEventLayoutItem<TData>[] {
  const groupStartMs = groupStart.getTime();
  const groupEndMs = groupEnd.getTime();

  // Normalize and filter events that overlap this continuous date group
  const eventEntries = events
    .map((e) => {
      const timestamps = getEventAbsoluteTimestamps(e);
      const requestedResourceIds: string[] =
        e.resourceIds && e.resourceIds.length > 0
          ? e.resourceIds
          : e.resourceId
          ? [e.resourceId]
          : [];

      // Find column indices for these resources in the current grid
      const matchedColumns: { id: string; colIdx: number; label: string }[] = [];
      requestedResourceIds.forEach((resId) => {
        const cIdx = resources.findIndex((r) => r.id === resId);
        if (cIdx !== -1) {
          matchedColumns.push({
            id: resId,
            colIdx: cIdx,
            label: resources[cIdx].label || resId,
          });
        }
      });

      matchedColumns.sort((a, b) => a.colIdx - b.colIdx);

      return {
        event: e,
        timestamps,
        matchedColumns,
        resourceIds: requestedResourceIds,
      };
    })
    .filter(({ timestamps, matchedColumns }) => {
      return (
        matchedColumns.length > 0 &&
        timestamps.startMs < groupEndMs &&
        timestamps.endMs > groupStartMs
      );
    });

  // Sort events by start time, then duration
  eventEntries.sort((a, b) => {
    if (a.timestamps.startMs !== b.timestamps.startMs) {
      return a.timestamps.startMs - b.timestamps.startMs;
    }
    const durA = a.timestamps.endMs - a.timestamps.startMs;
    const durB = b.timestamps.endMs - b.timestamps.startMs;
    return durB - durA;
  });

  const layoutItems: SectionEventLayoutItem<TData>[] = [];

  // Group matched column indices for each event into contiguous segments
  eventEntries.forEach(({ event, timestamps, matchedColumns, resourceIds }, eIdx) => {
    const effectiveStartMs = Math.max(timestamps.startMs, groupStartMs);
    const effectiveEndMs = Math.min(timestamps.endMs, groupEndMs);

    const startMin = (effectiveStartMs - groupStartMs) / (1000 * 60);
    const endMin = (effectiveEndMs - groupStartMs) / (1000 * 60);

    const topPx = Math.max(0, startMin * pxPerMinute);
    const heightPx = Math.max(20, (endMin - startMin) * pxPerMinute);

    // Overflow boundary calculation
    const extendsBeyondEnd = timestamps.endMs > groupEndMs;
    const overflowMs = extendsBeyondEnd ? timestamps.endMs - groupEndMs : 0;
    const overflowMinutes = overflowMs > 0 ? Math.round(overflowMs / (1000 * 60)) : 0;
    const overflowHours = overflowMinutes > 0 ? Math.round((overflowMinutes / 60) * 10) / 10 : 0;
    const overflowText = overflowMinutes > 0 ? formatOverflowDuration(overflowMinutes) : undefined;

    // Partition column indices into contiguous runs
    const segments: { startCol: number; count: number; colIndices: number[] }[] = [];
    let currentSeg: { startCol: number; count: number; colIndices: number[] } | null = null;

    matchedColumns.forEach(({ colIdx }) => {
      if (!currentSeg) {
        currentSeg = { startCol: colIdx, count: 1, colIndices: [colIdx] };
      } else if (colIdx === currentSeg.startCol + currentSeg.count) {
        currentSeg.count++;
        currentSeg.colIndices.push(colIdx);
      } else {
        segments.push(currentSeg);
        currentSeg = { startCol: colIdx, count: 1, colIndices: [colIdx] };
      }
    });
    if (currentSeg) {
      segments.push(currentSeg);
    }

    const isMultiResource = matchedColumns.length > 1;
    const connectedResourceNames = matchedColumns.map((c) => c.label);

    segments.forEach((seg, sIdx) => {
      const isFirstSeg = sIdx === 0;
      const isLastSeg = sIdx === segments.length - 1;
      const dashedBorderLeft = !isFirstSeg;
      const dashedBorderRight = !isLastSeg;
      const colSpan = seg.count;

      // Base left and width calculation
      // Grid has 1px gap between time column and resource columns
      const baseLeft = timeColumnWidth + 1 + seg.startCol * (resourceColumnWidth + 1);
      const baseWidth = seg.count * resourceColumnWidth + (seg.count - 1) * 1;

      // Check for overlap conflicts in any of this segment's columns
      const overlapping = eventEntries.filter((other, oIdx) => {
        if (oIdx === eIdx) return false;
        const otherStart = Math.max(other.timestamps.startMs, groupStartMs);
        const otherEnd = Math.min(other.timestamps.endMs, groupEndMs);
        const timeOverlaps = Math.max(effectiveStartMs, otherStart) < Math.min(effectiveEndMs, otherEnd);
        if (!timeOverlaps) return false;
        return other.matchedColumns.some((mc) => seg.colIndices.includes(mc.colIdx));
      });

      const hasConflict = event.hasConflict ?? (overlapping.length > 0);
      let conflictOverlapSide: 'left' | 'right' | 'full' = 'full';

      if (overlapping.length > 0) {
        const isLaterInList = overlapping.some((other) => {
          return (
            other.timestamps.startMs < timestamps.startMs ||
            (other.timestamps.startMs === timestamps.startMs && other.event.id < event.id)
          );
        });
        conflictOverlapSide = isLaterInList ? 'right' : 'left';
      }

      let leftPx = baseLeft + 2;
      let widthPx = baseWidth - 4;

      if (hasConflict) {
        if (conflictOverlapSide === 'left') {
          widthPx = Math.max(40, Math.floor((baseWidth - 6) / 2));
        } else if (conflictOverlapSide === 'right') {
          leftPx = baseLeft + Math.floor(baseWidth / 2) + 2;
          widthPx = Math.max(40, Math.floor((baseWidth - 6) / 2));
        }
      }

      layoutItems.push({
        event,
        segmentKey: `${event.id}-seg-${sIdx}-${seg.startCol}`,
        layout: {
          topPx,
          heightPx,
          leftPx,
          widthPx,
          hasConflict,
          conflictOverlapSide,
          extendsBeyondEnd,
          overflowMinutes,
          overflowHours,
          overflowText,
          isMultiResource,
          colSpan,
          segmentIndex: sIdx,
          totalSegments: segments.length,
          dashedBorderLeft,
          dashedBorderRight,
          resourceIds,
          connectedResourceNames,
        },
      });
    });
  });

  return layoutItems;
}

/**
 * Computes section-level layout for events across all resources in a single discrete date range.
 */
export function computeGridDiscreteSectionLayout<TData = any, TMeta = any>(
  events: GridEvent<TData>[],
  resources: GridResource<TMeta>[],
  dateStr: string,
  startHour: number = 8,
  endHour: number = 24,
  timeColumnWidth: number = 80,
  resourceColumnWidth: number = 240,
  pxPerMinute: number = 0.8
): SectionEventLayoutItem<TData>[] {
  const sectionStart = new Date(`${dateStr}T00:00:00`);
  sectionStart.setHours(startHour);
  const sectionEnd = new Date(`${dateStr}T00:00:00`);
  sectionEnd.setHours(endHour);
  const maxMinutes = (sectionEnd.getTime() - sectionStart.getTime()) / 60000;

  // Normalize and filter events that match this date and at least one resource
  const eventEntries = events
    .map((e) => {
      const { startMs, endMs } = getEventAbsoluteTimestamps(e);
      const requestedResourceIds: string[] =
        e.resourceIds && e.resourceIds.length > 0
          ? e.resourceIds
          : e.resourceId
          ? [e.resourceId]
          : [];

      const matchedColumns: { id: string; colIdx: number; label: string }[] = [];
      requestedResourceIds.forEach((resId) => {
        const cIdx = resources.findIndex((r) => r.id === resId);
        if (cIdx !== -1) {
          matchedColumns.push({
            id: resId,
            colIdx: cIdx,
            label: resources[cIdx].label || resId,
          });
        }
      });

      matchedColumns.sort((a, b) => a.colIdx - b.colIdx);

      const startMin = (startMs - sectionStart.getTime()) / 60000;
      const endMin = (endMs - sectionStart.getTime()) / 60000;

      return {
        event: e,
        startMin,
        endMin,
        matchedColumns,
        resourceIds: requestedResourceIds,
      };
    })
    .filter(({ startMin, endMin, matchedColumns }) => {
      return matchedColumns.length > 0 && startMin < maxMinutes && endMin > 0;
    });

  // Sort by start time, then duration
  eventEntries.sort((a, b) => {
    if (a.startMin !== b.startMin) return a.startMin - b.startMin;
    const durA = a.endMin - a.startMin;
    const durB = b.endMin - b.startMin;
    return durB - durA;
  });

  const layoutItems: SectionEventLayoutItem<TData>[] = [];

  eventEntries.forEach(({ event, startMin, endMin, matchedColumns, resourceIds }, eIdx) => {
    const effectiveEndMin = Math.min(endMin, maxMinutes);
    const topPx = Math.max(0, startMin * pxPerMinute);
    const heightPx = Math.max(20, (effectiveEndMin - Math.max(0, startMin)) * pxPerMinute);

    const extendsBeyondEnd = endMin > maxMinutes;
    const overflowMinutes = extendsBeyondEnd ? endMin - maxMinutes : 0;
    const overflowHours = overflowMinutes > 0 ? Math.round((overflowMinutes / 60) * 10) / 10 : 0;
    const overflowText = overflowMinutes > 0 ? formatOverflowDuration(overflowMinutes) : undefined;

    // Partition column indices into contiguous runs
    const segments: { startCol: number; count: number; colIndices: number[] }[] = [];
    let currentSeg: { startCol: number; count: number; colIndices: number[] } | null = null;

    matchedColumns.forEach(({ colIdx }) => {
      if (!currentSeg) {
        currentSeg = { startCol: colIdx, count: 1, colIndices: [colIdx] };
      } else if (colIdx === currentSeg.startCol + currentSeg.count) {
        currentSeg.count++;
        currentSeg.colIndices.push(colIdx);
      } else {
        segments.push(currentSeg);
        currentSeg = { startCol: colIdx, count: 1, colIndices: [colIdx] };
      }
    });
    if (currentSeg) {
      segments.push(currentSeg);
    }

    const isMultiResource = matchedColumns.length > 1;
    const connectedResourceNames = matchedColumns.map((c) => c.label);

    segments.forEach((seg, sIdx) => {
      const isFirstSeg = sIdx === 0;
      const isLastSeg = sIdx === segments.length - 1;
      const dashedBorderLeft = !isFirstSeg;
      const dashedBorderRight = !isLastSeg;
      const colSpan = seg.count;

      const baseLeft = timeColumnWidth + 1 + seg.startCol * (resourceColumnWidth + 1);
      const baseWidth = seg.count * resourceColumnWidth + (seg.count - 1) * 1;

      // Overlap detection
      const overlapping = eventEntries.filter((other, oIdx) => {
        if (oIdx === eIdx) return false;
        const timeOverlaps = Math.max(startMin, other.startMin) < Math.min(endMin, other.endMin);
        if (!timeOverlaps) return false;
        return other.matchedColumns.some((mc) => seg.colIndices.includes(mc.colIdx));
      });

      const hasConflict = event.hasConflict ?? (overlapping.length > 0);
      let conflictOverlapSide: 'left' | 'right' | 'full' = 'full';

      if (overlapping.length > 0) {
        const isLaterInList = overlapping.some((other) => {
          return other.startMin < startMin || (other.startMin === startMin && other.event.id < event.id);
        });
        conflictOverlapSide = isLaterInList ? 'right' : 'left';
      }

      let leftPx = baseLeft + 2;
      let widthPx = baseWidth - 4;

      if (hasConflict) {
        if (conflictOverlapSide === 'left') {
          widthPx = Math.max(40, Math.floor((baseWidth - 6) / 2));
        } else if (conflictOverlapSide === 'right') {
          leftPx = baseLeft + Math.floor(baseWidth / 2) + 2;
          widthPx = Math.max(40, Math.floor((baseWidth - 6) / 2));
        }
      }

      layoutItems.push({
        event,
        segmentKey: `${event.id}-seg-${sIdx}-${seg.startCol}`,
        layout: {
          topPx,
          heightPx,
          leftPx,
          widthPx,
          hasConflict,
          conflictOverlapSide,
          extendsBeyondEnd,
          overflowMinutes,
          overflowHours,
          overflowText,
          isMultiResource,
          colSpan,
          segmentIndex: sIdx,
          totalSegments: segments.length,
          dashedBorderLeft,
          dashedBorderRight,
          resourceIds,
          connectedResourceNames,
        },
      });
    });
  });

  return layoutItems;
}
