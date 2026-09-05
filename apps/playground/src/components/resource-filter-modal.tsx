import React, { useState } from 'react';
import { X, Plus, Check, Eye, EyeOff, Building2, User, Stethoscope } from 'lucide-react';
import { Resource, ResourceType } from '../types';

interface ResourceFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  resources: Resource[];
  onToggleResource: (id: string) => void;
  onAddResource: (resource: Resource) => void;
}

export const ResourceFilterModal: React.FC<ResourceFilterModalProps> = ({
  isOpen,
  onClose,
  resources,
  onToggleResource,
  onAddResource,
}) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newType, setNewType] = useState<ResourceType>('room');
  const [newCategory, setNewCategory] = useState('');

  if (!isOpen) return null;

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
    setNewName('');
    setNewCategory('');
    setShowAddForm(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-2xl border border-[#c3c6d7] w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3.5 bg-[#f2f4f6] border-b border-[#e0e3e5]">
          <div>
            <h2 className="font-semibold text-[#191c1e] text-base">
              Resource Management
            </h2>
            <p className="text-[11px] text-[#434655]">
              Toggle visible columns in the schedule grid
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-[#737686] hover:text-[#191c1e] hover:bg-[#e0e3e5] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* List of Resources */}
        <div className="p-5 space-y-2 max-h-[50vh] overflow-y-auto">
          {resources.map((res) => (
            <div
              key={res.id}
              onClick={() => onToggleResource(res.id)}
              className={`flex items-center justify-between p-2.5 rounded-lg border transition-all cursor-pointer select-none ${
                res.active
                  ? 'bg-white border-[#004ac6]/30 shadow-xs'
                  : 'bg-[#f7f9fb] border-[#e0e3e5] opacity-60'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className={`w-8 h-8 rounded flex items-center justify-center ${
                    res.type === 'room'
                      ? 'bg-[#dbe1ff] text-[#004ac6]'
                      : 'bg-[#86f2e4]/30 text-[#006a61]'
                  }`}
                >
                  {res.type === 'room' ? (
                    <Building2 className="w-4 h-4" />
                  ) : (
                    <Stethoscope className="w-4 h-4" />
                  )}
                </div>
                <div>
                  <div className="font-semibold text-xs text-[#191c1e] leading-tight">
                    {res.name}
                  </div>
                  <div className="text-[11px] text-[#434655]">
                    {res.category || res.type}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                {res.active ? (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-[#004ac6] bg-[#dbe1ff] px-2 py-0.5 rounded">
                    <Eye className="w-3 h-3" />
                    <span>Visible</span>
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-[11px] text-[#737686] bg-[#eceef0] px-2 py-0.5 rounded">
                    <EyeOff className="w-3 h-3" />
                    <span>Hidden</span>
                  </span>
                )}
              </div>
            </div>
          ))}

          {/* Add New Resource Form Toggle */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full flex items-center justify-center gap-1.5 py-2 px-3 border border-dashed border-[#c3c6d7] rounded-lg text-xs font-semibold text-[#004ac6] hover:bg-[#f7f9fb] transition-colors mt-3"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New Room or Specialist Column</span>
            </button>
          ) : (
            <form
              onSubmit={handleAddSubmit}
              className="p-3 bg-[#f7f9fb] border border-[#c3c6d7] rounded-lg space-y-3 mt-3 animate-in fade-in"
            >
              <div className="font-semibold text-xs text-[#191c1e]">
                New Resource Column
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[10px] font-bold text-[#434655] uppercase mb-0.5">
                    Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. OR Suite 3"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="w-full px-2 py-1 text-xs bg-white border border-[#c3c6d7] rounded text-[#191c1e]"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-[#434655] uppercase mb-0.5">
                    Type
                  </label>
                  <select
                    value={newType}
                    onChange={(e) => setNewType(e.target.value as ResourceType)}
                    className="w-full px-2 py-1 text-xs bg-white border border-[#c3c6d7] rounded text-[#191c1e]"
                  >
                    <option value="room">Room / Suite</option>
                    <option value="practitioner">Practitioner / Doctor</option>
                    <option value="equipment">Equipment</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-[#434655] uppercase mb-0.5">
                  Category / Specialty
                </label>
                <input
                  type="text"
                  placeholder="e.g. Cardiac OR, Orthopedics"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full px-2 py-1 text-xs bg-white border border-[#c3c6d7] rounded text-[#191c1e]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-2.5 py-1 text-xs text-[#434655] hover:bg-[#e0e3e5] rounded"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 text-xs font-semibold text-white bg-[#004ac6] rounded hover:bg-[#003ea8]"
                >
                  Add Column
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-5 py-3 bg-[#f2f4f6] border-t border-[#e0e3e5]">
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
