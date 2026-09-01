import React, { useState } from 'react';
import { X, Ship, Check } from 'lucide-react';
import { VesselProfile } from '../types';

interface VesselProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  vesselProfile: VesselProfile;
  onSaveProfile: (profile: VesselProfile) => void;
}

export const VesselProfileModal: React.FC<VesselProfileModalProps> = ({
  isOpen,
  onClose,
  vesselProfile,
  onSaveProfile,
}) => {
  if (!isOpen) return null;

  const [formData, setFormData] = useState<VesselProfile>(vesselProfile);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveProfile(formData);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-ocean-900 border border-ocean-800 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-ocean-800 pb-4">
          <div className="flex items-center space-x-2">
            <div className="bg-cyan-600 p-2 rounded-xl text-white">
              <Ship className="w-5 h-5" />
            </div>
            <h3 className="text-lg font-bold text-white">Vessel Digital Twin Profile</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-1">
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
              Vessel Name / Registration ID
            </label>
            <input
              type="text"
              value={formData.vessel_name}
              onChange={(e) => setFormData({ ...formData, vessel_name: e.target.value })}
              className="w-full bg-ocean-950 border border-ocean-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:ring-1 focus:ring-cyan-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Length (Meters)
              </label>
              <input
                type="number"
                step="0.5"
                value={formData.length_m}
                onChange={(e) => setFormData({ ...formData, length_m: parseFloat(e.target.value) || 8.5 })}
                className="w-full bg-ocean-950 border border-ocean-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:ring-1 focus:ring-cyan-500"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase text-slate-400 mb-1">
                Engine (HP)
              </label>
              <input
                type="number"
                value={formData.engine_hp}
                onChange={(e) => setFormData({ ...formData, engine_hp: parseFloat(e.target.value) || 9.9 })}
                className="w-full bg-ocean-950 border border-ocean-800 rounded-xl px-3.5 py-2.5 text-white outline-none focus:ring-1 focus:ring-cyan-500"
                required
              />
            </div>
          </div>

          <div className="bg-ocean-950 p-3 rounded-xl border border-ocean-800/80 text-xs space-y-1">
            <span className="text-slate-400 block font-semibold">Capsizing Wave Threshold:</span>
            <span className="text-cyan-300 font-bold">
              Max Wave Limit = 0.6 × {formData.length_m}m = {(0.6 * formData.length_m).toFixed(1)}m
            </span>
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-ocean-800 text-slate-300 hover:text-white font-medium text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-bold text-xs flex items-center space-x-1.5 shadow-lg"
            >
              <Check className="w-4 h-4" />
              <span>Save Digital Twin</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
