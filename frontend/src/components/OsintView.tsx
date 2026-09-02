import React, { useEffect, useState } from 'react';
import { Eye, ShieldAlert, Satellite, TrendingUp, Radio, CheckCircle, RefreshCw } from 'lucide-react';

export const OsintView: React.FC = () => {
  const [intelData, setIntelData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchOsintIntel = async () => {
    setLoading(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/osint/summary');
      if (res.ok) {
        const data = await res.json();
        setIntelData(data);
      }
    } catch (e) {
      console.error('Failed to fetch OSINT intel:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOsintIntel();
  }, []);

  return (
    <div className="p-4 space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-purple-950 via-ocean-900 to-ocean-950 border border-purple-800 rounded-2xl p-6 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="bg-purple-600 p-3 rounded-xl text-white shadow-md">
            <Eye className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center space-x-2">
              <span>Maritime OSINT Intelligence Hub</span>
              <span className="text-xs bg-purple-900 text-purple-300 px-2 py-0.5 rounded-full border border-purple-700 font-medium">
                OPEN SOURCE INTEL
              </span>
            </h2>
            <p className="text-xs text-slate-300">
              NASA VIIRS Nightlights • ESA Copernicus Sentinel-1 • AGMARKNET Market Rates • DGLL Radio Mesh
            </p>
          </div>
        </div>

        <button
          onClick={fetchOsintIntel}
          disabled={loading}
          className="flex items-center space-x-1.5 bg-purple-900 hover:bg-purple-800 text-purple-200 text-xs font-bold px-3 py-2 rounded-xl border border-purple-700 transition"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          <span>Refresh Feeds</span>
        </button>
      </div>

      {/* Grid Layout for Intel Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Active Security Advisories & Notice to Mariners */}
        <div className="bg-ocean-900 border border-ocean-800 rounded-2xl p-5 shadow-lg space-y-3">
          <h3 className="text-sm font-bold text-amber-400 flex items-center space-x-2">
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            <span>Active Maritime Security Advisories</span>
          </h3>

          <div className="space-y-2.5">
            {intelData?.advisories?.map((adv: any, idx: number) => (
              <div
                key={idx}
                className="bg-ocean-950/80 border border-amber-900/50 rounded-xl p-3.5 space-y-1.5"
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-amber-300">{adv.type}</span>
                  <span className="text-[10px] bg-red-950 text-red-400 border border-red-800 px-2 py-0.5 rounded font-bold uppercase">
                    {adv.severity}
                  </span>
                </div>
                <p className="text-xs text-slate-200">{adv.description}</p>
                <p className="text-[11px] text-slate-400 font-medium">Source: {adv.source}</p>
              </div>
            )) || (
              <div className="text-xs text-slate-400 p-4 text-center">Loading security advisories...</div>
            )}
          </div>
        </div>

        {/* Card 2: AGMARKNET Open Government Wholesale Rates */}
        <div className="bg-ocean-900 border border-ocean-800 rounded-2xl p-5 shadow-lg space-y-3">
          <h3 className="text-sm font-bold text-emerald-400 flex items-center space-x-2">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>AGMARKNET Marine Wholesale Rates (INR/kg)</span>
          </h3>

          <div className="space-y-2 text-xs">
            {intelData?.market_intelligence &&
              Object.entries(intelData.market_intelligence).map(([port, info]: [string, any]) => (
                <div
                  key={port}
                  className="bg-ocean-950/80 border border-ocean-800 rounded-xl p-3 flex items-center justify-between"
                >
                  <div>
                    <h4 className="font-bold text-slate-200">{port}</h4>
                    <p className="text-[10px] text-slate-400">Updated: {info.updated_at}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-emerald-400 font-bold">Surmai: ₹{info.Surmai}/kg</span>
                    <br />
                    <span className="text-cyan-300 font-medium">Bangda: ₹{info.Bangda}/kg</span>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Card 3: Satellite EO & SDR Sensor Feeds Matrix */}
      <div className="bg-ocean-900 border border-ocean-800 rounded-2xl p-5 shadow-lg space-y-3">
        <h3 className="text-sm font-bold text-cyan-300 flex items-center space-x-2">
          <Satellite className="w-4 h-4 text-cyan-400" />
          <span>Active Open Source Intelligence Sensor Pipelines</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <div className="bg-ocean-950 p-3.5 rounded-xl border border-ocean-800 space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>NASA VIIRS Nightlights</span>
            </div>
            <p className="text-[11px] text-slate-400">Night-trawler light rig anomaly detection</p>
          </div>

          <div className="bg-ocean-950 p-3.5 rounded-xl border border-ocean-800 space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400">
              <CheckCircle className="w-3.5 h-3.5" />
              <span>ESA Sentinel-1 SAR</span>
            </div>
            <p className="text-[11px] text-slate-400">Dark fleet C-Band radar cross-section matching</p>
          </div>

          <div className="bg-ocean-950 p-3.5 rounded-xl border border-ocean-800 space-y-1">
            <div className="flex items-center space-x-1.5 text-xs font-bold text-emerald-400">
              <Radio className="w-3.5 h-3.5" />
              <span>DGLL SDR Radio Mesh</span>
            </div>
            <p className="text-[11px] text-slate-400">Coastal amateur radio VHF emergency distress listening</p>
          </div>
        </div>
      </div>
    </div>
  );
};
