import React, { useState, useEffect } from 'react';
import { Radio, ShieldAlert, Navigation, Search, RefreshCw, AlertOctagon, CheckCircle2, UserCheck, Play } from 'lucide-react';

export const AuthorityView: React.FC = () => {
  const [sarResults, setSarResults] = useState<any>(null);
  const [anomalies, setAnomalies] = useState<any[]>([]);
  const [loadingSar, setLoadingSar] = useState(false);
  const [loadingAnomalies, setLoadingAnomalies] = useState(false);

  // Bayesian Sighting Form State
  const [sightingLat, setSightingLat] = useState('16.0100');
  const [sightingLon, setSightingLon] = useState('73.5000');
  const [sightingConfidence, setSightingConfidence] = useState('0.90');
  const [bayesianResult, setBayesianResult] = useState<any>(null);

  // Human Override Form State
  const [overrideReason, setOverrideReason] = useState('High Swell Surge Advisory');
  const [overrideAction, setOverrideAction] = useState('MANDATORY HARBOR RECALL');
  const [overrideLogged, setOverrideLogged] = useState(false);

  const triggerSarSimulation = async () => {
    setLoadingSar(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/sar-drift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ last_known_lat: 16.0215, last_known_lon: 73.4821, drift_hours: 6.0 }),
      });
      if (res.ok) {
        const data = await res.json();
        setSarResults(data);
      }
    } catch (e) {
      console.error('SAR Drift error:', e);
    } finally {
      setLoadingSar(false);
    }
  };

  const applyBayesianSighting = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/sar-sighting-update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sighting_lat: parseFloat(sightingLat),
          sighting_lon: parseFloat(sightingLon),
          confidence: parseFloat(sightingConfidence),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setBayesianResult(data);
      }
    } catch (e) {
      console.error('Bayesian update error:', e);
    }
  };

  const fetchDarkFleetAnomalies = async () => {
    setLoadingAnomalies(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/authority/anomalies');
      if (res.ok) {
        const data = await res.json();
        setAnomalies(data.anomalies || []);
      }
    } catch (e) {
      console.error('Dark fleet error:', e);
    } finally {
      setLoadingAnomalies(false);
    }
  };

  const submitGovernanceOverride = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/governance/override', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: 'CG-COMMANDER-01',
          role: 'Coast Guard Command Officer',
          reason: overrideReason,
          override_action: overrideAction,
        }),
      });
      if (res.ok) {
        setOverrideLogged(true);
        setTimeout(() => setOverrideLogged(false), 4000);
      }
    } catch (e) {
      console.error('Governance override error:', e);
    }
  };

  useEffect(() => {
    triggerSarSimulation();
    fetchDarkFleetAnomalies();
  }, []);

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-red-950 via-ocean-900 to-ocean-950 border border-red-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-red-600 p-3 rounded-xl text-white shadow-md">
            <Radio className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Coast Guard & Maritime Command Center</span>
              <span className="text-xs bg-red-900 text-red-300 px-2 py-0.5 rounded-full border border-red-700 font-medium">
                AUTHORITY MODE
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              1,000-Particle Monte Carlo SAR • Sentinel-1 C-Band SAR Radar Matcher • Human Safety Override Ledger
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: 1,000-PARTICLE MONTE CARLO SAR DRIFT SIMULATOR */}
      <div className="bg-ocean-900 border border-ocean-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <Search className="w-5 h-5 text-cyan-400" />
            <span>1,000-Particle Monte Carlo SAR Drift Engine</span>
          </h3>

          <button
            onClick={triggerSarSimulation}
            disabled={loadingSar}
            className="flex items-center space-x-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold px-3 py-1.5 rounded-xl shadow-md transition"
          >
            <Play className={`w-3.5 h-3.5 ${loadingSar ? 'animate-spin' : ''}`} />
            <span>{loadingSar ? 'Simulating Particles...' : 'Run 1,000 Particle Simulation'}</span>
          </button>
        </div>

        {sarResults && (
          <div className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="bg-ocean-950 p-3 rounded-xl border border-ocean-800 space-y-1">
                <span className="text-slate-400 block">Last Known Coords:</span>
                <span className="font-bold text-cyan-300">
                  {sarResults.last_known_coordinate[0]}, {sarResults.last_known_coordinate[1]}
                </span>
              </div>
              <div className="bg-ocean-950 p-3 rounded-xl border border-ocean-800 space-y-1">
                <span className="text-slate-400 block">Drift Centroid (6 Hrs):</span>
                <span className="font-bold text-emerald-400">
                  {sarResults.drift_centroid[0]}, {sarResults.drift_centroid[1]}
                </span>
              </div>
              <div className="bg-ocean-950 p-3 rounded-xl border border-ocean-800 space-y-1">
                <span className="text-slate-400 block">Prioritized Search Radius:</span>
                <span className="font-bold text-amber-400">
                  {sarResults.prioritized_search_radius_km} km
                </span>
              </div>
            </div>

            {/* Mid-Search Bayesian Particle Resampling Widget */}
            <div className="bg-ocean-950/90 border border-cyan-900/60 rounded-xl p-4 space-y-3">
              <h4 className="text-xs font-bold text-cyan-300 flex items-center space-x-1.5">
                <Navigation className="w-4 h-4" />
                <span>Bayesian Sighting Particle Cloud Resampling</span>
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                <input
                  type="text"
                  value={sightingLat}
                  onChange={(e) => setSightingLat(e.target.value)}
                  placeholder="Sighting Lat (e.g. 16.01)"
                  className="bg-ocean-900 border border-ocean-800 text-slate-200 p-2 rounded-lg outline-none"
                />
                <input
                  type="text"
                  value={sightingLon}
                  onChange={(e) => setSightingLon(e.target.value)}
                  placeholder="Sighting Lon (e.g. 73.50)"
                  className="bg-ocean-900 border border-ocean-800 text-slate-200 p-2 rounded-lg outline-none"
                />
                <button
                  onClick={applyBayesianSighting}
                  className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3 py-2 rounded-lg transition"
                >
                  Resample Particle Cloud
                </button>
              </div>

              {bayesianResult && (
                <div className="bg-emerald-950/60 border border-emerald-800 rounded-lg p-3 text-xs text-emerald-300 flex items-center justify-between">
                  <span>
                    ✓ Cloud Resampled! Updated Centroid: <strong>{bayesianResult.updated_drift_centroid[0]}, {bayesianResult.updated_drift_centroid[1]}</strong>
                  </span>
                  <span className="font-bold bg-emerald-900 px-2 py-0.5 rounded border border-emerald-700">
                    Radius Collapsed: {bayesianResult.updated_search_radius_km} km
                  </span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: DARK-FLEET SAR RADAR VS AIS ANOMALY DETECTOR */}
      <div className="bg-ocean-900 border border-ocean-800 rounded-2xl p-5 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center space-x-2">
            <AlertOctagon className="w-5 h-5 text-red-400" />
            <span>Dark-Fleet Sentinel-1 SAR Radar vs. AIS Transponder Radar</span>
          </h3>

          <button
            onClick={fetchDarkFleetAnomalies}
            disabled={loadingAnomalies}
            className="flex items-center space-x-1 text-xs bg-ocean-800 hover:bg-ocean-700 text-slate-200 px-2.5 py-1 rounded-lg border border-ocean-700"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingAnomalies ? 'animate-spin' : ''}`} />
            <span>Scan Radar</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left text-slate-300">
            <thead className="text-[11px] uppercase bg-ocean-950 text-slate-400 font-bold border-b border-ocean-800">
              <tr>
                <th className="p-3">Anomaly ID</th>
                <th className="p-3">Coordinates</th>
                <th className="p-3">Radar Cross-Section</th>
                <th className="p-3">Confidence</th>
                <th className="p-3">Action Dispatch</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ocean-800">
              {anomalies.map((anom, idx) => (
                <tr key={idx} className="bg-red-950/30 hover:bg-red-950/50">
                  <td className="p-3 font-bold text-red-400">{anom.anomaly_id}</td>
                  <td className="p-3 font-medium text-slate-200">
                    {anom.coordinate[0]}, {anom.coordinate[1]}
                  </td>
                  <td className="p-3 text-amber-300">{anom.radar_cross_section_m2} m²</td>
                  <td className="p-3 font-bold text-emerald-400">{(anom.confidence * 100).toFixed(0)}%</td>
                  <td className="p-3">
                    <button className="bg-red-600 hover:bg-red-500 text-white font-bold px-2.5 py-1 rounded text-[11px] transition">
                      Dispatch Intercept
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 3: HUMAN SAFETY OVERRIDE AUDIT LOG FORM */}
      <div className="bg-ocean-900 border border-ocean-800 rounded-2xl p-5 shadow-lg space-y-3">
        <h3 className="text-base font-bold text-white flex items-center space-x-2">
          <UserCheck className="w-5 h-5 text-amber-400" />
          <span>Human Safety Override Audit Ledger Form</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <input
            type="text"
            value={overrideReason}
            onChange={(e) => setOverrideReason(e.target.value)}
            placeholder="Override Reason..."
            className="bg-ocean-950 border border-ocean-800 text-slate-200 p-2.5 rounded-xl outline-none"
          />
          <input
            type="text"
            value={overrideAction}
            onChange={(e) => setOverrideAction(e.target.value)}
            placeholder="Override Action..."
            className="bg-ocean-950 border border-ocean-800 text-slate-200 p-2.5 rounded-xl outline-none"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <button
            onClick={submitGovernanceOverride}
            className="bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold px-4 py-2 rounded-xl shadow-md transition"
          >
            Log Override to SQLite Audit Ledger
          </button>

          {overrideLogged && (
            <span className="text-xs font-bold text-emerald-400 flex items-center space-x-1">
              <CheckCircle2 className="w-4 h-4" />
              <span>Override Logged to Versioned Audit Table!</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
