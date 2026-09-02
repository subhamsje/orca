/**
 * ORCA formatting utilities — keep all numbers & dates consistent.
 */

const INR = new Intl.NumberFormat('en-IN', { maximumFractionDigits: 0 });

export function formatINR(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return INR.format(value);
}

export function formatINRSigned(value: number): string {
  if (!Number.isFinite(value)) return '—';
  const sign = value < 0 ? '-' : '';
  return `${sign}₹${INR.format(Math.abs(value))}`;
}

export function formatKm(km: number): string {
  if (!Number.isFinite(km)) return '—';
  if (km < 1) return `${Math.round(km * 1000)} m`;
  if (km < 10) return `${km.toFixed(1)} km`;
  if (km < 1000) return `${Math.round(km)} km`;
  return `${(km / 1000).toFixed(1)}k km`;
}

export function formatNm(nm: number): string {
  if (!Number.isFinite(nm)) return '—';
  return `${nm.toFixed(2)} NM`;
}

export function formatPct(v: number, digits = 0): string {
  if (!Number.isFinite(v)) return '—';
  return `${v.toFixed(digits)}%`;
}

export function formatRelativeTime(timestamp: number | string | Date): string {
  const ts = new Date(timestamp).getTime();
  if (Number.isNaN(ts)) return '—';
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 0) return 'just now';
  if (diff < 60) return `${diff}s ago`;
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

export function formatLatLon(lat: number, lon: number): string {
  const ns = lat >= 0 ? 'N' : 'S';
  const ew = lon >= 0 ? 'E' : 'W';
  return `${Math.abs(lat).toFixed(4)}°${ns}, ${Math.abs(lon).toFixed(4)}°${ew}`;
}

export function bearingToCompass(deg: number): string {
  if (!Number.isFinite(deg)) return '—';
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
    'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(((deg % 360) / 22.5)) % 16];
}

export function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}