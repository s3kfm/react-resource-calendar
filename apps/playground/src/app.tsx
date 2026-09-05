import React, { useState, useMemo } from 'react';
import { Settings2, Palette } from 'lucide-react';
import { INITIAL_RESOURCES, INITIAL_EVENTS } from './data/initial-data';
import { Resource, ScheduledEvent } from './types';
import { detectAllConflicts } from './utils/time-utils';
import {
  ResourceCalendar,
  GridResource,
  GridEvent,
  GridDateRange,
  GridSlotClickInfo,
} from 'react-resource-calendar';
import { EventModal } from './components/event-modal';
import { ConflictResolverModal } from './components/conflict-resolver-modal';
import { ResourceManagementModal } from './components/resource-management-modal';

export default function App() {
  // Theme state
  const [selectedTheme, setSelectedTheme] = useState('default');

  // Data State: Resources & Scheduled Events
  const [resources, setResources] = useState<Resource[]>(INITIAL_RESOURCES);
  const [events, setEvents] = useState<ScheduledEvent[]>(INITIAL_EVENTS);
  const [selectedManageResourceId, setSelectedManageResourceId] = useState<string | null>(null);

  // Interaction Modals State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Partial<ScheduledEvent> | null>(null);
  const [isConflictResolverOpen, setIsConflictResolverOpen] = useState(false);
  const [isResourceManageOpen, setIsResourceManageOpen] = useState(false);

  // Date ranges mode: 3 sequential date windows
  const dateRanges = useMemo<GridDateRange[]>(() => {
    return [
      {
        id: 'range-2023-10-23',
        startsAt: new Date(2023, 9, 23, 8, 0, 0),
        endsAt: new Date(2023, 9, 23, 24, 0, 0),
        label: 'MONDAY, OCT 23',
      },
      {
        id: 'range-2023-10-24',
        startsAt: new Date(2023, 9, 24, 0, 0, 0),
        endsAt: new Date(2023, 9, 24, 24, 0, 0),
        label: 'TUESDAY, OCT 24',
      },
      {
        id: 'range-2023-10-25',
        startsAt: new Date(2023, 9, 25, 8, 0, 0),
        endsAt: new Date(2023, 9, 25, 24, 0, 0),
        label: 'WEDNESDAY, OCT 25',
      },
    ];
  }, []);

  // Compute conflicts for the business logic layer
  const conflicts = useMemo(() => {
    return detectAllConflicts(events, resources);
  }, [events, resources]);

  // Transform active resources into GridResource format for ResourceCalendar
  const gridResources = useMemo<GridResource[]>(() => {
    return resources
      .filter((res) => res.active !== false)
      .map((res) => ({
        id: res.id,
        label: res.name,
        subTitle: res.category || (res.type === 'room' ? 'Operating Suite' : 'Specialist'),
        colorTheme: res.colorTheme,
      }));
  }, [resources]);

  // Transform scheduled events into GridEvent format for ResourceCalendar
  const gridEvents = useMemo<GridEvent<ScheduledEvent>[]>(() => {
    return events.map((evt) => ({
      id: evt.id,
      title: evt.title,
      resourceIds: evt.resourceIds,
      startsAt: evt.startsAt,
      endsAt: evt.endsAt,
      subTitle: evt.patient || evt.practitioner,
      colorTheme: evt.colorTheme,
      data: evt,
    }));
  }, [events]);

  // Grid Event Handlers
  const handleGridClick = (info: GridSlotClickInfo) => {
    setEditingEvent({
      resourceIds: [info.resourceId],
      startsAt: new Date(`${info.dateStr}T${info.time}:00`).toISOString(),
      endsAt: new Date(new Date(`${info.dateStr}T${info.time}:00`).getTime() + 3600000).toISOString(),
    });
    setIsEventModalOpen(true);
  };

  const handleEventClick = (gridEvent: GridEvent<ScheduledEvent>) => {
    const raw = gridEvent.data || events.find((e) => e.id === gridEvent.id);
    if (raw) {
      setEditingEvent(raw);
      setIsEventModalOpen(true);
    }
  };

  // Clicking on a room/resource header opens the resource management & delete modal
  const handleResourceHeaderClick = (resource: GridResource) => {
    setSelectedManageResourceId(resource.id);
    setIsResourceManageOpen(true);
  };

  // Manage resources toolbar button click handler
  const handleManageResourcesClick = () => {
    setSelectedManageResourceId(null);
    setIsResourceManageOpen(true);
  };

  // CRUD Event Handlers
  const handleSaveEvent = (savedEvent: ScheduledEvent) => {
    setEvents((prev) => {
      const exists = prev.some((e) => e.id === savedEvent.id);
      if (exists) {
        return prev.map((e) => (e.id === savedEvent.id ? savedEvent : e));
      }
      return [...prev, savedEvent];
    });
  };

  const handleDeleteEvent = (eventId: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== eventId));
  };

  const handleResolveByShiftTime = (eventId: string, startsAt: string, endsAt: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? { ...e, startsAt, endsAt, status: 'confirmed' }
          : e
      )
    );
  };

  const handleResolveByReassignResource = (eventId: string, oldResourceId: string, newResourceId: string) => {
    setEvents((prev) =>
      prev.map((e) =>
        e.id === eventId
          ? { ...e, resourceIds: [...new Set(e.resourceIds.map(id => id === oldResourceId ? newResourceId : id))], status: 'confirmed' }
          : e
      )
    );
  };

  const handleToggleResource = (id: string) => {
    setResources((prev) =>
      prev.map((r) => (r.id === id ? { ...r, active: !r.active } : r))
    );
  };

  const handleAddResource = (newResource: Resource) => {
    setResources((prev) => [...prev, newResource]);
  };

  const handleDeleteResource = (resourceId: string) => {
    setResources((prev) => prev.filter((r) => r.id !== resourceId));
    // Remove appointments assigned to this deleted resource
    setEvents((prev) => prev.filter((e) => !e.resourceIds.includes(resourceId)));
  };

  return (
    <div className="bg-[#f7f9fb] text-[#191c1e] h-screen flex flex-col font-sans overflow-hidden select-none">
      {/* Toolbar above the calendar */}
      <div className="shrink-0 flex items-center border-b border-[#e0e3e5] bg-white">
        {/* Theme Switcher dropdown */}
        <div className="flex items-center gap-1 px-2.5 py-1.5 text-xs text-[#555869] border-r border-[#e0e3e5]/60">
          <Palette className="w-3.5 h-3.5 text-[#555869]" />
          <select
            id="theme-select"
            aria-label="Select grid theme preset"
            value={selectedTheme}
            onChange={(e) => setSelectedTheme(e.target.value)}
            className="bg-transparent text-xs font-semibold text-[#191c1e] cursor-pointer focus:outline-none"
          >
            <option value="default">Default</option>
            <option value="warm">Warm Neutral</option>
            <option value="clinical">Clinical Clean</option>
            <option value="dark">Dark Charcoal</option>
          </select>
        </div>

        {/* Manage Columns Button */}
        <div
          id="grid-btn-manage-resources"
          onClick={handleManageResourcesClick}
          className="flex items-center justify-center gap-1.5 text-[#555869] hover:text-[#004ac6] hover:bg-[#eceef0] cursor-pointer text-xs font-semibold py-1.5 px-3 transition-colors select-none"
          title="Manage and delete resources"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>Columns</span>
        </div>
      </div>

      {/* React Resource Calendar (Library Component) */}
      <main className="flex-1 overflow-hidden flex flex-col bg-[#f7f9fb] relative">
        <ResourceCalendar
          theme={selectedTheme}
          dateRanges={dateRanges}
          resources={gridResources}
          events={gridEvents}
          onResourceHeaderClick={handleResourceHeaderClick}
          onGridClick={handleGridClick}
          onEventClick={handleEventClick}
          timeSlotHeight={48}
          timeColumnWidth={80}
          resourceColumnWidth={180}
          />
      </main>

      {/* Data & Interaction Modals Layer */}
      <EventModal
        isOpen={isEventModalOpen}
        onClose={() => {
          setIsEventModalOpen(false);
          setEditingEvent(null);
        }}
        onSave={handleSaveEvent}
        onDelete={handleDeleteEvent}
        initialEvent={editingEvent}
        resources={resources}
        existingEvents={events}
      />

      <ConflictResolverModal
        isOpen={isConflictResolverOpen}
        onClose={() => setIsConflictResolverOpen(false)}
        conflicts={conflicts}
        resources={resources}
        onResolveByShiftTime={handleResolveByShiftTime}
        onResolveByReassignResource={handleResolveByReassignResource}
        onSelectEventToEdit={(evt) => {
          setEditingEvent(evt);
          setIsEventModalOpen(true);
        }}
      />

      <ResourceManagementModal
        isOpen={isResourceManageOpen}
        onClose={() => {
          setIsResourceManageOpen(false);
          setSelectedManageResourceId(null);
        }}
        resources={resources}
        selectedResourceId={selectedManageResourceId}
        events={events}
        onDeleteResource={handleDeleteResource}
        onToggleResource={handleToggleResource}
        onAddResource={handleAddResource}
      />
    </div>
  );
}
