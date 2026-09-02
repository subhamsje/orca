import React, { useMemo, useState } from 'react';
import { Anchor, MapPin, Search, Sparkles, Star } from 'lucide-react';
import { GLOBAL_HARBORS, HarborLocation } from '../../utils/harbors';
import { formatLatLon } from '../../utils/format';

interface GlobalHarborDirectoryProps {
  selectedHarborId: string | null;
  onSelect: (harbor: HarborLocation) => void;
  assessmentForHarbor?: (h: HarborLocation) => { verdict: string; risk: number; tone: 'safe' | 'caution' | 'danger' } | null;
  isLoading?: boolean;
  filterToCurrentAssessment?: boolean;
}

const REGION_LABEL: Record<HarborLocation['region'], string> = {
  INDIA: 'India',
  MIDDLE_EAST: 'Middle East',
  EAST_ASIA: 'East Asia',
  EUROPE: 'Europe',
  AMERICAS: 'Americas',
  AFRICA: 'Africa',
  OCEANIA: 'Oceania',
};

const REGION_ORDER: HarborLocation['region'][] = [
  'INDIA',
  'MIDDLE_EAST',
  'EAST_ASIA',
  'EUROPE',
  'AFRICA',
  'AMERICAS',
  'OCEANIA',
];

export const GlobalHarborDirectory: React.FC<GlobalHarborDirectoryProps> = ({
  selectedHarborId,
  onSelect,
  assessmentForHarbor,
  isLoading,
}) => {
  const [query, setQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState<'ALL' | HarborLocation['region']>('ALL');

  const grouped = useMemo(() => {
    const q = query.trim().toLowerCase();
    const filtered = GLOBAL_HARBORS.filter((h) => {
      const matchQ =
        !q ||
        h.name.toLowerCase().includes(q) ||
        h.country.toLowerCase().includes(q) ||
        (h.state ?? '').toLowerCase().includes(q);
      const matchR = regionFilter === 'ALL' || h.region === regionFilter;
      return matchQ && matchR;
    });
    const groups = new Map<HarborLocation['region'], HarborLocation[]>();
    for (const h of filtered) {
      const arr = groups.get(h.region) ?? [];
      arr.push(h);
      groups.set(h.region, arr);
    }
    return REGION_ORDER.flatMap((r) => {
      const arr = groups.get(r) ?? [];
      if (!arr.length) return [];
      return [{ region: r, items: arr }];
    });
  }, [query, regionFilter]);

  return (
    <section className="glass-strong rounded-2xl flex flex-col h-full overflow-hidden">
      <header className="px-5 pt-5 pb-3 border-b border-cyan-500/15">
        <div className="flex items-center gap-2">
          <Anchor className="w-4 h-4 text-cyan-300" />
          <h2 className="text-sm font-bold text-white tracking-tight">
            Global Harbor Directory
          </h2>
          <span className="ml-auto chip chip-cyan text-[9px]">{GLOBAL_HARBORS.length} ports</span>
        </div>
        <p className="text-[10px] text-ink-muted mt-1">
          Tap a sector to fly the map and trigger a fresh ocean-modeling assessment.
        </p>

        <div className="mt-3 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-cyan-300/80" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search Mumbai, Reykjavík, Tokyo…"
            className="w-full bg-ocean-1000/80 border border-cyan-500/20 rounded-xl pl-8 pr-3 py-2 text-xs text-slate-100 placeholder:text-ink-subtle focus:border-cyan-400 focus:outline-none"
          />
        </div>

        <div className="mt-3 flex items-center gap-1 overflow-x-auto pb-1">
          {(['ALL', ...REGION_ORDER] as const).map((r) => (
            <button
              key={r}
              type="button"
              onClick={() => setRegionFilter(r)}
              className={`shrink-0 text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full border transition ${
                regionFilter === r
                  ? 'bg-cyan-600 border-cyan-400 text-white shadow-[0_0_12px_rgba(34,211,238,0.45)]'
                  : 'bg-ocean-1000/40 border-cyan-500/15 text-cyan-200/80 hover:border-cyan-500/40'
              }`}
            >
              {r === 'ALL' ? 'All' : REGION_LABEL[r]}
            </button>
          ))}
        </div>
      </header>

      <div className="flex-1 overflow-y-auto px-3 py-3 space-y-4">
        {grouped.length === 0 && (
          <p className="text-xs text-ink-muted text-center py-8">
            No harbors match. Try a different region or query.
          </p>
        )}

        {grouped.map(({ region, items }) => (
          <div key={region}>
            <h3 className="text-[10px] font-bold uppercase tracking-[0.18em] text-cyan-300/80 px-2 mb-1.5">
              {REGION_LABEL[region]}
            </h3>
            <ul className="space-y-1.5">
              {items.map((h) => {
                const isSelected = h.id === selectedHarborId;
                const assessment = assessmentForHarbor?.(h);
                const tone = assessment?.tone;
                return (
                  <li key={h.id}>
                    <button
                      type="button"
                      onClick={() => onSelect(h)}
                      className={`w-full text-left rounded-xl border px-3 py-2.5 transition group ${
                        isSelected
                          ? 'border-cyan-400/70 bg-cyan-950/40 shadow-[0_0_18px_-4px_rgba(34,211,238,0.6)]'
                          : 'border-cyan-500/10 bg-ocean-1000/40 hover:border-cyan-500/40 hover:bg-ocean-1000/70'
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <MapPin
                          className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${
                            isSelected ? 'text-cyan-300' : 'text-cyan-400/70'
                          }`}
                        />
                        <div className="min-w-0 flex-1">
                          <p className="text-[12px] font-bold text-white truncate">
                            {h.name}
                          </p>
                          <p className="text-[10px] text-ink-muted truncate">
                            {h.state}, {h.country}
                          </p>
                          <p className="text-[9px] text-cyan-300/80 font-mono mt-0.5">
                            {formatLatLon(h.lat, h.lon)}
                          </p>
                        </div>
                        {assessment && (
                          <div className="flex flex-col items-end shrink-0">
                            <span
                              className={`text-[10px] font-bold numeric ${
                                tone === 'safe'
                                  ? 'text-emerald-300'
                                  : tone === 'caution'
                                    ? 'text-amber-300'
                                    : 'text-red-300'
                              }`}
                            >
                              {assessment.risk}
                            </span>
                            <span className="text-[9px] text-ink-muted uppercase">
                              risk
                            </span>
                          </div>
                        )}
                      </div>
                      {h.description && (
                        <p className="mt-1 text-[10px] text-ink-muted line-clamp-1">
                          {h.description}
                        </p>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>

      <footer className="px-4 py-2.5 border-t border-cyan-500/15 flex items-center justify-between text-[10px] text-ink-muted">
        <span className="flex items-center gap-1.5">
          <Sparkles className="w-3 h-3 text-cyan-300" /> Real Open-Meteo + INCOIS ocean models.
        </span>
        {isLoading && <span className="chip chip-cyan text-[9px] animate-pulse">ASSESSING…</span>}
      </footer>
    </section>
  );
};