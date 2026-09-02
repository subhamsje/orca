import React from 'react';
import { Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { VesselFeature } from '../../types/feature';
import { vesselColor } from '../../theme';

interface VesselLayerRendererProps {
  vessels: ReadonlyArray<VesselFeature>;
  selectedFeatureId: string | null;
  onSelectFeature: (feature: VesselFeature) => void;
}

const SVG_ARROW = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 19 21 12 17 5 21 12 2"/></svg>`;

function createVesselIcon(vessel: VesselFeature, isSelected: boolean): L.DivIcon {
  const color = vesselColor(vessel.state);
  const rotate = typeof vessel.headingDeg === 'number' ? `transform: rotate(${vessel.headingDeg}deg);` : '';
  const ring = isSelected
    ? 'outline outline-2 outline-cyan-400 outline-offset-2 scale-110'
    : '';

  const html = `
    <div class="relative flex items-center justify-center transition ${ring}" aria-hidden="true">
      <div class="text-white p-2 rounded-full shadow-xl border-2" style="background-color:${color};border-color:${color};">
        <span style="${rotate} display:inline-block;">${SVG_ARROW}</span>
      </div>
      ${
        vessel.isDemoData
          ? '<span class="absolute -top-2 -right-2 bg-purple-900 text-purple-300 text-[8px] font-black px-1 rounded border border-purple-700">SIM</span>'
          : ''
      }
    </div>`;

  return L.divIcon({
    className: 'custom-vessel-leaflet-icon',
    html,
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
        const icon = createVesselIcon(vessel, isSelected);
        return (
          <Marker
            key={vessel.id}
            position={vessel.position}
            icon={icon}
            eventHandlers={{ click: () => onSelectFeature(vessel) }}
            aria-label={`Vessel ${vessel.name}`}
            keyboard
            title={vessel.name}
          >
            <Popup>
              <div className="p-2 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-cyan-400 truncate">{vessel.name}</h4>
                  {vessel.isDemoData && (
                    <span className="text-[9px] bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded font-bold">
                      DEMO / SIMULATION
                    </span>
                  )}
                </div>
                <p className="text-slate-300 font-mono">ID: {vessel.vesselId}</p>
                {vessel.speedKnots !== null && (
                  <p className="text-slate-300">
                    Speed: <strong>{vessel.speedKnots} kn</strong>
                    {vessel.headingDeg !== null && (
                      <>
                        {' · '}
                        Heading: <strong>{vessel.headingDeg}°</strong>
                      </>
                    )}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => onSelectFeature(vessel)}
                  className="w-full mt-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1 px-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  Inspect vessel
                </button>
              </div>
            </Popup>
          </Marker>
        );
      })}
    </>
  );
};