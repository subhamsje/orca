import React from 'react';
import { MapFeature, VesselFeature, VectorZoneFeature, H3CellFeature, RouteFeature, IncidentFeature } from '../types/feature';
import { X, Navigation, Shield, Clock, Anchor, Activity, Zap, ShieldAlert } from 'lucide-react';
import { OPERATIONAL_STATE_META } from '../../design/states';

interface FeatureDetailDrawerProps {
  feature: MapFeature | null;
  onClose: () => void;
  onRecenterToFeature: (position: [number, number]) => void;
}

export const FeatureDetailDrawer: React.FC<FeatureDetailDrawerProps> = ({
  feature,
  onClose,
  onRecenterToFeature,
}) => {
  if (!feature) return null;

  const stateMeta = OPERATIONAL_STATE_META[feature.state] || OPERATIONAL_STATE_META.NORMAL;

  const renderContent = () => {
    switch (feature.type) {
      case 'VESSEL': {
        const v = feature as VesselFeature;
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-ocean-950 p-2.5 rounded-xl border border-ocean-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Vessel ID</span>
                <span className="font-mono font-bold text-slate-200">{v.vesselId}</span>
              </div>
              <div className="bg-ocean-950 p-2.5 rounded-xl border border-ocean-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Vessel Category</span>
                <span className="font-bold text-cyan-400">{v.vesselType}</span>
              </div>
              <div className="bg-ocean-950 p-2.5 rounded-xl border border-ocean-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Speed / Heading</span>
                <span className="font-bold text-emerald-400">{v.speedKnots} kn @ {v.headingDeg}°</span>
              </div>
              <div className="bg-ocean-950 p-2.5 rounded-xl border border-ocean-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Seaworthiness Risk</span>
                <span className="font-bold text-amber-400">{v.riskScore}/100</span>
              </div>
            </div>
            <div className="bg-ocean-950 p-3 rounded-xl border border-ocean-800 text-xs">
              <span className="text-slate-400 block text-[10px] uppercase font-bold">Length / Engine</span>
              <span className="text-slate-200 font-bold">{v.lengthM}m Length | {v.engineHp || 9.9} HP Engine</span>
            </div>
          </div>
        );
      }

      case 'ZONE':
      case 'IMBL': {
        const z = feature as VectorZoneFeature;
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-ocean-950 p-2.5 rounded-xl border border-ocean-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Zone Classification</span>
                <span className="font-bold text-cyan-400">{z.zoneType}</span>
              </div>
              <div className="bg-ocean-950 p-2.5 rounded-xl border border-ocean-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Distance</span>
                <span className="font-bold text-amber-400">{z.distanceKm || z.radiusKm || 12.5} km</span>
              </div>
            </div>

            {z.hsiScore && (
              <div className="bg-ocean-950 p-3 rounded-xl border border-ocean-800 text-xs">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">HSI Habitat Index</span>
                <span className="text-emerald-400 font-black text-lg">{z.hsiScore}/100</span>
                {z.targetSpecies && (
                  <span className="text-slate-300 block mt-1">Species: {z.targetSpecies.join(', ')}</span>
                )}
              </div>
            )}
          </div>
        );
      }

      case 'H3_CELL': {
        const h3 = feature as H3CellFeature;
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-ocean-950 p-2.5 rounded-xl border border-ocean-800 font-mono">
                <span className="text-slate-400 block text-[10px] uppercase font-bold font-sans">H3 Index</span>
                <span className="font-bold text-cyan-400">{h3.h3Index}</span>
              </div>
              <div className="bg-ocean-950 p-2.5 rounded-xl border border-ocean-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">H3 Resolution</span>
                <span className="font-bold text-slate-200">Res {h3.resolution} (~1.2 km²)</span>
              </div>
            </div>
            {h3.hsiValue && (
              <div className="bg-ocean-950 p-3 rounded-xl border border-ocean-800 text-xs">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Cell HSI Suitability</span>
                <span className="text-emerald-400 font-black text-lg">{h3.hsiValue}/100</span>
              </div>
            )}
          </div>
        );
      }

      case 'ROUTE': {
        const r = feature as RouteFeature;
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="bg-ocean-950 p-2.5 rounded-xl border border-ocean-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Distance</span>
                <span className="font-bold text-cyan-400">{r.distanceKm} km</span>
              </div>
              <div className="bg-ocean-950 p-2.5 rounded-xl border border-ocean-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Est Duration</span>
                <span className="font-bold text-emerald-400">{r.durationMins} mins</span>
              </div>
              <div className="bg-ocean-950 p-2.5 rounded-xl border border-ocean-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Est Diesel</span>
                <span className="font-bold text-amber-400">{r.fuelLiters} L</span>
              </div>
            </div>

            {r.avoidedHazards && r.avoidedHazards.length > 0 && (
              <div className="bg-ocean-950 p-3 rounded-xl border border-ocean-800 text-xs">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Avoided Hazards</span>
                <span className="text-emerald-300 font-bold">{r.avoidedHazards.join(', ')}</span>
              </div>
            )}
          </div>
        );
      }

      case 'INCIDENT': {
        const inc = feature as IncidentFeature;
        return (
          <div className="space-y-3">
            <div className="bg-red-950/60 border border-red-800 p-3 rounded-xl text-xs space-y-1">
              <span className="font-bold text-red-300 uppercase block">{inc.severity} SEVERITY INCIDENT</span>
              <p className="text-slate-200">{inc.description}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-ocean-950 p-2.5 rounded-xl border border-ocean-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Incident Type</span>
                <span className="font-bold text-cyan-400">{inc.incidentType}</span>
              </div>
              <div className="bg-ocean-950 p-2.5 rounded-xl border border-ocean-800">
                <span className="text-slate-400 block text-[10px] uppercase font-bold">Search Radius</span>
                <span className="font-bold text-amber-400">{inc.searchRadiusKm || 0.94} km</span>
              </div>
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <div className="absolute bottom-4 right-4 z-[1000] w-full max-w-sm bg-ocean-950/95 border border-ocean-800 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-ocean-800 flex items-center justify-between bg-ocean-900/80">
        <div className="flex items-center space-x-2">
          <Activity className="w-5 h-5 text-cyan-400" />
          <div>
            <h3 className="text-sm font-bold text-white tracking-tight flex items-center space-x-1.5">
              <span>{feature.name}</span>
              {feature.isDemoData && (
                <span className="text-[8px] bg-purple-950 text-purple-300 border border-purple-800 px-1 py-0.5 rounded font-black">
                  SIM
                </span>
              )}
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              {feature.position[0].toFixed(4)}°N, {feature.position[1].toFixed(4)}°E
            </span>
          </div>
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* State & Data Freshness Badges */}
      <div className="px-4 py-2 bg-ocean-900/40 border-b border-ocean-900 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-1.5">
          <span className="font-bold text-slate-400">State:</span>
          <span className="font-bold text-cyan-300 uppercase">{stateMeta.label}</span>
        </div>
        <div className="flex items-center space-x-1 text-slate-400 text-[11px]">
          <Clock className="w-3 h-3 text-cyan-400" />
          <span>{feature.lastUpdatedText || feature.freshness}</span>
        </div>
      </div>

      {/* Dynamic Feature Domain Body */}
      <div className="p-4">{renderContent()}</div>

      {/* Action Footer */}
      <div className="p-3 border-t border-ocean-800 bg-ocean-900/80 flex items-center justify-between gap-2">
        <button
          onClick={() => onRecenterToFeature(feature.position)}
          className="flex-1 bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold py-2 rounded-xl shadow-md transition flex items-center justify-center space-x-1.5"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Center Viewport</span>
        </button>
      </div>
    </div>
  );
};
