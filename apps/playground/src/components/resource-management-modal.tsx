import { formatTime } from '../utils/time-utils';
import React, { useState, useEffect } from 'react';
import {
  X,
  Trash2,
  AlertTriangle,
  Building2,
  Stethoscope,
  Eye,
  EyeOff,
  Plus,
  CheckCircle2,
} from 'lucide-react';
import { Resource, ResourceType, ScheduledEvent } from '../types';

interface ResourceManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  resources: Resource[];
  selectedResourceId?: string | null;
  events: ScheduledEvent[];
  onDeleteResource: (resourceId: string) => void;
  onToggleResource: (resourceId: string) => void;
  onAddResource: (resource: Resource) => void;
}

export const ResourceManagementModal: React.FC<ResourceManagementModalProps> = ({
  isOpen,
  onClose,
  resources,
  selectedResourceId,
  events,
  onDeleteResource,
  onToggleResource,
  onAddResource,
}) => {
  const [activeTabId, setActiveTabId] = useState<string | null>(selectedResourceId || null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<ResourceType>('room');
  const [newCategory, setNewCategory] = useState('');

  // Sync selected tab if selectedResourceId changes when opening
  useEffect(() => {
    if (selectedResourceId) {
      setActiveTabId(selectedResourceId);
    } else if (resources.length > 0 && (!activeTabId || !resources.some((r) => r.id === activeTabId))) {
      setActiveTabId(resources[0]?.id || null);
    }
  }, [selectedResourceId, resources, isOpen]);

  if (!isOpen) return null;

  const currentResource = resources.find((r) => r.id === activeTabId) || resources[0];
  const assignedEvents = currentResource
    ? events.filter((e) => e.resourceId === currentResource.id)
    : [];

  const handleConfirmDelete = (id: string) => {
    onDeleteResource(id);
    setConfirmDeleteId(null);
    const remaining = resources.filter((r) => r.id !== id);
    if (remaining.length > 0) {
      setActiveTabId(remaining[0].id);
    } else {
      setActiveTabId(null);
    }
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newRes: Resource = {
      id: `res_${Date.now()}`,
      name: newName.trim(),
      type: newType,
      category: newCategory.trim() || (newType === 'room' ? 'Operating Suite' : 'Specialist'),
      colorTheme: newType === 'room' ? 'blue' : newType === 'practitioner' ? 'teal' : 'amber',
      active: true,
      order: resources.length,
    };

    onAddResource(newRes);
    setActiveTabId(newRes.id);
    setNewName('');
    setNewCategory('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-[#c3c6d7] w-full max-w-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#f2f4f6] border-b border-[#e0e3e5]">
          <div>
            <h2 className="font-semibold text-[#191c1e] text-base flex items-center gap-2">
              <Building2 className="w-4 h-4 text-[#004ac6]" />
              <span>Resource & Column Management</span>
            </h2>
            <p className="text-[11px] text-[#434655]">
              Configure, toggle, or delete schedule grid columns
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#737686] hover:text-[#191c1e] hover:bg-[#e0e3e5] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="grid grid-cols-1 md:grid-cols-12 divide-y md:divide-y-0 md:divide-x divide-[#e0e3e5] min-h-[320px] max-h-[60vh] overflow-y-auto">
          {/* Left Column: Resource List */}
          <div className="md:col-span-5 p-3 space-y-1.5 overflow-y-auto bg-[#f7f9fb]">
            <div className="text-[10px] font-bold text-[#737686] uppercase tracking-wider px-2 py-1">
              Active Columns ({resources.length})
            </div>

            {resources.map((res) => {
              const count = events.filter((e) => e.resourceId === res.id).length;
              const isSelected = activeTabId === res.id;

              return (
                <div
                  key={res.id}
                  onClick={() => {
                    setActiveTabId(res.id);
                    setConfirmDeleteId(null);
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-md border text-left cursor-pointer transition-all ${
                    isSelected
                      ? 'bg-white border-[#004ac6] shadow-xs'
                      : 'bg-white/60 border-[#e0e3e5] hover:bg-white hover:border-[#c3c6d7]'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2 h-2 shrink-0 rounded-full ${
                        res.colorTheme === 'teal'
                          ? 'bg-[#006a61]'
                          : res.colorTheme === 'purple'
                          ? 'bg-[#7e22ce]'
                          : res.colorTheme === 'amber'
                          ? 'bg-[#a65900]'
                          : 'bg-[#004ac6]'
                      }`}
                    />
                    <div className="truncate">
                      <div className="text-xs font-semibold text-[#191c1e] truncate">
                        {res.name}
                      </div>
                      <div className="text-[10px] text-[#737686] truncate">
                        {res.category || res.type}
                      </div>
                    </div>
                  </div>

                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-[#eceef0] text-[#555869] shrink-0 font-medium">
                    {count} {count === 1 ? 'evt' : 'evts'}
                  </span>
                </div>
              );
            })}

            {!showAddForm && (
              <button
                onClick={() => setShowAddForm(true)}
                className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-[#c3c6d7] rounded-md text-xs font-semibold text-[#004ac6] hover:bg-white transition-colors mt-2"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Column</span>
              </button>
            )}
          </div>

          {/* Right Column: Selected Resource Details & Delete Action */}
          <div className="md:col-span-7 p-5 flex flex-col justify-between bg-white">
            {showAddForm ? (
              <form onSubmit={handleAddSubmit} className="space-y-3 animate-in fade-in">
                <div className="font-semibold text-xs text-[#191c1e] border-b border-[#e0e3e5] pb-2">
                  Create New Resource Column
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#434655] uppercase mb-1">
                    Resource Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Operating Room 4"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#c3c6d7] rounded text-[#191c1e] focus:outline-[#004ac6]"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-bold text-[#434655] uppercase mb-1">
                      Type
                    </label>
                    <select
                      value={newType}
                      onChange={(e) => setNewType(e.target.value as ResourceType)}
                      className="w-full px-2 py-1.5 text-xs bg-white border border-[#c3c6d7] rounded text-[#191c1e]"
                    >
                      <option value="room">Room / Suite</option>
                      <option value="practitioner">Practitioner</option>
                      <option value="equipment">Equipment</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-[#434655] uppercase mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dental Surgery"
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value)}
                      className="w-full px-2.5 py-1.5 text-xs bg-white border border-[#c3c6d7] rounded text-[#191c1e]"
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-3 border-t border-[#e0e3e5]">
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="px-3 py-1.5 text-xs text-[#434655] hover:bg-[#eceef0] rounded font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-[#004ac6] rounded hover:bg-[#003ea8]"
                  >
                    Save Resource
                  </button>
                </div>
              </form>
            ) : currentResource ? (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-[#737686] uppercase tracking-wider">
                      Selected Resource
                    </span>
                    <button
                      onClick={() => onToggleResource(currentResource.id)}
                      className="text-xs font-medium flex items-center gap-1 text-[#004ac6] hover:underline"
                    >
                      {currentResource.active !== false ? (
                        <>
                          <Eye className="w-3.5 h-3.5" />
                          <span>Visible in Grid</span>
                        </>
                      ) : (
                        <>
                          <EyeOff className="w-3.5 h-3.5 text-[#737686]" />
                          <span className="text-[#737686]">Hidden from Grid</span>
                        </>
                      )}
                    </button>
                  </div>

                  <h3 className="text-base font-bold text-[#191c1e] mt-1">
                    {currentResource.name}
                  </h3>
                  <p className="text-xs text-[#555869]">
                    {currentResource.category || currentResource.type}
                  </p>
                </div>

                <div className="p-3 bg-[#f7f9fb] border border-[#e0e3e5] rounded-md space-y-1.5">
                  <div className="text-[11px] font-semibold text-[#191c1e]">
                    Scheduled Appointments ({assignedEvents.length})
                  </div>
                  {assignedEvents.length > 0 ? (
                    <div className="max-h-24 overflow-y-auto space-y-1 pr-1">
                      {assignedEvents.map((evt) => (
                        <div
                          key={evt.id}
                          className="text-[11px] text-[#434655] flex items-center justify-between bg-white px-2 py-1 rounded border border-[#e0e3e5]"
                        >
                          <span className="font-medium truncate max-w-[160px]">
                            {evt.title}
                          </span>
                          <span className="text-[10px] text-[#737686] shrink-0">
                            {formatTime(evt.startsAt)} - {formatTime(evt.endsAt)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-[#737686]">
                      No events currently scheduled in this resource column.
                    </p>
                  )}
                </div>

                {/* Delete Resource Confirmation / Action */}
                <div className="pt-3 border-t border-[#e0e3e5]">
                  {confirmDeleteId === currentResource.id ? (
                    <div className="p-3 bg-[#ffdad6]/40 border border-[#ff897d] rounded-md space-y-2">
                      <div className="flex items-start gap-2 text-xs font-semibold text-[#ba1a1a]">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <div>
                          <span>Delete &quot;{currentResource.name}&quot;?</span>
                          {assignedEvents.length > 0 && (
                            <p className="text-[11px] font-normal text-[#ba1a1a] mt-0.5">
                              This will also remove {assignedEvents.length} assigned appointment(s).
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => setConfirmDeleteId(null)}
                          className="px-2.5 py-1 text-xs text-[#434655] hover:bg-white rounded font-medium"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleConfirmDelete(currentResource.id)}
                          className="px-3 py-1 text-xs font-semibold text-white bg-[#ba1a1a] hover:bg-[#93000a] rounded flex items-center gap-1"
                        >
                          <Trash2 className="w-3 h-3" />
                          <span>Confirm Delete</span>
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteId(currentResource.id)}
                      className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-[#ff897d]/50 bg-[#ffdad6]/20 hover:bg-[#ffdad6]/40 text-[#ba1a1a] rounded-md text-xs font-semibold transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Delete Resource Column</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-[#737686]">
                No resource selected.
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 bg-[#f2f4f6] border-t border-[#e0e3e5]">
          <span className="text-[11px] text-[#737686]">
            Click any column header on the grid to open this modal
          </span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold text-white bg-[#004ac6] hover:bg-[#003ea8] rounded transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
