import React, { useEffect, useId, useRef, useState } from 'react';
import { Check, Ship, X } from 'lucide-react';
import { VesselProfile } from '../types';
import { Button, Card, CardHeader } from '../ui';

interface VesselProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  vesselProfile: VesselProfile;
  onSaveProfile: (profile: VesselProfile) => void;
}

const Field: React.FC<{
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}> = ({ label, htmlFor, hint, children }) => (
  <label htmlFor={htmlFor} className="flex flex-col gap-1.5 text-sm">
    <span className="text-[11px] font-bold uppercase tracking-wider text-ink-muted">
      {label}
    </span>
    {children}
    {hint && <span className="text-[11px] text-ink-subtle">{hint}</span>}
  </label>
);

const inputClass =
  'w-full bg-ocean-950 border border-ocean-800 text-white rounded-xl px-3.5 py-2.5 outline-none focus:border-cyan-500 focus-visible:ring-2 focus-visible:ring-cyan-400';

export const VesselProfileModal: React.FC<VesselProfileModalProps> = ({
  isOpen,
  onClose,
  vesselProfile,
  onSaveProfile,
}) => {
  const titleId = useId();
  const descId = useId();
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<VesselProfile>(vesselProfile);
  const [errors, setErrors] = useState<{ length?: string; hp?: string; fuel?: string }>({});

  useEffect(() => {
    setFormData(vesselProfile);
    setErrors({});
  }, [vesselProfile, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    firstFieldRef.current?.focus();

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
      previousFocus?.focus?.();
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const validate = (data: VesselProfile) => {
    const next: typeof errors = {};
    if (Number.isNaN(data.length_m) || data.length_m <= 0 || data.length_m > 60) {
      next.length = 'Length must be between 0 and 60 m.';
    }
    if (Number.isNaN(data.engine_hp) || data.engine_hp <= 0 || data.engine_hp > 2000) {
      next.hp = 'Engine HP must be between 0 and 2000.';
    }
    if (Number.isNaN(data.fuel_capacity_l) || data.fuel_capacity_l <= 0 || data.fuel_capacity_l > 5000) {
      next.fuel = 'Fuel capacity must be between 0 and 5000 L.';
    }
    return next;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const next = validate(formData);
    setErrors(next);
    if (Object.keys(next).length > 0) return;
    onSaveProfile(formData);
    onClose();
  };

  const capsizingThreshold = (0.6 * (formData.length_m || 0)).toFixed(1);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        ref={dialogRef}
        className="bg-ocean-975 border border-ocean-800 rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md shadow-card-lg animate-in fade-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
      >
        <Card padding="none" className="bg-transparent border-0 shadow-none">
          <div className="flex items-start justify-between gap-3 p-5 border-b border-ocean-800">
            <div className="flex items-center gap-2">
              <div className="bg-cyan-600 p-2 rounded-xl text-white shrink-0">
                <Ship className="w-5 h-5" aria-hidden="true" />
              </div>
              <div>
                <h3 id={titleId} className="text-base font-bold text-white">
                  Vessel digital twin
                </h3>
                <p id={descId} className="text-[11px] text-ink-muted">
                  Capsizing threshold updates automatically.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close vessel profile editor"
              className="text-ink-muted hover:text-white p-1.5 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-5 space-y-4">
            <Field label="Vessel name / registration" htmlFor="vessel-name">
              <input
                id="vessel-name"
                ref={firstFieldRef}
                type="text"
                value={formData.vessel_name}
                onChange={(e) =>
                  setFormData({ ...formData, vessel_name: e.target.value })
                }
                className={inputClass}
                required
              />
            </Field>

            <div className="grid grid-cols-2 gap-3">
              <Field label="Length (m)" htmlFor="vessel-length" hint={errors.length}>
                <input
                  id="vessel-length"
                  type="number"
                  step="0.5"
                  min={0}
                  max={60}
                  value={formData.length_m}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      length_m: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={inputClass}
                  required
                />
              </Field>

              <Field label="Engine (HP)" htmlFor="vessel-hp" hint={errors.hp}>
                <input
                  id="vessel-hp"
                  type="number"
                  step="0.1"
                  min={0}
                  max={2000}
                  value={formData.engine_hp}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      engine_hp: parseFloat(e.target.value) || 0,
                    })
                  }
                  className={inputClass}
                  required
                />
              </Field>
            </div>

            <Field label="Fuel capacity (L)" htmlFor="vessel-fuel" hint={errors.fuel}>
              <input
                id="vessel-fuel"
                type="number"
                step="1"
                min={0}
                max={5000}
                value={formData.fuel_capacity_l}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    fuel_capacity_l: parseFloat(e.target.value) || 0,
                  })
                }
                className={inputClass}
                required
              />
            </Field>

            <div className="bg-ocean-950 p-3.5 rounded-xl border border-ocean-800 text-xs space-y-1">
              <p className="text-ink-muted font-semibold">Capsizing wave threshold</p>
              <p className="text-cyan-300 font-bold text-sm">
                Max wave limit = 0.6 × {formData.length_m}m = {capsizingThreshold}m
              </p>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button type="button" variant="ghost" onClick={onClose}>
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                leadingIcon={<Check className="w-4 h-4" />}
              >
                Save digital twin
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};