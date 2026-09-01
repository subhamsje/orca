import React, { useState } from 'react';
import { ShieldCheck, Anchor, Radio, AlertTriangle, Compass, LifeBuoy } from 'lucide-react';

export const AuthorityView: React.FC = () => {
  const [sarResults, setSarResults] = useState<any>(null);
  const [isSimulating, setIsSimulating] = useState(false);

  const fleetData = [
    { id: 'IND-MH-04-892', type: 'Mechanized Trawler (12m)', status: 'SAFE AT SEA', distIMBL: '14.2 km', risk: 22 },
    { id: 'IND-MH-04-102', type: 'Fiberglass Canoe (7m)', status: 'RETURNING HARBOR', distIMBL: '22.8 km', risk: 45 },
    { id: 'IND-GA-01-445', type: 'Gillnetter (9m)', status: 'ENGINE FAILURE (DISTRESS)', distIMBL: '4.1 km', risk: 95 },
  ];

  const handleSimulateSAR = async () => {
    setIsSimulating(true);
    try {
      const response = await fetch('http://localhost:8000/api/v1/sar-drift', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ last_known_lat: 16.0215, last_known_lon: 73.4821, drift_hours: 6.0 }),
      });
      const data = await response.json();
      setSarResults(data);
    } catch (e) {
      console.warn('SAR simulation offline fallback');
      setSarResults({
        drift_duration_hours: 6.0,
        simulated_particles: 1000,
        drift_centroid: [15.99873, 73.61057],
        prioritized_search_radius_km: 0.94,
        sar_helipad_dispatch_recommendation: 'Coast Guard Air Enclave Ratnagiri',
      });
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="p-4 max-w-4xl mx-auto space-y-6">
      {/* Command Center Title Header */}
      <div className="bg-ocean-900/90 border border-ocean-800 rounded-2xl p-5 flex items-center justify-between shadow-xl">
        <div className="flex items-center space-x-3">
          <div className="bg-emerald-900/80 text-emerald-400 p-3 rounded-xl">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Coastal Authority & Harbor Command View</h2>
            <p className="text-xs text-slate-400">Indian Coast Guard & Department of Fisheries Fleet Radar</p>
          </div>
        </div>
        <button
          onClick={handleSimulateSAR}
          className="bg-red-600 hover:bg-red-500 text-white text-xs font-bold px-3.5 py-2 rounded-xl flex items-center space-x-1.5 shadow-lg transition"
        >
          <LifeBuoy className="w-4 h-4 animate-spin" />
          <span>{isSimulating ? 'Simulating...' : 'Run SAR Drift Engine'}</span>
        </button>
      </div>

      {/* SAR Monte Carlo Simulation Results Card */}
      {sarResults && (
        <div className="bg-red-950/80 border-2 border-red-600 rounded-2xl p-5 shadow-2xl space-y-3">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-6 h-6 text-red-400 animate-bounce" />
            <h3 className="text-base font-bold text-red-100 uppercase">
              1,000-Particle Monte Carlo SAR Drift Trajectory Result
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="bg-ocean-950 p-3 rounded-xl border border-red-900/80">
              <span className="text-slate-400 block font-semibold">Drift Centroid</span>
              <span className="text-red-300 font-bold font-mono">
                {sarResults.drift_centroid[0]}, {sarResults.drift_centroid[1]}
              </span>
            </div>
            <div className="bg-ocean-950 p-3 rounded-xl border border-red-900/80">
              <span className="text-slate-400 block font-semibold">Search Radius (95% Conf)</span>
              <span className="text-amber-300 font-bold">
                {sarResults.prioritized_search_radius_km} km
              </span>
            </div>
            <div className="bg-ocean-950 p-3 rounded-xl border border-red-900/80">
              <span className="text-slate-400 block font-semibold">Helicopter Dispatch</span>
              <span className="text-white font-bold">
                {sarResults.sar_helipad_dispatch_recommendation}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Fleet Monitoring Table */}
      <div className="bg-ocean-900/80 border border-ocean-800 rounded-2xl overflow-hidden shadow-xl">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-ocean-950 text-slate-400 text-xs uppercase font-bold border-b border-ocean-800">
              <th className="p-3.5">Vessel Identifier</th>
              <th className="p-3.5">Vessel Category</th>
              <th className="p-3.5">Dist to IMBL</th>
              <th className="p-3.5">Seaworthiness</th>
              <th className="p-3.5">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ocean-800/60 text-sm">
            {fleetData.map((craft) => (
              <tr key={craft.id} className="hover:bg-ocean-800/40 transition">
                <td className="p-3.5 font-mono font-bold text-cyan-300">{craft.id}</td>
                <td className="p-3.5 text-slate-300">{craft.type}</td>
                <td className="p-3.5 font-medium text-slate-200">{craft.distIMBL}</td>
                <td className="p-3.5">
                  <span
                    className={`font-bold text-xs px-2.5 py-1 rounded-md ${
                      craft.risk > 60
                        ? 'bg-red-950 text-red-400 border border-red-800'
                        : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                    }`}
                  >
                    Risk {craft.risk}/100
                  </span>
                </td>
                <td className="p-3.5 font-bold text-xs text-slate-200">{craft.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
