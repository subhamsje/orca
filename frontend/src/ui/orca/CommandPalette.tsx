import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Command, Globe, MapPin, Navigation, Search, X } from 'lucide-react';
import { GLOBAL_HARBORS, HarborLocation } from '../../utils/harbors';
import { formatLatLon } from '../../utils/format';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectHarbor: (h: HarborLocation) => void;
  onFlyToCoordinate: (lat: number, lon: number) => void;
}

interface CommandItem {
  id: string;
  type: 'harbor' | 'coords' | 'action';
  title: string;
  subtitle?: string;
  Icon: React.ComponentType<{ className?: string }>;
  action: () => void;
}

const QUICK_ACTIONS: Omit<CommandItem, 'action' | 'id'>[] = [
  {
    type: 'action',
    title: 'Reset view to global',
    subtitle: 'Center the map on the prime meridian',
    Icon: Globe,
  },
];

function isMacLike(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /Mac|iPhone|iPad|iPod/i.test(navigator.platform || navigator.userAgent);
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectHarbor,
  onFlyToCoordinate,
}) => {
  const [query, setQuery] = useState('');
  const [highlighted, setHighlighted] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const modKey = isMacLike() ? '⌘' : 'Ctrl';

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setHighlighted(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [isOpen]);

  const items: CommandItem[] = useMemo(() => {
    const q = query.trim();
    const list: CommandItem[] = [];

    // Coordinates first if user typed numbers
    if (q) {
      const match = q.match(/^(-?\d+(?:\.\d+)?)[\s,]+(-?\d+(?:\.\d+)?)$/);
      if (match) {
        const lat = parseFloat(match[1]);
        const lon = parseFloat(match[2]);
        if (
          Number.isFinite(lat) &&
          Number.isFinite(lon) &&
          lat >= -90 &&
          lat <= 90 &&
          lon >= -180 &&
          lon <= 180
        ) {
          list.push({
            id: `coords:${lat},${lon}`,
            type: 'coords',
            title: `Fly to ${formatLatLon(lat, lon)}`,
            subtitle: 'Custom coordinates — trigger live assessment',
            Icon: Navigation,
            action: () => {
              onFlyToCoordinate(lat, lon);
              onClose();
            },
          });
        }
      }
    }

    const qLower = q.toLowerCase();
    const matches = GLOBAL_HARBORS.filter(
      (h) =>
        !qLower ||
        h.name.toLowerCase().includes(qLower) ||
        h.country.toLowerCase().includes(qLower) ||
        (h.state ?? '').toLowerCase().includes(qLower) ||
        h.region.toLowerCase().includes(qLower),
    ).slice(0, 8);

    for (const h of matches) {
      list.push({
        id: `harbor:${h.id}`,
        type: 'harbor',
        title: h.name,
        subtitle: `${h.state ?? ''} · ${h.country} · ${formatLatLon(h.lat, h.lon)}`,
        Icon: MapPin,
        action: () => {
          onSelectHarbor(h);
          onClose();
        },
      });
    }

    if (!q) {
      list.push({
        id: 'action:reset-view',
        type: 'action',
        title: QUICK_ACTIONS[0].title,
        subtitle: QUICK_ACTIONS[0].subtitle,
        Icon: QUICK_ACTIONS[0].Icon,
        action: () => {
          onFlyToCoordinate(15.5, 73.83);
          onClose();
        },
      });
    }

    return list;
  }, [query, onSelectHarbor, onFlyToCoordinate, onClose]);

  useEffect(() => {
    setHighlighted(0);
  }, [items]);

  useEffect(() => {
    const el = listRef.current?.querySelector<HTMLElement>(`[data-idx="${highlighted}"]`);
    el?.scrollIntoView({ block: 'nearest' });
  }, [highlighted]);

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
      return;
    }
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(items.length - 1, h + 1));
      return;
    }
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(0, h - 1));
      return;
    }
    if (e.key === 'Enter') {
      e.preventDefault();
      items[highlighted]?.action();
      return;
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[12vh] px-4 animate-in fade-in"
      onClick={onClose}
      role="dialog"
      aria-label="Command palette"
    >
      <div className="absolute inset-0 bg-ocean-1000/80 backdrop-blur-md" />
      <div
        className="relative w-full max-w-2xl glass-strong rounded-2xl shadow-2xl animate-in zoom-in-95 slide-in-from-top-2 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
      >
        <div className="flex items-center gap-3 px-4 py-3 border-b border-cyan-500/15">
          <Search className="w-4 h-4 text-cyan-300 shrink-0" />
          <input
            ref={inputRef}
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search harbors, paste lat,lon, or type a query…"
            className="flex-1 bg-transparent text-sm text-slate-100 placeholder:text-ink-subtle focus:outline-none"
          />
          <span className="chip text-[9px]">{modKey}K</span>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-ink-muted hover:text-white hover:bg-ocean-800/60"
            aria-label="Close command palette"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-2">
          {items.length === 0 && (
            <p className="text-xs text-ink-muted text-center py-12">
              No results. Try “Tokyo”, “Reykjavík”, or paste coordinates like 35.68, 139.69.
            </p>
          )}
          {items.map((item, idx) => {
            const isHighlighted = idx === highlighted;
            return (
              <button
                key={item.id}
                type="button"
                data-idx={idx}
                onClick={() => item.action()}
                onMouseEnter={() => setHighlighted(idx)}
                className={`w-full text-left rounded-xl px-3 py-2.5 flex items-center gap-3 transition ${
                  isHighlighted
                    ? 'bg-cyan-950/60 border border-cyan-400/50'
                    : 'border border-transparent hover:bg-ocean-1000/60'
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    item.type === 'coords'
                      ? 'bg-amber-500/15 text-amber-300'
                      : item.type === 'action'
                        ? 'bg-violet-500/15 text-violet-300'
                        : 'bg-cyan-500/15 text-cyan-300'
                  }`}
                >
                  <item.Icon className="w-4 h-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white truncate">{item.title}</p>
                  {item.subtitle && (
                    <p className="text-[11px] text-ink-muted truncate">{item.subtitle}</p>
                  )}
                </div>
                <span className="chip text-[9px] uppercase">{item.type}</span>
              </button>
            );
          })}
        </div>

        <footer className="px-4 py-2 border-t border-cyan-500/15 flex items-center justify-between text-[10px] text-ink-muted">
          <span className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <kbd className="kbd">↑</kbd>
              <kbd className="kbd">↓</kbd> navigate
            </span>
            <span className="flex items-center gap-1">
              <kbd className="kbd">↵</kbd> select
            </span>
            <span className="flex items-center gap-1">
              <kbd className="kbd">esc</kbd> close
            </span>
          </span>
          <span className="flex items-center gap-1">
            <Command className="w-3 h-3" /> ORCA CMD
          </span>
        </footer>
      </div>

      <style>{`
        .kbd {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          min-width: 1.4rem;
          height: 1.1rem;
          padding: 0 4px;
          border-radius: 4px;
          border: 1px solid rgba(34, 211, 238, 0.3);
          background: rgba(2, 18, 33, 0.6);
          color: rgba(165, 243, 252, 0.95);
          font-family: ui-monospace, monospace;
          font-size: 10px;
          font-weight: 700;
        }
      `}</style>
    </div>
  );
};