import React, { useEffect, useState } from 'react';
import {
  AlertOctagon,
  CheckCircle2,
  Compass,
  Crosshair,
  Radio,
  Search,
  Send,
  UserCheck,
} from 'lucide-react';
import { orcaApi, SARDriftResponse, SightingUpdateResponse, DarkFleetAnomaly } from '../utils/orcaApi';
import { Button, Card, CardHeader, EmptyState, Spinner, StatusBadge } from '../ui';

export const AuthorityView: React.FC = () => {
  const [sarResults, setSarResults] = useState<SARDriftResponse | null>(null);
  const [anomalies, setAnomalies] = useState<DarkFleetAnomaly[]>([]);
  const [loadingSar, setLoadingSar] = useState(false);
  const [loadingAnomalies, setLoadingAnomalies] = useState(false);

  const [sightingLat, setSightingLat] = useState('16.0100');
  const [sightingLon, setSightingLon] = useState('73.5000');
  const [sightingConfidence, setSightingConfidence] = useState('0.90');
  const [bayesianResult, setBayesianResult] = useState<SightingUpdateResponse | null>(null);
  const [sightingError, setSightingError] = useState<string | null>(null);

  const [overrideReason, setOverrideReason] = useState('High Swell Surge Advisory');
  const [overrideAction, setOverrideAction] = useState('MANDATORY HARBOR RECALL');
  const [overrideLogged, setOverrideLogged] = useState(false);

  const triggerSarSimulation = async () => {
    setLoadingSar(true);
    const data = await orcaApi.sarDrift({
      last_known_lat: 16.0215,
      last_known_lon: 73.4821,
      drift_hours: 6.0,
    });
    if (data) setSarResults(data);
    setLoadingSar(false);
  };

  const applyBayesianSighting = async () => {
    setSightingError(null);
    const lat = parseFloat(sightingLat);
    const lon = parseFloat(sightingLon);
    const conf = parseFloat(sightingConfidence);
    if (Number.isNaN(lat) || Number.isNaN(lon) || Number.isNaN(conf)) {
      setSightingError('Latitude, longitude, and confidence must be numbers.');
      return;
    }
    const data = await orcaApi.applySighting({
      sighting_lat: lat,
      sighting_lon: lon,
      confidence: conf,
    });
    if (data) {
      setBayesianResult(data);
    } else {
      setSightingError('Could not reach the SAR service.');
    }
  };

  const fetchAnomalies = async () => {
    setLoadingAnomalies(true);
    const data = await orcaApi.anomalies();
    setAnomalies(data?.anomalies ?? []);
    setLoadingAnomalies(false);
  };

  const submitGovernanceOverride = async () => {
    const result = await orcaApi.governanceOverride({
      user_id: 'CG-COMMANDER-01',
      role: 'Coast Guard Command Officer',
      reason: overrideReason,
      override_action: overrideAction,
    });
    if (result !== null) {
      setOverrideLogged(true);
      window.setTimeout(() => setOverrideLogged(false), 4000);
    }
  };

  useEffect(() => {
    triggerSarSimulation();
    fetchAnomalies();
  }, []);

  return (
    <div className="space-y-4">
      <Card padding="md" tone="accent">
        <CardHeader
          title="Coast Guard & Maritime Command"
          description="Monte Carlo SAR · Sentinel-1 SAR radar · human safety override ledger"
          icon={<Radio className="w-4 h-4 text-red-400" />}
          badge={<StatusBadge tone="danger">Authority mode</StatusBadge>}
        />
      </Card>

      <Card padding="md">
        <CardHeader
          title="Monte Carlo SAR drift"
          description="1,000-particle probabilistic search trajectory"
          icon={<Search className="w-4 h-4 text-cyan-400" />}
          badge={
            <Button
              size="sm"
              variant="primary"
              onClick={triggerSarSimulation}
              disabled={loadingSar}
              leadingIcon={<Search className="w-3.5 h-3.5" />}
            >
              {loadingSar ? 'Simulating…' : 'Run 1,000 particles'}
            </Button>
          }
        />

        {loadingSar && !sarResults ? (
          <div className="mt-4 flex items-center gap-2 text-xs text-ink-muted">
            <Spinner size="sm" /> Computing particle cloud…
          </div>
        ) : sarResults ? (
          <div className="mt-4 space-y-3">
            <dl className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-ocean-950 p-3 rounded-xl border border-ocean-800 space-y-1">
                <dt className="text-ink-muted">Last known</dt>
                <dd className="font-semibold text-cyan-300">
                  {sarResults.last_known_coordinate[0].toFixed(4)},{' '}
                  {sarResults.last_known_coordinate[1].toFixed(4)}
                </dd>
              </div>
              <div className="bg-ocean-950 p-3 rounded-xl border border-ocean-800 space-y-1">
                <dt className="text-ink-muted">Drift centroid (6 h)</dt>
                <dd className="font-semibold text-emerald-300">
                  {sarResults.drift_centroid[0].toFixed(4)},{' '}
                  {sarResults.drift_centroid[1].toFixed(4)}
                </dd>
              </div>
              <div className="bg-ocean-950 p-3 rounded-xl border border-ocean-800 space-y-1">
                <dt className="text-ink-muted">Search radius</dt>
                <dd className="font-semibold text-amber-300">
                  {sarResults.prioritized_search_radius_km} km
                </dd>
              </div>
            </dl>

            <div className="bg-ocean-950/90 border border-cyan-900/60 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-cyan-300 flex items-center gap-1.5">
                <Compass className="w-4 h-4" /> Bayesian sighting resample
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <label className="flex flex-col gap-1">
                  <span className="text-ink-muted">Sighting lat</span>
                  <input
                    type="text"
                    value={sightingLat}
                    onChange={(e) => setSightingLat(e.target.value)}
                    className="bg-ocean-900 border border-ocean-800 text-slate-100 p-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-ink-muted">Sighting lon</span>
                  <input
                    type="text"
                    value={sightingLon}
                    onChange={(e) => setSightingLon(e.target.value)}
                    className="bg-ocean-900 border border-ocean-800 text-slate-100 p-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  />
                </label>
                <label className="flex flex-col gap-1">
                  <span className="text-ink-muted">Confidence</span>
                  <input
                    type="text"
                    value={sightingConfidence}
                    onChange={(e) => setSightingConfidence(e.target.value)}
                    className="bg-ocean-900 border border-ocean-800 text-slate-100 p-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  />
                </label>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <Button
                  size="sm"
                  variant="success"
                  onClick={applyBayesianSighting}
                  leadingIcon={<Crosshair className="w-3.5 h-3.5" />}
                >
                  Resample cloud
                </Button>
                {sightingError && (
                  <span className="text-xs text-amber-300">{sightingError}</span>
                )}
              </div>

              {bayesianResult && (
                <div className="bg-emerald-950/40 border border-emerald-800 rounded-lg p-3 text-xs text-emerald-200 flex flex-wrap items-center justify-between gap-2">
                  <span>
                    ✓ Cloud resampled — centroid{' '}
                    <strong>
                      {bayesianResult.updated_drift_centroid[0].toFixed(4)},{' '}
                      {bayesianResult.updated_drift_centroid[1].toFixed(4)}
                    </strong>
                  </span>
                  <span className="font-bold bg-emerald-900 px-2 py-0.5 rounded border border-emerald-700">
                    Radius collapsed to {bayesianResult.updated_search_radius_km} km
                  </span>
                </div>
              )}
            </div>
          </div>
        ) : (
          <EmptyState
            className="mt-4"
            title="No SAR run yet"
            description="Run a 1,000-particle drift simulation to populate the search radius."
            action={<Button onClick={triggerSarSimulation}>Run simulation</Button>}
          />
        )}
      </Card>

      <Card padding="md">
        <CardHeader
          title="Dark fleet · SAR vs AIS anomalies"
          description="Vessels broadcasting SAR signature without AIS transponder"
          icon={<AlertOctagon className="w-4 h-4 text-red-400" />}
          badge={
            <Button
              size="sm"
              variant="secondary"
              onClick={fetchAnomalies}
              disabled={loadingAnomalies}
              leadingIcon={<Search className="w-3.5 h-3.5" />}
            >
              {loadingAnomalies ? 'Scanning…' : 'Rescan radar'}
            </Button>
          }
        />

        <div className="mt-4 -mx-5 overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-200">
            <thead className="text-[10px] uppercase bg-ocean-950 text-ink-muted font-bold border-b border-ocean-800">
              <tr>
                <th className="px-5 py-2.5">Anomaly</th>
                <th className="px-3 py-2.5">Coordinates</th>
                <th className="px-3 py-2.5">Cross-section</th>
                <th className="px-3 py-2.5">Confidence</th>
                <th className="px-3 py-2.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ocean-800">
              {anomalies.length === 0 && !loadingAnomalies && (
                <tr>
                  <td colSpan={5} className="px-5 py-6 text-center text-ink-muted">
                    No anomalies detected in this sector.
                  </td>
                </tr>
              )}
              {anomalies.map((anom) => (
                <tr key={anom.anomaly_id} className="bg-red-950/30 hover:bg-red-950/50">
                  <td className="px-5 py-2.5 font-bold text-red-300">{anom.anomaly_id}</td>
                  <td className="px-3 py-2.5">
                    {anom.coordinate[0].toFixed(4)}, {anom.coordinate[1].toFixed(4)}
                  </td>
                  <td className="px-3 py-2.5 text-amber-300">
                    {anom.radar_cross_section_m2} m²
                  </td>
                  <td className="px-3 py-2.5 font-bold text-emerald-300">
                    {(anom.confidence * 100).toFixed(0)}%
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    <Button size="sm" variant="danger">
                      Dispatch intercept
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      <Card padding="md">
        <CardHeader
          title="Human safety override ledger"
          description="Versioned SQLite audit record of officer interventions"
          icon={<UserCheck className="w-4 h-4 text-amber-400" />}
        />

        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <label className="flex flex-col gap-1">
            <span className="text-ink-muted font-semibold uppercase tracking-wider">
              Override reason
            </span>
            <input
              type="text"
              value={overrideReason}
              onChange={(e) => setOverrideReason(e.target.value)}
              className="bg-ocean-950 border border-ocean-800 text-slate-100 p-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-ink-muted font-semibold uppercase tracking-wider">
              Override action
            </span>
            <input
              type="text"
              value={overrideAction}
              onChange={(e) => setOverrideAction(e.target.value)}
              className="bg-ocean-950 border border-ocean-800 text-slate-100 p-2.5 rounded-xl outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            />
          </label>
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
          <Button
            variant="warning"
            onClick={submitGovernanceOverride}
            leadingIcon={<Send className="w-3.5 h-3.5" />}
          >
            Log to audit ledger
          </Button>
          {overrideLogged && (
            <span className="text-xs font-bold text-emerald-300 flex items-center gap-1">
              <CheckCircle2 className="w-4 h-4" />
              Override logged to versioned audit table
            </span>
          )}
        </div>
      </Card>
    </div>
  );
};