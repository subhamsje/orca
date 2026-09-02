import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Eye,
  Radio,
  RefreshCw,
  Satellite,
  ShieldAlert,
  TrendingUp,
} from 'lucide-react';
import { orcaApi, OsintAdvisory, OsintSummaryResponse } from '../utils/orcaApi';
import { Button, Card, CardHeader, EmptyState, Spinner, StatusBadge } from '../ui';

export const OsintView: React.FC = () => {
  const [intelData, setIntelData] = useState<OsintSummaryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchOsintIntel = async () => {
    setLoading(true);
    setError(false);
    const data = await orcaApi.osintSummary();
    if (data === null) {
      setError(true);
    } else {
      setIntelData(data);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOsintIntel();
  }, []);

  const advisories: OsintAdvisory[] = intelData?.advisories ?? [];
  const markets = intelData?.market_intelligence ?? {};

  return (
    <div className="space-y-4">
      <Card padding="md" tone="accent">
        <CardHeader
          title="Maritime OSINT intelligence"
          description="NASA VIIRS · Sentinel-1 · AGMARKNET · DGLL radio mesh"
          icon={<Eye className="w-4 h-4 text-purple-400" />}
          badge={
            <div className="flex items-center gap-2">
              <StatusBadge tone="info">Open source intel</StatusBadge>
              <Button
                size="sm"
                variant="secondary"
                onClick={fetchOsintIntel}
                disabled={loading}
                leadingIcon={<RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />}
              >
                Refresh feeds
              </Button>
            </div>
          }
        />
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card padding="md">
          <CardHeader
            title="Active maritime advisories"
            description="Notice to mariners & coastal security bulletins"
            icon={<ShieldAlert className="w-4 h-4 text-amber-400" />}
          />
          <div className="mt-4 space-y-2.5">
            {loading && advisories.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-ink-muted">
                <Spinner size="sm" /> Loading advisories…
              </div>
            ) : advisories.length === 0 ? (
              <EmptyState
                icon={<ShieldAlert className="w-4 h-4" />}
                title={error ? 'OSINT feeds unreachable' : 'No active advisories'}
                description={
                  error
                    ? 'Could not reach the OSINT aggregation service.'
                    : 'No maritime security advisories at this time.'
                }
                action={
                  error ? <Button onClick={fetchOsintIntel}>Retry</Button> : undefined
                }
              />
            ) : (
              advisories.map((adv, idx) => (
                <article
                  key={idx}
                  className="bg-ocean-950/80 border border-amber-900/50 rounded-xl p-3.5 space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-amber-200">{adv.type}</span>
                    <StatusBadge tone={adv.severity === 'high' ? 'danger' : 'caution'}>
                      {adv.severity}
                    </StatusBadge>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed">{adv.description}</p>
                  <p className="text-[11px] text-ink-muted">Source: {adv.source}</p>
                </article>
              ))
            )}
          </div>
        </Card>

        <Card padding="md">
          <CardHeader
            title="AGMARKNET wholesale rates"
            description="Open government marine commodity prices (₹/kg)"
            icon={<TrendingUp className="w-4 h-4 text-emerald-400" />}
          />
          <div className="mt-4 space-y-2 text-xs">
            {Object.keys(markets).length === 0 && !loading ? (
              <EmptyState
                icon={<TrendingUp className="w-4 h-4" />}
                title="No market data"
                description="AGMARKNET rates will appear here once the feed is reachable."
              />
            ) : (
              Object.entries(markets).map(([port, info]) => (
                <div
                  key={port}
                  className="bg-ocean-950/80 border border-ocean-800 rounded-xl p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <h4 className="font-bold text-slate-100 truncate">{port}</h4>
                    <p className="text-[10px] text-ink-muted">Updated {info.updated_at}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-emerald-300 font-bold">Surmai ₹{info.Surmai}/kg</p>
                    <p className="text-cyan-300 font-medium">Bangda ₹{info.Bangda}/kg</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>

      <Card padding="md">
        <CardHeader
          title="Open-source intelligence sensor pipelines"
          description="Active data feeds contributing to OSINT synthesis"
          icon={<Satellite className="w-4 h-4 text-cyan-400" />}
        />
        <ul className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {[
            {
              title: 'NASA VIIRS Nightlights',
              description: 'Night-trawler light rig anomaly detection',
              Icon: Satellite,
            },
            {
              title: 'ESA Sentinel-1 SAR',
              description: 'Dark fleet C-band radar cross-section matching',
              Icon: Satellite,
            },
            {
              title: 'DGLL SDR radio mesh',
              description: 'Coastal amateur radio VHF emergency distress listening',
              Icon: Radio,
            },
          ].map(({ title, description }) => (
            <li
              key={title}
              className="bg-ocean-950 p-3.5 rounded-xl border border-ocean-800 space-y-1"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-300">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>{title}</span>
              </div>
              <p className="text-[11px] text-ink-muted leading-relaxed">{description}</p>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
};