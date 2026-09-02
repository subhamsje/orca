import React, { useState, useEffect } from 'react';
import { TripAssessmentResponse } from '../types';
import { Activity, Satellite, Terminal, ShieldAlert, Cpu, Fuel, CheckCircle, Send } from 'lucide-react';

interface SystemDiagnosticsProps {
  assessment: TripAssessmentResponse | null;
}

export const SystemDiagnostics: React.FC<SystemDiagnosticsProps> = ({ assessment }) => {
  const [satPasses, setSatPasses] = useState<any[]>([]);
  const [nmeaSentence, setNmeaSentence] = useState('$GPRMC,123519,A,1602.1500,N,07348.2100,E,08.2,240.0,010926,,,A*77');
  const [parsedNmea, setParsedNmea] = useState<any>(null);

  // CPA Collision Guard Form State
  const [targetLat, setTargetLat] = useState('16.0365');
  const [targetLon, setTargetLon] = useState('73.4671');
  const [cpaResult, setCpaResult] = useState<any>(null);

  // Engine Twin Form State
  const [distKm, setDistKm] = useState('30.0');
  const [engineResult, setEngineResult] = useState<any>(null);

  const fetchSatellitePasses = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/satellite/passes');
      if (res.ok) {
        const data = await res.json();
        setSatPasses(data.upcoming_overpasses || []);
      }
    } catch (e) {
      console.error('Failed to fetch satellite passes:', e);
    }
  };

  const parseNmeaHardwareSentence = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/hardware/nmea', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sentence: nmeaSentence }),
      });
      if (res.ok) {
        const data = await res.json();
        setParsedNmea(data);
      }
    } catch (e) {
      console.error('NMEA parse error:', e);
    }
  };

  const testCpaCollisionGuard = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/collision/cpa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          own_lat: assessment?.coordinate.lat || 16.0215,
          own_lon: assessment?.coordinate.lon || 73.4821,
          own_speed_knots: 8.0,
          own_cog_deg: 240.0,
          target_lat: parseFloat(targetLat),
          target_lon: parseFloat(targetLon),
          target_speed_knots: 12.0,
          target_cog_deg: 160.0,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setCpaResult(data);
      }
    } catch (e) {
      console.error('CPA error:', e);
    }
  };

  const testEngineTwin = async () => {
    try {
      const res = await fetch('http://localhost:8000/api/v1/engine/metrics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          distance_km: parseFloat(distKm),
          vessel_speed_knots: 8.0,
          engine_hp: 9.9,
          headwind_kmh: 15.0,
          wave_height_m: 1.1,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setEngineResult(data);
      }
    } catch (e) {
      console.error('Engine error:', e);
    }
  };

  useEffect(() => {
    fetchSatellitePasses();
    parseNmeaHardwareSentence();
    testCpaCollisionGuard();
    testEngineTwin();
  }, []);

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-ocean-950 via-cyan-950 to-ocean-900 border border-cyan-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-cyan-600 p-3 rounded-xl text-white shadow-md">
            <Activity className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
              <span>System Provenance & Hardware Lab</span>
              <span className="text-xs bg-cyan-900 text-cyan-300 px-2 py-0.5 rounded-full border border-cyan-700 font-medium">
                DIAGNOSTICS
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              NMEA 0183 Hardware Terminal • Satellite Pass Predictor • CPA Collision Vector Simulator
            </p>
          </div>
        </div>
      </div>

      {/* SECTION 1: REAL-TIME SATELLITE ORBITAL OVERPASS COUNTDOWNS */}
      <div className="bg-ocean-900 border border-ocean-800 rounded-2xl p-5 shadow-lg space-y-3">
        <h3 className="text-sm font-bold text-cyan-300 flex items-center space-x-2">
          <Satellite className="w-4 h-4 text-cyan-400" />
          <span>Real-Time Satellite Orbital Overpass Countdowns</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {satPasses.map((sat, idx) => (
            <div key={idx} className="bg-ocean-950 p-4 rounded-xl border border-ocean-800 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">{sat.satellite}</span>
                <span className="text-[10px] bg-cyan-950 text-cyan-300 border border-cyan-800 px-2 py-0.5 rounded font-bold">
                  {sat.orbit_type}
                </span>
              </div>
              <p className="text-xs font-bold text-emerald-400">Next Pass in: {sat.next_pass_in_minutes} Mins</p>
              <p className="text-[11px] text-slate-400">{sat.sensor}</p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 2: NMEA 0183/2000 HARDWARE SERIAL TERMINAL SIMULATOR */}
      <div className="bg-ocean-900 border border-ocean-800 rounded-2xl p-5 shadow-lg space-y-3">
        <h3 className="text-sm font-bold text-emerald-400 flex items-center space-x-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span>NMEA 0183 / NMEA 2000 Hardware Sensor Terminal</span>
        </h3>

        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={nmeaSentence}
              onChange={(e) => setNmeaSentence(e.target.value)}
              placeholder="Paste raw NMEA sentence ($GPRMC, $SDDBT, $MWV)..."
              className="flex-1 bg-ocean-950 border border-ocean-800 text-slate-200 text-xs rounded-xl px-3 py-2.5 outline-none font-mono"
            />
            <button
              onClick={parseNmeaHardwareSentence}
              className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-4 py-2.5 rounded-xl shadow-md transition"
            >
              Parse Hardware Stream
            </button>
          </div>

          {parsedNmea && (
            <div className="bg-ocean-950 border border-ocean-800 rounded-xl p-3.5 space-y-1.5 font-mono text-xs">
              <div className="flex items-center space-x-2 text-emerald-400 font-bold">
                <CheckCircle className="w-4 h-4" />
                <span>Checksum Verified: {parsedNmea.checksum_valid ? 'VALID (XOR Match)' : 'INVALID'}</span>
              </div>
              <pre className="text-slate-300 text-[11px] bg-ocean-900 p-2.5 rounded overflow-x-auto">
                {JSON.stringify(parsedNmea.parsed_data, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>

      {/* SECTION 3: PREDICTIVE CPA/TCPA COLLISION GUARD TESTER */}
      <div className="bg-ocean-900 border border-ocean-800 rounded-2xl p-5 shadow-lg space-y-3">
        <h3 className="text-sm font-bold text-amber-400 flex items-center space-x-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Predictive CPA / TCPA Collision Avoidance Guard Simulator</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
          <input
            type="text"
            value={targetLat}
            onChange={(e) => setTargetLat(e.target.value)}
            placeholder="Target Lat..."
            className="bg-ocean-950 border border-ocean-800 text-slate-200 p-2 rounded-lg outline-none"
          />
          <input
            type="text"
            value={targetLon}
            onChange={(e) => setTargetLon(e.target.value)}
            placeholder="Target Lon..."
            className="bg-ocean-900 border border-ocean-800 text-slate-200 p-2 rounded-lg outline-none"
          />
          <button
            onClick={testCpaCollisionGuard}
            className="bg-amber-600 hover:bg-amber-500 text-white font-bold px-3 py-2 rounded-lg transition"
          >
            Calculate CPA Vectors
          </button>
        </div>

        {cpaResult && (
          <div className="bg-ocean-950 border border-ocean-800 rounded-xl p-3.5 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <span className="text-slate-400 block">Initial Distance:</span>
              <span className="font-bold text-white">{cpaResult.initial_range_nm} NM</span>
            </div>
            <div>
              <span className="text-slate-400 block">Predictive CPA:</span>
              <span className="font-bold text-amber-400">{cpaResult.cpa_nautical_miles} NM</span>
            </div>
            <div>
              <span className="text-slate-400 block">Time to CPA:</span>
              <span className="font-bold text-cyan-300">{cpaResult.tcpa_minutes} Mins</span>
            </div>
            <div>
              <span className="text-slate-400 block">Recommended Action:</span>
              <span className="font-bold text-emerald-400">{cpaResult.recommended_action}</span>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 4: ENGINE TWIN & BSFC FUEL BURN SIMULATOR */}
      <div className="bg-ocean-900 border border-ocean-800 rounded-2xl p-5 shadow-lg space-y-3">
        <h3 className="text-sm font-bold text-cyan-300 flex items-center space-x-2">
          <Fuel className="w-4 h-4 text-cyan-400" />
          <span>Hydro-Acoustic Engine Twin & Propeller Slip Calculator</span>
        </h3>

        <div className="flex items-center space-x-2 text-xs">
          <input
            type="text"
            value={distKm}
            onChange={(e) => setDistKm(e.target.value)}
            placeholder="Trip Distance in km..."
            className="flex-1 bg-ocean-950 border border-ocean-800 text-slate-200 p-2 rounded-lg outline-none"
          />
          <button
            onClick={testEngineTwin}
            className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2 rounded-lg transition"
          >
            Calculate Fuel Burn
          </button>
        </div>

        {engineResult && (
          <div className="bg-ocean-950 border border-ocean-800 rounded-xl p-3.5 text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div>
              <span className="text-slate-400 block">Fuel Rate:</span>
              <span className="font-bold text-amber-300">{engineResult.fuel_rate_liters_per_hour} L/hr</span>
            </div>
            <div>
              <span className="text-slate-400 block">Total Consumed:</span>
              <span className="font-bold text-emerald-400">{engineResult.total_fuel_consumed_liters} Liters</span>
            </div>
            <div>
              <span className="text-slate-400 block">Propeller Slip:</span>
              <span className="font-bold text-cyan-300">{engineResult.propeller_slip_pct}%</span>
            </div>
            <div>
              <span className="text-slate-400 block">Engine Load Factor:</span>
              <span className="font-bold text-white">{engineResult.effective_load_factor_pct}%</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
