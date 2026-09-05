import { ConflictItem, Resource, ScheduledEvent } from '../types';

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
  if (a.id === b.id) return false;
  
  const startA = new Date(a.startsAt).getTime();
  const endA = new Date(a.endsAt).getTime();
  const startB = new Date(b.startsAt).getTime();
  const endB = new Date(b.endsAt).getTime();

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

  // Group by resource so overnight overlaps are included.
  const dateResourceGroups = new Map<string, ScheduledEvent[]>();

  events.forEach((evt) => {
    const key = evt.resourceId;
    if (!dateResourceGroups.has(key)) {
      dateResourceGroups.set(key, []);
    }
    dateResourceGroups.get(key)!.push(evt);
  });

  dateResourceGroups.forEach((groupEvents, key) => {
    const resourceId = key;
    const resourceName = resourceMap.get(resourceId) || resourceId;

    for (let i = 0; i < groupEvents.length; i++) {
      for (let j = i + 1; j < groupEvents.length; j++) {
        const evA = groupEvents[i];
        const evB = groupEvents[j];

        if (doEventsOverlap(evA, evB)) {
          const startA = new Date(evA.startsAt).getTime();
          const endA = new Date(evA.endsAt).getTime();
          const startB = new Date(evB.startsAt).getTime();
          const endB = new Date(evB.endsAt).getTime();

          const overlapStart = Math.max(startA, startB);
          const overlapEnd = Math.min(endA, endB);
          const overlapDurationMinutes = (overlapEnd - overlapStart) / 60000;

          conflicts.push({
            id: `conflict_${evA.id}_${evB.id}`,
            date: toDateTimeInput(new Date(overlapStart).toISOString()).slice(0, 10),
            resourceId,
            resourceName,
            eventA: evA,
            eventB: evB,
            overlapDurationMinutes,
            message: `${resourceName}: "${evA.title}" (${formatTime(evA.startsAt)}-${formatTime(evA.endsAt)}) overlaps with "${evB.title}" (${formatTime(evB.startsAt)}-${formatTime(evB.endsAt)}) by ${overlapDurationMinutes}m`,
          });
        }
      }
    }
  });

  return conflicts;
}

export function formatDayHeader(dateStr: string): string {
  const [year, month, day] = dateStr.split('-').map(Number);
  const dateObj = new Date(year, month - 1, day);
  const weekday = dateObj.toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
  const monthName = dateObj.toLocaleDateString('en-US', { month: 'short' }).toUpperCase();
  return `${weekday}, ${monthName} ${day}`;
}

export function toDateTimeInput(value: string): string {
  const date = new Date(value);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

export function formatTime(value: string): string {
  return toDateTimeInput(value).slice(11);
}
