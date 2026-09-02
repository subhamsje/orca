import React from 'react';
import {
  Activity,
  Clock,
  Compass,
  Navigation,
  X,
} from 'lucide-react';
import {
  MapFeature,
  VesselFeature,
  VectorZoneFeature,
  H3CellFeature,
  RouteFeature,
  IncidentFeature,
} from '../types/feature';
import { OPERATIONAL_STATE_META } from '../../design/states';
import { StatusIndicator } from '../../ui/StatusIndicator';
import { Button } from '../../ui/Button';
import { DataList, DataRow } from '../../ui/DataRow';
import { IconButton } from '../../ui/IconButton';
import { Metric } from '../../ui/Metric';

interface FeatureDetailDrawerProps {
  feature: MapFeature | null;
  onClose: () => void;
  onRecenterToFeature: (position: [number, number]) => void;
}

function formatValue(value: unknown, fallback = '—'): string {
  if (value === null || value === undefined) return fallback;
  return String(value);
}

export const FeatureDetailDrawer: React.FC<FeatureDetailDrawerProps> = ({
  feature,
  onClose,
  onRecenterToFeature,
}) => {
  if (!feature) return null;
  const stateMeta = OPERATIONAL_STATE_META[feature.state] ?? OPERATIONAL_STATE_META.NORMAL;

  const renderContent = () => {
    switch (feature.type) {
      case 'VESSEL': {
        const v = feature as VesselFeature;
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Metric label="Vessel ID" value={formatValue(v.vesselId)} />
              <Metric label="Category" value={formatValue(v.vesselType)} />
              <Metric
                label="Speed / heading"
                value={
                  v.speedKnots === null || v.headingDeg === null
                    ? '—'
                    : `${v.speedKnots} kn @ ${v.headingDeg}°`
                }
              />
              <Metric
                label="Risk"
                value={typeof v.riskScore === 'number' ? `${v.riskScore}/100` : '—'}
              />
            </div>
            {typeof v.lengthM === 'number' && (
              <DataList>
                <DataRow label="Length" value={`${v.lengthM} m`} />
                {v.callSign && <DataRow label="Call sign" value={v.callSign} />}
              </DataList>
            )}
          </div>
        );
      }

      case 'ZONE':
      case 'IMBL': {
        const z = feature as VectorZoneFeature;
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <Metric label="Zone classification" value={formatValue(z.zoneType)} />
              <Metric
                label="Distance"
                value={
                  typeof z.distanceKm === 'number'
                    ? `${z.distanceKm} km`
                    : typeof z.radiusKm === 'number'
                      ? `${z.radiusKm} km`
                      : '—'
                }
              />
            </div>
            {typeof z.hsiScore === 'number' && (
              <div className="bg-ocean-950 p-3 rounded-xl border border-ocean-800">
                <p className="text-[11px] uppercase tracking-wider text-ink-muted font-bold">
                  HSI habitat index
                </p>
                <p className="text-emerald-300 font-bold text-lg">{z.hsiScore}/100</p>
                {z.targetSpecies && z.targetSpecies.length > 0 && (
                  <p className="text-slate-300 text-xs mt-1 truncate">
                    Species: {z.targetSpecies.join(', ')}
                  </p>
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
            <div className="grid grid-cols-2 gap-2">
              <Metric label="H3 index" value={h3.h3Index} />
              <Metric label="Resolution" value={`Res ${h3.resolution}`} />
            </div>
            {typeof h3.hsiValue === 'number' && (
              <div className="bg-ocean-950 p-3 rounded-xl border border-ocean-800">
                <p className="text-[11px] uppercase tracking-wider text-ink-muted font-bold">
                  Cell HSI suitability
                </p>
                <p className="text-emerald-300 font-bold text-lg">{h3.hsiValue}/100</p>
              </div>
            )}
          </div>
        );
      }

      case 'ROUTE': {
        const r = feature as RouteFeature;
        return (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <Metric label="Distance" value={`${r.distanceKm} km`} />
              <Metric label="Duration" value={`${r.durationMins} min`} />
              <Metric label="Fuel" value={`${r.fuelLiters} L`} />
            </div>
            {r.avoidedHazards.length > 0 && (
              <DataList>
                <DataRow label="Avoided" value={r.avoidedHazards.join(', ')} />
              </DataList>
            )}
          </div>
        );
      }

      case 'INCIDENT': {
        const inc = feature as IncidentFeature;
        return (
          <div className="space-y-3">
            <div className="bg-red-950/60 border border-red-800 p-3 rounded-xl">
              <p className="font-bold text-red-300 uppercase text-xs">{inc.severity} severity</p>
              <p className="text-slate-200 text-xs mt-1">{inc.description}</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Metric label="Incident type" value={formatValue(inc.incidentType)} />
              <Metric
                label="Search radius"
                value={typeof inc.searchRadiusKm === 'number' ? `${inc.searchRadiusKm} km` : '—'}
              />
            </div>
          </div>
        );
      }

      default:
        return null;
    }
  };

  return (
    <aside
      role="region"
      aria-label="Selected feature details"
      className="absolute bottom-4 left-3 right-3 sm:left-auto sm:right-4 z-[1000] w-auto sm:w-full sm:max-w-sm bg-ocean-975/95 border border-ocean-800 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden"
    >
      <header className="p-4 border-b border-ocean-800 flex items-center justify-between bg-ocean-900/80">
        <div className="flex items-center gap-2 min-w-0">
          <Activity className="w-5 h-5 text-cyan-400 shrink-0" aria-hidden="true" />
          <div className="min-w-0">
            <h3 className="text-sm font-bold text-white tracking-tight truncate flex items-center gap-1.5">
              <span className="truncate">{feature.name}</span>
              {feature.isDemoData && (
                <span className="text-[8px] bg-purple-950 text-purple-300 border border-purple-800 px-1 py-0.5 rounded font-black uppercase">
                  Demo
                </span>
              )}
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              {feature.position[0].toFixed(4)}°N, {feature.position[1].toFixed(4)}°E
            </p>
          </div>
        </div>
        <IconButton label="Close feature details" icon={<X />} variant="ghost" size="sm" onClick={onClose} />
      </header>

      <div className="px-4 py-2 bg-ocean-900/40 border-b border-ocean-900 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5">
          <span className="font-bold text-slate-400">State:</span>
          <StatusIndicator state={feature.state} label={stateMeta.label} />
        </div>
        <div className="flex items-center gap-1 text-slate-400 text-[11px]">
          <Clock className="w-3 h-3 text-cyan-400" aria-hidden="true" />
          <span>{feature.lastUpdatedText ?? feature.freshness}</span>
        </div>
      </div>

      <div className="p-4">{renderContent()}</div>

      <footer className="p-3 border-t border-ocean-800 bg-ocean-900/80 flex items-center justify-between gap-2">
        {feature.source && (
          <p className="text-[10px] text-ink-subtle truncate flex items-center gap-1 min-w-0">
            <Compass className="w-3 h-3 shrink-0" aria-hidden="true" />
            <span className="truncate">{feature.source}</span>
          </p>
        )}
        <Button
          variant="primary"
          size="sm"
          leadingIcon={<Navigation className="w-3.5 h-3.5" />}
          onClick={() => onRecenterToFeature(feature.position)}
          className="shrink-0"
        >
          Center
        </Button>
      </footer>
    </aside>
  );
};