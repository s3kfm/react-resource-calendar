import React from 'react';
import { X, AlertTriangle, ArrowRight, CheckCircle2, Clock, MapPin, Sparkles } from 'lucide-react';
import { ConflictItem, Resource, ScheduledEvent } from '../types';

interface ConflictResolverModalProps {
  isOpen: boolean;
  onClose: () => void;
  conflicts: ConflictItem[];
  resources: Resource[];
  onResolveByShiftTime: (eventId: string, newStartTime: string, newEndTime: string) => void;
  onResolveByReassignResource: (eventId: string, newResourceId: string) => void;
  onSelectEventToEdit: (event: ScheduledEvent) => void;
}

export const ConflictResolverModal: React.FC<ConflictResolverModalProps> = ({
  isOpen,
  onClose,
  conflicts,
  resources,
  onResolveByShiftTime,
  onResolveByReassignResource,
  onSelectEventToEdit,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-[#c3c6d7] w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#ffdad6] border-b border-[#ba1a1a]/30">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#ba1a1a]" />
            <div>
              <h2 className="font-semibold text-[#ba1a1a] text-base leading-tight">
                Schedule Conflict Resolution Center
              </h2>
              <div className="text-[11px] text-[#93000a]">
                {conflicts.length} critical double-booking{conflicts.length > 1 ? 's' : ''} detected
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#93000a] hover:bg-[#ffb4ab]/40 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[70vh] overflow-y-auto space-y-4">
          {conflicts.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-[#006a61] mx-auto mb-2 opacity-80" />
              <p className="font-semibold text-[#191c1e] text-sm">
                No Conflicts Detected!
              </p>
              <p className="text-xs text-[#434655] mt-1">
                All scheduled surgical suites and consultation rooms are clear with zero overlaps.
              </p>
            </div>
          ) : (
            conflicts.map((conflict, index) => {
              const { eventA, eventB, resourceName, overlapDurationMinutes } = conflict;
              const otherRooms = resources.filter(
                (r) => r.type === 'room' && r.id !== conflict.resourceId && r.active
              );

              return (
                <div
                  key={conflict.id || index}
                  className="bg-[#f7f9fb] border border-[#e0e3e5] rounded-lg p-4 space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded bg-[#ffdad6] text-[#ba1a1a] text-[11px] font-bold">
                        Conflict #{index + 1}
                      </span>
                      <span className="font-semibold text-xs text-[#191c1e]">
                        {resourceName} ({conflict.date})
                      </span>
                    </div>
                    <span className="text-[11px] font-data-mono text-[#ba1a1a] font-semibold">
                      {overlapDurationMinutes}m overlap
                    </span>
                  </div>

                  {/* Overlapping items comparison card */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div className="bg-white border border-[#004ac6]/30 rounded p-2.5">
                      <div className="text-[10px] uppercase font-bold text-[#004ac6]">
                        Primary Booking (A)
                      </div>
                      <div className="font-semibold text-xs text-[#191c1e] mt-0.5">
                        {eventA.title}
                      </div>
                      <div className="text-[11px] font-data-mono text-[#434655] mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{eventA.startTime} - {eventA.endTime}</span>
                      </div>
                      {eventA.patient && (
                        <div className="text-[11px] text-[#737686] mt-0.5">
                          Patient: {eventA.patient}
                        </div>
                      )}
                    </div>

                    <div className="bg-white border border-[#ba1a1a] rounded p-2.5 relative">
                      <div className="text-[10px] uppercase font-bold text-[#ba1a1a] flex items-center justify-between">
                        <span>Colliding Booking (B)</span>
                        <AlertTriangle className="w-3 h-3 text-[#ba1a1a]" />
                      </div>
                      <div className="font-semibold text-xs text-[#191c1e] mt-0.5">
                        {eventB.title}
                      </div>
                      <div className="text-[11px] font-data-mono text-[#434655] mt-1 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        <span>{eventB.startTime} - {eventB.endTime}</span>
                      </div>
                      {eventB.patient && (
                        <div className="text-[11px] text-[#737686] mt-0.5">
                          Patient: {eventB.patient}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Resolution Suggestions */}
                  <div className="pt-2 border-t border-[#e0e3e5] space-y-2">
                    <div className="text-[11px] font-bold text-[#434655] uppercase flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#004ac6]" />
                      <span>One-Click Smart Resolutions</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {/* Option 1: Shift Time */}
                      <button
                        onClick={() => {
                          // Shift eventB to start at eventA's end time
                          // Compute duration of eventB in minutes
                          const [sH, sM] = eventB.startTime.split(':').map(Number);
                          const [eH, eM] = eventB.endTime.split(':').map(Number);
                          const durationMin = (eH * 60 + eM) - (sH * 60 + sM);

                          const [endAH, endAM] = eventA.endTime.split(':').map(Number);
                          const newStartTotal = endAH * 60 + endAM;
                          const newEndTotal = newStartTotal + durationMin;

                          const newStartTime = `${String(Math.floor(newStartTotal / 60)).padStart(2, '0')}:${String(newStartTotal % 60).padStart(2, '0')}`;
                          const newEndTime = `${String(Math.floor(newEndTotal / 60)).padStart(2, '0')}:${String(newEndTotal % 60).padStart(2, '0')}`;

                          onResolveByShiftTime(eventB.id, newStartTime, newEndTime);
                        }}
                        className="flex flex-col text-left p-2 rounded bg-white hover:bg-[#dbe1ff]/30 border border-[#004ac6]/30 text-xs transition-colors group"
                      >
                        <span className="font-semibold text-[#004ac6] flex items-center justify-between">
                          <span>Shift "{eventB.title}" Time</span>
                          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </span>
                        <span className="text-[11px] text-[#434655] mt-0.5">
                          Move to start at {eventA.endTime} (immediately after {eventA.title})
                        </span>
                      </button>

                      {/* Option 2: Reassign Room */}
                      {otherRooms.length > 0 ? (
                        <button
                          onClick={() => {
                            onResolveByReassignResource(eventB.id, otherRooms[0].id);
                          }}
                          className="flex flex-col text-left p-2 rounded bg-white hover:bg-[#86f2e4]/20 border border-[#006a61]/30 text-xs transition-colors group"
                        >
                          <span className="font-semibold text-[#006a61] flex items-center justify-between">
                            <span>Reassign to {otherRooms[0].name}</span>
                            <MapPin className="w-3 h-3 group-hover:scale-110 transition-transform" />
                          </span>
                          <span className="text-[11px] text-[#434655] mt-0.5">
                            Move {eventB.title} to available {otherRooms[0].name}
                          </span>
                        </button>
                      ) : (
                        <button
                          onClick={() => {
                            onSelectEventToEdit(eventB);
                            onClose();
                          }}
                          className="flex flex-col text-left p-2 rounded bg-white hover:bg-[#eceef0] border border-[#c3c6d7] text-xs transition-colors"
                        >
                          <span className="font-semibold text-[#191c1e]">
                            Manual Adjustment
                          </span>
                          <span className="text-[11px] text-[#434655] mt-0.5">
                            Open full booking editor
                          </span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 bg-[#f2f4f6] border-t border-[#e0e3e5]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-[#191c1e] bg-white border border-[#c3c6d7] hover:bg-[#e0e3e5] rounded transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
