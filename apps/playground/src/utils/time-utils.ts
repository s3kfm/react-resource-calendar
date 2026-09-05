import { ConflictItem, LayoutEvent, Resource, ScheduledEvent } from '../types';

export const TIMELINE_START_HOUR = 8; // 08:00
export const TIMELINE_END_HOUR = 24; // 24:00 (00:00 midnight)
export const TIME_SLOT_HEIGHT = 48; // 48px per 60 minutes
export const PX_PER_MINUTE = TIME_SLOT_HEIGHT / 60; // 0.8 px / minute

export const DISPLAY_HOURS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
  '19:00',
  '20:00',
  '21:00',
  '22:00',
  '23:00',
  '00:00',
];

/**
 * Converts "HH:mm" time string to minutes from timeline start (08:00)
 */
export function timeStringToMinutes(timeStr: string): number {
  const [hoursStr, minutesStr] = timeStr.split(':');
  const hours = parseInt(hoursStr, 10);
  const minutes = parseInt(minutesStr, 10) || 0;
  
  // Normalize 00:00 as midnight (24:00) if it's the end of day
  const effectiveHours = hours < TIMELINE_START_HOUR && hours === 0 ? 24 : hours;
  return (effectiveHours - TIMELINE_START_HOUR) * 60 + minutes;
}

/**
 * Converts minutes from timeline start to "HH:mm"
 */
export function minutesToTimeString(minutesFromStart: number): string {
  const totalMinutes = TIMELINE_START_HOUR * 60 + minutesFromStart;
  const hours = Math.floor(totalMinutes / 60) % 24;
  const mins = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
}

/**
 * Checks if two events overlap in time
 */
export function doEventsOverlap(a: ScheduledEvent, b: ScheduledEvent): boolean {
  if (a.date !== b.date) return false;
  if (a.id === b.id) return false;
  
  const startA = timeStringToMinutes(a.startTime);
  const endA = timeStringToMinutes(a.endTime);
  const startB = timeStringToMinutes(b.startTime);
  const endB = timeStringToMinutes(b.endTime);

  return Math.max(startA, startB) < Math.min(endA, endB);
}

/**
 * Detects all conflicts across events for resources and practitioners
 */
export function detectAllConflicts(
  events: ScheduledEvent[],
  resources: Resource[]
): ConflictItem[] {
  const conflicts: ConflictItem[] = [];
  const resourceMap = new Map(resources.map((r) => [r.id, r.name]));

  // Group events by date and resource
  const dateResourceGroups = new Map<string, ScheduledEvent[]>();

  events.forEach((evt) => {
    const key = `${evt.date}_${evt.resourceId}`;
    if (!dateResourceGroups.has(key)) {
      dateResourceGroups.set(key, []);
    }
    dateResourceGroups.get(key)!.push(evt);
  });

  dateResourceGroups.forEach((groupEvents, key) => {
    const [date, resourceId] = key.split('_');
    const resourceName = resourceMap.get(resourceId) || resourceId;

    for (let i = 0; i < groupEvents.length; i++) {
      for (let j = i + 1; j < groupEvents.length; j++) {
        const evA = groupEvents[i];
        const evB = groupEvents[j];

        if (doEventsOverlap(evA, evB)) {
          const startA = timeStringToMinutes(evA.startTime);
          const endA = timeStringToMinutes(evA.endTime);
          const startB = timeStringToMinutes(evB.startTime);
          const endB = timeStringToMinutes(evB.endTime);

          const overlapStart = Math.max(startA, startB);
          const overlapEnd = Math.min(endA, endB);
          const overlapDurationMinutes = overlapEnd - overlapStart;

          conflicts.push({
            id: `conflict_${evA.id}_${evB.id}`,
            date,
            resourceId,
            resourceName,
            eventA: evA,
            eventB: evB,
            overlapDurationMinutes,
            message: `${resourceName}: "${evA.title}" (${evA.startTime}-${evA.endTime}) overlaps with "${evB.title}" (${evB.startTime}-${evB.endTime}) by ${overlapDurationMinutes}m`,
          });
        }
      }
    }
  });

  return conflicts;
}

/**
 * Computes pixel geometry and conflict layout side offsets for events on a specific day/resource
 */
export function computeLayoutEvents(
  events: ScheduledEvent[],
  date: string,
  resourceId: string
): LayoutEvent[] {
  const dayResourceEvents = events.filter(
    (e) => e.date === date && e.resourceId === resourceId
  );

  // Sort by start time, then duration
  const sorted = [...dayResourceEvents].sort((a, b) => {
    const startDiff = timeStringToMinutes(a.startTime) - timeStringToMinutes(b.startTime);
    if (startDiff !== 0) return startDiff;
    return (
      timeStringToMinutes(b.endTime) -
      timeStringToMinutes(b.startTime) -
      (timeStringToMinutes(a.endTime) - timeStringToMinutes(a.startTime))
    );
  });

  const layoutList: LayoutEvent[] = [];

  for (let i = 0; i < sorted.length; i++) {
    const current = sorted[i];
    const startMin = timeStringToMinutes(current.startTime);
    const endMin = timeStringToMinutes(current.endTime);
    const topPx = Math.max(0, startMin * PX_PER_MINUTE);
    const heightPx = Math.max(24, (endMin - startMin) * PX_PER_MINUTE);

    // Check overlaps with other events in the same column
    const overlapping = sorted.filter((other, idx) => idx !== i && doEventsOverlap(current, other));

    let conflictOverlapSide: 'left' | 'right' | 'full' = 'full';
    let hasConflict = false;
    let conflictId: string | undefined;

    if (overlapping.length > 0) {
      hasConflict = true;
      conflictId = `conflict_${current.id}`;
      // Earlier event sits on left, subsequent overlapping sits on right
      const earlier = overlapping.some(
        (o) => timeStringToMinutes(o.startTime) < startMin || (timeStringToMinutes(o.startTime) === startMin && o.id < current.id)
      );
      conflictOverlapSide = earlier ? 'right' : 'left';
    }

    layoutList.push({
      ...current,
      topPx,
      heightPx,
      hasConflict,
      conflictOverlapSide,
      conflictId,
    });
  }

  return layoutList;
}

export function formatDayHeader(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  return `${weekday}, ${monthName} ${day}`;
}
