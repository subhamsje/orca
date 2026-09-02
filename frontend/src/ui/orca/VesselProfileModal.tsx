import React, { useEffect, useState } from 'react';
import { Anchor, Fuel, Gauge, Ship, X } from 'lucide-react';
import { VesselProfile } from '../../types';

interface VesselProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  profile: VesselProfile;
  onSave: (p: VesselProfile) => void;
}

export const VesselProfileModal: React.FC<VesselProfileModalProps> = ({
  isOpen,
  onClose,
  profile,
  onSave,
}) => {
  const [draft, setDraft] = useState<VesselProfile>(profile);

  useEffect(() => {
    if (isOpen) setDraft(profile);
  }, [isOpen, profile]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[150] flex items-center justify-center px-4 animate-in fade-in"
      onClick={onClose}
      role="dialog"
      aria-label="Vessel profile"
    >
      <div className="absolute inset-0 bg-ocean-1000/80 backdrop-blur-md" />
      <div
        className="relative w-full max-w-md glass-strong rounded-2xl p-6 animate-in zoom-in-95 slide-in-from-bottom-4"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center">
            <Ship className="w-4 h-4 text-cyan-300" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-white">Vessel Profile</h2>
            <p className="text-[10px] uppercase tracking-wider text-ink-muted font-bold">
              Used for every assessment you run
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-ink-muted hover:text-white hover:bg-ocean-800/60"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="space-y-4">
          <Field
            label="Vessel ID"
            value={draft.vessel_id}
            onChange={(v) => setDraft((d) => ({ ...d, vessel_id: v }))}
          />
          <Field
            label="Vessel Name"
            value={draft.vessel_name}
            onChange={(v) => setDraft((d) => ({ ...d, vessel_name: v }))}
          />
          <div className="grid grid-cols-2 gap-3">
            <Field
              label="Length (m)"
              type="number"
              value={String(draft.length_m)}
              onChange={(v) => setDraft((d) => ({ ...d, length_m: parseFloat(v) || 0 }))}
              icon={<Anchor className="w-3.5 h-3.5" />}
            />
            <Field
              label="Engine (HP)"
              type="number"
              value={String(draft.engine_hp)}
              onChange={(v) => setDraft((d) => ({ ...d, engine_hp: parseFloat(v) || 0 }))}
              icon={<Gauge className="w-3.5 h-3.5" />}
            />
            <Field
              label="Fuel Capacity (L)"
              type="number"
              value={String(draft.fuel_capacity_l)}
              onChange={(v) => setDraft((d) => ({ ...d, fuel_capacity_l: parseFloat(v) || 0 }))}
              icon={<Fuel className="w-3.5 h-3.5" />}
            />
          </div>
        </div>

        <footer className="mt-6 flex items-center justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-xl border border-ocean-700 px-3.5 py-2 text-xs font-bold text-slate-200 hover:bg-ocean-800/60"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onSave(draft);
              onClose();
            }}
            className="rounded-xl border border-cyan-500/40 bg-cyan-600 hover:bg-cyan-500 px-3.5 py-2 text-xs font-bold text-white shadow-lg"
          >
            Save Profile
          </button>
        </footer>
      </div>
    </div>
  );
};

const Field: React.FC<{
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: 'text' | 'number';
  icon?: React.ReactNode;
}> = ({ label, value, onChange, type = 'text', icon }) => (
  <label className="block">
    <span className="text-[10px] uppercase tracking-wider text-ink-muted font-bold">
      {label}
    </span>
    <div className="mt-1 relative">
      {icon && (
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-300/80">
          {icon}
        </span>
      )}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-ocean-1000/80 border border-cyan-500/20 rounded-xl ${
          icon ? 'pl-9' : 'pl-3'
        } pr-3 py-2 text-sm text-slate-100 focus:border-cyan-400 focus:outline-none`}
      />
    </div>
  </label>
);