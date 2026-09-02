import React, { useState } from 'react';
import { Anchor, Check, Fish, Send, X } from 'lucide-react';
import { API_BASE_URL } from '../../utils/api';

interface CatchReportFormProps {
  lat: number;
  lon: number;
  onClose?: () => void;
}

const SPECIES = [
  'Bangda (Mackerel)',
  'Surmai (Kingfish / Seer Fish)',
  'Tarli (Indian Oil Sardine)',
  'Poplet (Pomfret)',
  'Rawas (Indian Salmon)',
  'Bombay Duck',
  'Mandeli',
  'Other',
];

export const CatchReportForm: React.FC<CatchReportFormProps> = ({ lat, lon, onClose }) => {
  const [species, setSpecies] = useState(SPECIES[0]);
  const [weight, setWeight] = useState('0');
  const [vesselId, setVesselId] = useState('IND-MH-04-892');
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ status: string; message: string } | null>(null);

  const submit = async () => {
    setSubmitting(true);
    setResult(null);
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/submit-catch-report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          vessel_id: vesselId,
          species,
          weight_kg: parseFloat(weight) || 0,
          latitude: lat,
          longitude: lon,
        }),
      });
      const data = await res.json();
      setResult({
        status: res.ok ? 'success' : 'error',
        message:
          data.message ??
          data.detail ??
          (res.ok
            ? 'Catch report saved — your data retrains the HSI model.'
            : 'Server rejected the report.'),
      });
    } catch (e) {
      setResult({ status: 'error', message: String(e) });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="glass rounded-2xl p-4 relative">
      <header className="flex items-center gap-2 mb-3">
        <Fish className="w-4 h-4 text-emerald-300" />
        <h3 className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-300 flex-1">
          Log a Catch · Train the HSI model
        </h3>
        {onClose && (
          <button
            onClick={onClose}
            className="rounded-md p-1 text-ink-muted hover:text-white hover:bg-ocean-800/60"
            aria-label="Close"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </header>

      <div className="space-y-2.5">
        <label className="block">
          <span className="text-[9px] uppercase tracking-wider text-ink-muted font-bold">
            Vessel ID
          </span>
          <input
            value={vesselId}
            onChange={(e) => setVesselId(e.target.value)}
            className="mt-0.5 w-full bg-ocean-1000/80 border border-cyan-500/20 rounded-md px-2 py-1.5 text-[11px] text-slate-100 focus:border-cyan-400 focus:outline-none"
          />
        </label>
        <label className="block">
          <span className="text-[9px] uppercase tracking-wider text-ink-muted font-bold">
            Species
          </span>
          <select
            value={species}
            onChange={(e) => setSpecies(e.target.value)}
            className="mt-0.5 w-full bg-ocean-1000/80 border border-cyan-500/20 rounded-md px-2 py-1.5 text-[11px] text-cyan-200 focus:border-cyan-400 focus:outline-none"
          >
            {SPECIES.map((s) => (
              <option key={s} value={s} className="bg-ocean-1000">
                {s}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="text-[9px] uppercase tracking-wider text-ink-muted font-bold">
            Estimated weight (kg)
          </span>
          <input
            type="number"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            className="mt-0.5 w-full bg-ocean-1000/80 border border-cyan-500/20 rounded-md px-2 py-1.5 text-[11px] text-slate-100 numeric focus:border-cyan-400 focus:outline-none"
          />
        </label>

        <button
          type="button"
          onClick={submit}
          disabled={submitting || !vesselId}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-[11px] font-bold uppercase tracking-wider px-3 py-2 transition"
        >
          {submitting ? (
            <>
              <Send className="w-3.5 h-3.5 animate-pulse" /> Submitting…
            </>
          ) : result?.status === 'success' ? (
            <>
              <Check className="w-3.5 h-3.5" /> Saved
            </>
          ) : (
            <>
              <Anchor className="w-3.5 h-3.5" /> Submit catch
            </>
          )}
        </button>

        {result && (
          <p
            className={`text-[10px] ${
              result.status === 'success' ? 'text-emerald-300' : 'text-amber-300'
            }`}
          >
            {result.message}
          </p>
        )}
      </div>
    </section>
  );
};