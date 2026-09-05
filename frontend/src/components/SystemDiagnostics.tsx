import React, { useEffect, useState } from 'react';
import {
  Activity,
  CheckCircle2,
  Cpu,
  Fuel,
  Satellite,
  ShieldAlert,
  Terminal,
} from 'lucide-react';
import { TripAssessmentResponse } from '../types';
import { orcaApi } from '../utils/orcaApi';
import {
  Button,
  Card,
  CardHeader,
  EmptyState,
  Skeleton,
  StatusBadge,
} from '../ui';

interface SystemDiagnosticsProps {
  assessment: TripAssessmentResponse | null;
}

const DEFAULT_NMEA = '$GPRMC,,A,,,,,,,010926,,,A*6A';

export const SystemDiagnostics: React.FC<SystemDiagnosticsProps> = ({ assessment }) => {
  const [satPasses, setSatPasses] = useState<{ satellite: string; orbit_type: string; next_pass_in_minutes: number; sensor: string }[]>([]);
  const [satLoaded, setSatLoaded] = useState(false);
  const [nmeaSentence, setNmeaSentence] = useState(DEFAULT_NMEA);
  const [parsedNmea, setParsedNmea] = useState<{ checksum_valid: boolean; parsed_data: Record<string, unknown> } | null>(null);
  const [nmeaLoading, setNmeaLoading] = useState(false);

  const [targetLat, setTargetLat] = useState('');
  const [targetLon, setTargetLon] = useState('');
  const [cpaResult, setCpaResult] = useState<{
    initial_range_nm: number;
    cpa_nautical_miles: number;
    tcpa_minutes: number;
    recommended_action: string;
  } | null>(null);
  const [cpaLoading, setCpaLoading] = useState(false);

  const [distKm, setDistKm] = useState('30.0');
  const [engineResult, setEngineResult] = useState<{
    fuel_rate_liters_per_hour: number;
    total_fuel_consumed_liters: number;
    propeller_slip_pct: number;
    effective_load_factor_pct: number;
  } | null>(null);
  const [engineLoading, setEngineLoading] = useState(false);

  const ownLat = assessment?.coordinate.lat;
  const ownLon = assessment?.coordinate.lon;

  const fetchSatellitePasses = async () => {
    const result = await orcaApi.satellitePasses();
    if (result.ok) {
      setSatPasses(result.data?.upcoming_overpasses ?? []);
    } else {
      setSatPasses([]);
      console.warn('[SystemDiagnostics] satellite passes:', result.error);
    }
    setSatLoaded(true);
  };

  const parseNmea = async () => {
    setNmeaLoading(true);
    const result = await orcaApi.parseNmea(nmeaSentence);
    if (result.ok) {
      setParsedNmea(result.data);
    } else {
      setParsedNmea(null);
      console.warn('[SystemDiagnostics] NMEA parse:', result.error);
    }
    setNmeaLoading(false);
  };

  const testCpa = async () => {
    if (ownLat == null || ownLon == null) {
      console.warn('[SystemDiagnostics] CPA skipped: no live coordinate yet');
      return;
    }
    setCpaLoading(true);
    const tLat = parseFloat(targetLat);
    const tLon = parseFloat(targetLon);
    if (Number.isNaN(tLat) || Number.isNaN(tLon)) {
      console.warn('[SystemDiagnostics] CPA skipped: target coordinates invalid');
      setCpaLoading(false);
      return;
    }
    const result = await orcaApi.cpa({
      own_lat: ownLat,
      own_lon: ownLon,
      own_speed_knots: 8.0,
      own_cog_deg: 240.0,
      target_lat: tLat,
      target_lon: tLon,
      target_speed_knots: 12.0,
      target_cog_deg: 160.0,
    });
    if (result.ok) {
      setCpaResult(result.data);
    } else {
      setCpaResult(null);
      console.warn('[SystemDiagnostics] CPA:', result.error);
    }
    setCpaLoading(false);
  };

  const testEngine = async () => {
    setEngineLoading(true);
    const distance = parseFloat(distKm);
    // Pull wind + wave from the live assessment ocean_state so the
    // engine simulator sees the conditions the vessel would actually
    // face. Fall back to assessment vessel twin values when available.
    const wind = assessment?.world_model?.ocean_state?.wind_gust_kmh
      ?? assessment?.world_model?.ocean_state?.wind_speed_kmh
      ?? 0;
    const wave = assessment?.world_model?.ocean_state?.wave_height_m ?? 0;
    const result = await orcaApi.engineMetrics({
      distance_km: Number.isNaN(distance) ? 30 : distance,
      vessel_speed_knots: 8.0,
      engine_hp: 9.9,
      headwind_kmh: wind,
      wave_height_m: wave,
    });
    if (result.ok) {
      setEngineResult(result.data);
    } else {
      setEngineResult(null);
      console.warn('[SystemDiagnostics] engine:', result.error);
    }
    setEngineLoading(false);
  };

  useEffect(() => {
    fetchSatellitePasses();
    if (ownLat != null && ownLon == null) {
      setTargetLat(ownLat.toFixed(4));
    }
    if (ownLon != null) {
      setTargetLon(ownLon.toFixed(4));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ownLat, ownLon]);

  return (
    <div className="space-y-4">
      <Card padding="md" tone="accent">
        <CardHeader
          title="System provenance & hardware lab"
          description="NMEA 0183 · satellite pass predictor · CPA collision vector simulator"
          icon={<Activity className="w-4 h-4 text-cyan-400" />}
          badge={<StatusBadge tone="info">Diagnostics</StatusBadge>}
        />
      </Card>

      <Card padding="md">
        <CardHeader
          title="Satellite orbital overpasses"
          description="Next pass countdown for active mission satellites"
          icon={<Satellite className="w-4 h-4 text-cyan-400" />}
          badge={
            <Button
              size="sm"
              variant="secondary"
              onClick={fetchSatellitePasses}
              leadingIcon={<Satellite className="w-3.5 h-3.5" />}
            >
              Refresh
            </Button>
          }
        />
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
          {!satLoaded ? (
            Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} height="5rem" />)
          ) : satPasses.length === 0 ? (
            <div className="col-span-full">
              <EmptyState
                icon={<Satellite className="w-4 h-4" />}
                title="No passes available"
                description="The satellite pass predictor is currently unreachable."
              />
            </div>
          ) : (
            satPasses.map((sat) => (
              <article
                key={sat.satellite}
                className="bg-ocean-950 p-4 rounded-xl border border-ocean-800 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-white truncate">{sat.satellite}</span>
                  <StatusBadge tone="info">{sat.orbit_type}</StatusBadge>
                </div>
                <p className="text-xs font-bold text-emerald-300">
                  Next pass in {sat.next_pass_in_minutes} min
                </p>
                <p className="text-[11px] text-ink-muted">{sat.sensor}</p>
              </article>
            ))
          )}
        </div>
      </Card>

      <Card padding="md">
        <CardHeader
          title="NMEA 0183 / 2000 terminal"
          description="Parse raw GPS / depth / wind sentences with checksum verification"
          icon={<Terminal className="w-4 h-4 text-emerald-400" />}
        />
        <div className="mt-4 space-y-2">
          <label className="flex flex-col gap-1">
            <span className="sr-only">Raw NMEA sentence</span>
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={nmeaSentence}
                onChange={(e) => setNmeaSentence(e.target.value)}
                placeholder="Paste raw NMEA sentence ($GPRMC, $SDDBT, $MWV)…"
                className="flex-1 bg-ocean-950 border border-ocean-800 text-slate-100 text-xs rounded-xl px-3 py-2.5 outline-none font-mono focus-visible:ring-2 focus-visible:ring-cyan-400"
              />
              <Button
                size="md"
                variant="success"
                onClick={parseNmea}
                disabled={nmeaLoading}
                leadingIcon={<Terminal className="w-3.5 h-3.5" />}
              >
                Parse stream
              </Button>
            </div>
          </label>

          {parsedNmea && (
            <div className="bg-ocean-950 border border-ocean-800 rounded-xl p-3.5 space-y-1.5 font-mono text-xs">
              <div
                className={`flex items-center gap-2 font-bold ${
                  parsedNmea.checksum_valid ? 'text-emerald-300' : 'text-amber-300'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  Checksum {parsedNmea.checksum_valid ? 'valid (XOR match)' : 'invalid'}
                </span>
              </div>
              <pre className="text-slate-200 text-[11px] bg-ocean-900 p-2.5 rounded overflow-x-auto">
                {JSON.stringify(parsedNmea.parsed_data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </Card>

      <Card padding="md">
        <CardHeader
          title="CPA / TCPA collision guard"
          description="Closest point of approach simulator for collision avoidance"
          icon={<ShieldAlert className="w-4 h-4 text-amber-400" />}
        />
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <label className="flex flex-col gap-1">
            <span className="text-ink-muted">Target latitude</span>
            <input
              type="text"
              value={targetLat}
              onChange={(e) => setTargetLat(e.target.value)}
              className="bg-ocean-950 border border-ocean-800 text-slate-100 p-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-ink-muted">Target longitude</span>
            <input
              type="text"
              value={targetLon}
              onChange={(e) => setTargetLon(e.target.value)}
              className="bg-ocean-900 border border-ocean-800 text-slate-100 p-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            />
          </label>
          <Button
            variant="warning"
            onClick={testCpa}
            disabled={cpaLoading}
            leadingIcon={<ShieldAlert className="w-3.5 h-3.5" />}
          >
            Calculate CPA vectors
          </Button>
        </div>

        {cpaResult ? (
          <dl className="mt-4 bg-ocean-950 border border-ocean-800 rounded-xl p-3.5 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <dt className="text-ink-muted">Initial distance</dt>
              <dd className="font-bold text-white">{cpaResult.initial_range_nm} NM</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Predictive CPA</dt>
              <dd className="font-bold text-amber-300">{cpaResult.cpa_nautical_miles} NM</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Time to CPA</dt>
              <dd className="font-bold text-cyan-300">{cpaResult.tcpa_minutes} min</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Recommended action</dt>
              <dd className="font-bold text-emerald-300">{cpaResult.recommended_action}</dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-xs text-ink-muted">Awaiting CPA calculation…</p>
        )}
      </Card>

      <Card padding="md">
        <CardHeader
          title="Engine twin & propeller slip"
          description="Hydro-acoustic fuel burn simulator (BSFC-based)"
          icon={<Fuel className="w-4 h-4 text-cyan-400" />}
          badge={
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-ink-muted">
              <Cpu className="w-3 h-3" /> Real-time
            </span>
          }
        />
        <div className="mt-4 flex items-center gap-2 text-xs">
          <label className="flex-1 flex flex-col gap-1">
            <span className="text-ink-muted">Trip distance (km)</span>
            <input
              type="text"
              value={distKm}
              onChange={(e) => setDistKm(e.target.value)}
              className="bg-ocean-950 border border-ocean-800 text-slate-100 p-2 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
            />
          </label>
          <Button
            variant="primary"
            onClick={testEngine}
            disabled={engineLoading}
            leadingIcon={<Fuel className="w-3.5 h-3.5" />}
          >
            Calculate fuel burn
          </Button>
        </div>

        {engineResult ? (
          <dl className="mt-4 bg-ocean-950 border border-ocean-800 rounded-xl p-3.5 text-xs grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <dt className="text-ink-muted">Fuel rate</dt>
              <dd className="font-bold text-amber-300">
                {engineResult.fuel_rate_liters_per_hour} L/hr
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Total consumed</dt>
              <dd className="font-bold text-emerald-300">
                {engineResult.total_fuel_consumed_liters} L
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Propeller slip</dt>
              <dd className="font-bold text-cyan-300">{engineResult.propeller_slip_pct}%</dd>
            </div>
            <div>
              <dt className="text-ink-muted">Engine load</dt>
              <dd className="font-bold text-white">
                {engineResult.effective_load_factor_pct}%
              </dd>
            </div>
          </dl>
        ) : (
          <p className="mt-3 text-xs text-ink-muted">Awaiting engine calculation…</p>
        )}
      </Card>
    </div>
  );
};