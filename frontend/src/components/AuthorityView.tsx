import React from 'react';
import { ShieldCheck, Anchor, Radio, AlertTriangle } from 'lucide-react';

export const AuthorityView: React.FC = () => {
  const fleetData = [
    { id: 'IND-MH-04-892', type: 'Mechanized Trawler (12m)', status: 'SAFE AT SEA', distIMBL: '14.2 km', risk: 22 },
    { id: 'IND-MH-04-102', type: 'Fiberglass Canoe (7m)', status: 'RETURNING HARBOR', distIMBL: '22.8 km', risk: 45 },
    { id: 'IND-GA-01-445', type: 'Gillnetter (9m)', status: 'IMBL BUFFER WARN', distIMBL: '4.1 km', risk: 68 },
  ];

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
        <span className="text-xs bg-emerald-950 text-emerald-400 border border-emerald-800 px-3 py-1 rounded-full font-mono font-bold">
          3 FLEET CRAFT ACTIVE
        </span>
      </div>

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
                        ? 'bg-amber-950 text-amber-400 border border-amber-800'
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
