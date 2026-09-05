import React, { useState, useEffect } from 'react';
import { X, Clock, Calendar, AlertTriangle, Check, Trash2, User, MapPin } from 'lucide-react';
import { EventCategory, Resource, ScheduledEvent } from '../types';
import { doEventsOverlap, toDateTimeInput, formatTime } from '../utils/time-utils';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: ScheduledEvent) => void;
  onDelete?: (eventId: string) => void;
  initialEvent?: Partial<ScheduledEvent> | null;
  resources: Resource[];
  existingEvents: ScheduledEvent[];
}

export const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialEvent,
  resources,
  existingEvents,
}) => {
  const [title, setTitle] = useState('');
  const [startsAt, setStartsAt] = useState('2023-10-23T09:00');
  const [endsAt, setEndsAt] = useState('2023-10-23T10:00');
  const [selectedResourceIds, setSelectedResourceIds] = useState<string[]>(['rm-101']);
  const [patient, setPatient] = useState('');
  const [type, setType] = useState<EventCategory>('checkup');
  const [colorTheme, setColorTheme] = useState<'blue' | 'teal' | 'amber' | 'purple'>('blue');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (initialEvent) {
      setTitle(initialEvent.title || '');
      setStartsAt(initialEvent.startsAt ? toDateTimeInput(initialEvent.startsAt) : '2023-10-23T09:00');
      setEndsAt(initialEvent.endsAt ? toDateTimeInput(initialEvent.endsAt) : '2023-10-23T10:00');
      const resList =
        initialEvent.resourceIds && initialEvent.resourceIds.length > 0
          ? initialEvent.resourceIds
          : [resources[0]?.id || 'rm-101'];
      setSelectedResourceIds(resList);
      setPatient(initialEvent.patient || '');
      setType(initialEvent.type || 'checkup');
      setColorTheme(initialEvent.colorTheme || 'blue');
      setNotes(initialEvent.notes || '');
    } else {
      setTitle('');
      setStartsAt('2023-10-23T09:00');
      setEndsAt('2023-10-23T10:00');
      setSelectedResourceIds([resources[0]?.id || 'rm-101']);
      setPatient('');
      setType('checkup');
      setColorTheme('blue');
      setNotes('');
    }
  }, [initialEvent, isOpen, resources]);

  if (!isOpen) return null;

  const toggleResource = (rId: string) => {
    if (selectedResourceIds.includes(rId)) {
      if (selectedResourceIds.length > 1) {
        setSelectedResourceIds(selectedResourceIds.filter((id) => id !== rId));
      }
    } else {
      setSelectedResourceIds([...selectedResourceIds, rId]);
    }
  };

  // Check live conflict
  const simulatedEvent: ScheduledEvent = {
    id: initialEvent?.id || 'temp-id',
    title,
    startsAt,
    endsAt,
    resourceIds: selectedResourceIds,
    type,
    colorTheme,
  };

  const conflictingEvents = existingEvents.filter((e) => {
    if (e.id === initialEvent?.id) return false;
    const eResources = e.resourceIds;
    const sharesResource = selectedResourceIds.some((rId) => eResources.includes(rId));
    return sharesResource && doEventsOverlap(simulatedEvent, e);
  });
  const hasLiveConflict = conflictingEvents.length > 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || selectedResourceIds.length === 0) return;

    if (!Number.isFinite(new Date(startsAt).getTime()) || !Number.isFinite(new Date(endsAt).getTime()) || new Date(endsAt) <= new Date(startsAt)) {
      window.alert('End must be after start.');
      return;
    }

    const eventToSave: ScheduledEvent = {
      id: initialEvent?.id || `evt_${Date.now()}`,
      title: title.trim(),
      startsAt,
      endsAt,
      resourceIds: selectedResourceIds,
      patient: patient.trim() || undefined,
      type,
      colorTheme,
      notes: notes.trim() || undefined,
      status: hasLiveConflict ? 'pending' : 'confirmed',
    };

    onSave(eventToSave);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-[#c3c6d7] w-full max-w-lg overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#f2f4f6] border-b border-[#e0e3e5]">
          <h2 className="font-semibold text-[#191c1e] text-base">
            {initialEvent?.id ? 'Edit Scheduled Booking' : 'New Schedule Booking'}
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#737686] hover:text-[#191c1e] hover:bg-[#e0e3e5] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Live Conflict Alert Banner */}
        {hasLiveConflict && (
          <div className="bg-[#ffdad6] border-b border-[#ba1a1a]/30 px-5 py-2.5 flex items-start gap-2 text-[#ba1a1a]">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <div className="text-xs">
              <span className="font-bold">Conflict Warning:</span> This slot overlaps with{' '}
              {conflictingEvents.map((c) => `"${c.title}" (${formatTime(c.startsAt)} - ${formatTime(c.endsAt)})`).join(', ')}.
            </div>
          </div>
        )}

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-xs font-semibold text-[#434655] mb-1">
              Event / Procedure Title *
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Appendectomy, Consultation, Routine Checkup"
              className="w-full px-3 py-1.5 text-sm bg-[#f7f9fb] border border-[#c3c6d7] rounded focus:outline-none focus:ring-2 focus:ring-[#004ac6] focus:bg-white text-[#191c1e]"
            />
          </div>

          {/* Type and Color */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#434655] mb-1">
                Category
              </label>
              <select
                value={type}
                onChange={(e) => {
                  const val = e.target.value as EventCategory;
                  setType(val);
                  if (val === 'surgery') setColorTheme('blue');
                  else if (val === 'checkup' || val === 'admin') setColorTheme('teal');
                  else if (val === 'consultation') setColorTheme('amber');
                }}
                className="w-full px-3 py-1.5 text-sm bg-[#f7f9fb] border border-[#c3c6d7] rounded focus:outline-none focus:ring-2 focus:ring-[#004ac6] focus:bg-white text-[#191c1e]"
              >
                <option value="surgery">Surgery / Operating</option>
                <option value="consultation">Consultation</option>
                <option value="checkup">Routine Checkup</option>
                <option value="admin">Admin Block</option>
                <option value="meeting">Staff Meeting</option>
                <option value="booking">Block Booking</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#434655] mb-1">
                Card Theme
              </label>
              <div className="flex items-center gap-2 pt-1">
                {(['blue', 'teal', 'amber', 'purple'] as const).map((col) => (
                  <button
                    key={col}
                    type="button"
                    onClick={() => setColorTheme(col)}
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                      col === 'blue'
                        ? 'bg-[#004ac6]'
                        : col === 'teal'
                        ? 'bg-[#006a61]'
                        : col === 'amber'
                        ? 'bg-[#a65900]'
                        : 'bg-[#6b21a8]'
                    } ${colorTheme === col ? 'border-[#191c1e] scale-110' : 'border-transparent opacity-80'}`}
                  >
                    {colorTheme === col && <Check className="w-3 h-3 text-white" />}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Event timestamps */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#434655] mb-1">
                Starts at
              </label>
              <input
                type="datetime-local"
                step="900"
                required
                value={startsAt}
                onChange={(e) => setStartsAt(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-[#f7f9fb] border border-[#c3c6d7] rounded focus:outline-none focus:ring-2 focus:ring-[#004ac6] text-[#191c1e] font-data-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#434655] mb-1">
                Ends at
              </label>
              <input
                type="datetime-local"
                step="900"
                required
                value={endsAt}
                onChange={(e) => setEndsAt(e.target.value)}
                className="w-full px-2 py-1.5 text-xs bg-[#f7f9fb] border border-[#c3c6d7] rounded focus:outline-none focus:ring-2 focus:ring-[#004ac6] text-[#191c1e] font-data-mono"
              />
            </div>
          </div>

          {/* Assigned Rooms & Practitioners (Multi-Resource Support) */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[#434655]">
                Assigned Rooms / Practitioners ({selectedResourceIds.length}) *
              </label>
              {selectedResourceIds.length > 1 && (
                <span className="text-[10px] text-[#004ac6] font-medium bg-[#dbe1ff] px-1.5 py-0.5 rounded">
                  Multi-Resource Event
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5 p-2 bg-[#f7f9fb] border border-[#c3c6d7] rounded max-h-32 overflow-y-auto">
              {resources.map((r) => {
                const isSelected = selectedResourceIds.includes(r.id);
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => toggleResource(r.id)}
                    className={`px-2.5 py-1 text-xs rounded font-medium flex items-center gap-1.5 transition-all ${
                      isSelected
                        ? 'bg-[#004ac6] text-white shadow-xs'
                        : 'bg-white text-[#434655] border border-[#c3c6d7] hover:bg-[#e0e3e5]'
                    }`}
                  >
                    <span>{r.name}</span>
                    <span
                      className={`text-[9px] px-1 py-0.2 rounded uppercase ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#e0e3e5] text-[#737686]'
                      }`}
                    >
                      {r.type}
                    </span>
                  </button>
                );
              })}
            </div>
            <p className="text-[10px] text-[#737686] mt-1">
              Select multiple rooms to span across side-by-side columns, or connect across non-adjacent resources with dashed boundary indicators.
            </p>
          </div>

          {/* Patient Name */}
          <div>
            <label className="block text-xs font-semibold text-[#434655] mb-1">
              Patient / Subject Name
            </label>
            <input
              type="text"
              value={patient}
              onChange={(e) => setPatient(e.target.value)}
              placeholder="e.g. J. Doe, Sarah Jenkins"
              className="w-full px-3 py-1.5 text-sm bg-[#f7f9fb] border border-[#c3c6d7] rounded focus:outline-none focus:ring-2 focus:ring-[#004ac6] text-[#191c1e]"
            />
          </div>

          {/* Clinical Notes */}
          <div>
            <label className="block text-xs font-semibold text-[#434655] mb-1">
              Clinical / Preparation Notes
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add prep instructions, anesthesia requirements, or notes..."
              className="w-full px-3 py-1.5 text-sm bg-[#f7f9fb] border border-[#c3c6d7] rounded focus:outline-none focus:ring-2 focus:ring-[#004ac6] text-[#191c1e] resize-none"
            />
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-[#e0e3e5]">
            {initialEvent?.id && onDelete ? (
              <button
                type="button"
                onClick={() => {
                  onDelete(initialEvent.id!);
                  onClose();
                }}
                className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-[#ba1a1a] hover:bg-[#ffdad6] rounded transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Delete</span>
              </button>
            ) : (
              <div />
            )}

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 text-xs font-medium text-[#434655] hover:bg-[#e0e3e5] rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 text-xs font-semibold text-white bg-[#004ac6] hover:bg-[#003ea8] rounded shadow-sm transition-colors"
              >
                Save Schedule
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
