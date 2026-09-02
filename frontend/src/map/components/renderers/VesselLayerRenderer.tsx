import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { VesselFeature } from '../../types/feature';

interface VesselLayerRendererProps {
  vessels: VesselFeature[];
  selectedFeatureId: string | null;
  onSelectFeature: (feature: VesselFeature) => void;
}

/**
 * Creates custom SVG icon for vessel markers communicating state & heading direction.
 */
function createVesselSvgIcon(vessel: VesselFeature, isSelected: boolean) {
  let stateBgClass = 'bg-emerald-500 border-emerald-300';
  if (vessel.state === 'CRITICAL' || vessel.state === 'HIGH_RISK') {
    stateBgClass = 'bg-red-500 border-red-300 animate-pulse';
  } else if (vessel.state === 'WARNING' || vessel.state === 'CAUTION') {
    stateBgClass = 'bg-amber-500 border-amber-300';
  } else if (vessel.state === 'OFFLINE' || vessel.state === 'STALE') {
    stateBgClass = 'bg-slate-600 border-slate-400';
  }

  const selectedRing = isSelected ? 'ring-4 ring-cyan-400 ring-offset-2 ring-offset-ocean-950 scale-110' : '';
  const transformRotation = `transform: rotate(${vessel.headingDeg}deg);`;

  const htmlContent = `
    <div class="relative flex items-center justify-center transition-all duration-300 ${selectedRing}">
      <div class="${stateBgClass} text-white p-2 rounded-full shadow-2xl border-2 flex items-center justify-center">
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="${transformRotation}">
          <polygon points="12 2 19 21 12 17 5 21 12 2"/>
        </svg>
      </div>
      ${
        vessel.isDemoData
          ? '<span class="absolute -top-2 -right-2 bg-purple-900 text-purple-300 text-[8px] font-black px-1 rounded border border-purple-700">SIM</span>'
          : ''
      }
    </div>
  `;

  return L.divIcon({
    className: 'custom-vessel-leaflet-icon',
    html: htmlContent,
    iconSize: [36, 36],
    iconAnchor: [18, 18],
  });
}

export const VesselLayerRenderer: React.FC<VesselLayerRendererProps> = ({
  vessels,
  selectedFeatureId,
  onSelectFeature,
}) => {
  return (
    <>
      {vessels.map((vessel) => {
        const isSelected = selectedFeatureId === vessel.id;
        const icon = createVesselSvgIcon(vessel, isSelected);

        return (
          <Marker
            key={vessel.id}
            position={vessel.position}
            icon={icon}
            eventHandlers={{
              click: () => onSelectFeature(vessel),
            }}
          >
            <Popup>
              <div className="p-2 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-cyan-400">{vessel.name}</h4>
                  {vessel.isDemoData && (
                    <span className="text-[9px] bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded font-bold">
                      DEMO / SIMULATION
                    </span>
                  )}
                </div>
                <p className="text-slate-300 font-mono">ID: {vessel.vesselId}</p>
                <p className="text-slate-300">
                  Speed: <strong>{vessel.speedKnots} knots</strong> | Heading: <strong>{vessel.headingDeg}°</strong>
                </p>
                <p className="text-slate-400">Status: <strong className="uppercase">{vessel.state}</strong></p>
                <button
                  onClick={() => onSelectFeature(vessel)}
                  className="w-full mt-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1 px-2 rounded"
                >
                  Inspect Vessel Details
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};
