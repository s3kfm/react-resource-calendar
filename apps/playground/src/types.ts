export type ResourceType = 'room' | 'practitioner' | 'equipment' | 'staff';

export interface Resource {
  id: string;
  name: string;
  type: ResourceType;
  category?: string;
  location?: string;
  colorTheme?: 'blue' | 'teal' | 'amber' | 'purple';
  active: boolean;
  order: number;
}

export type EventCategory = 'surgery' | 'checkup' | 'consultation' | 'admin' | 'meeting' | 'emergency' | 'booking';

export interface ScheduledEvent {
  id: string;
  title: string;
  startsAt: string; // ISO timestamp
  endsAt: string; // ISO timestamp
  resourceIds: string[];
  linkedResourceId?: string; // Optional linked resource (e.g. 'dr-smith' or 'rm-101')
  patient?: string;
  practitioner?: string;
  roomName?: string;
  type: EventCategory;
  colorTheme: 'blue' | 'teal' | 'amber' | 'purple';
  notes?: string;
  status?: 'confirmed' | 'pending' | 'in-progress' | 'completed';
}

export interface ConflictItem {
  id: string;
  date: string;
  resourceId: string;
  resourceName: string;
  eventA: ScheduledEvent;
  eventB: ScheduledEvent;
  overlapDurationMinutes: number;
  message: string;
}

export interface LayoutEvent extends ScheduledEvent {
  topPx: number;
  heightPx: number;
  hasConflict: boolean;
  conflictOverlapSide?: 'left' | 'right' | 'full';
  conflictId?: string;
}
