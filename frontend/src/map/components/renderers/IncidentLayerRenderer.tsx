import React from 'react';
import { Circle, Marker, Popup, Tooltip } from 'react-leaflet';
import L from 'leaflet';
import { IncidentFeature } from '../../types/feature';

interface IncidentLayerRendererProps {
  incidents: IncidentFeature[];
  selectedFeatureId: string | null;
  onSelectFeature: (feature: IncidentFeature) => void;
}

const sarIcon = L.divIcon({
  className: 'custom-sar-icon',
  html: `<div class="bg-red-600 text-white p-2 rounded-full shadow-2xl border-2 border-white animate-bounce"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="m12 8-4 8 4-2 4 2-4-8z"/></svg></div>`,
  iconSize: [34, 34],
  iconAnchor: [17, 17],
});

export const IncidentLayerRenderer: React.FC<IncidentLayerRendererProps> = ({
  incidents,
  selectedFeatureId,
  onSelectFeature,
}) => {
  return (
    <>
      {incidents.map((inc) => {
        const isSelected = selectedFeatureId === inc.id;

        return (
          <React.Fragment key={inc.id}>
            {/* Search Radius Circle for SAR Drift */}
            {inc.searchRadiusKm && (
              <Circle
                center={inc.position}
                radius={inc.searchRadiusKm * 1000}
                pathOptions={{
                  color: '#ef4444',
                  fillColor: '#ef4444',
                  fillOpacity: isSelected ? 0.35 : 0.18,
                  weight: 2,
                  dashArray: '4, 4',
                }}
              />
            )}

            <Marker
              position={inc.position}
              icon={sarIcon}
              eventHandlers={{
                click: () => onSelectFeature(inc),
              }}
            >
              <Tooltip permanent direction="top">
                <span className="font-bold text-xs text-red-400">{inc.name}</span>
              </Tooltip>
              <Popup>
                <div className="p-2 space-y-1 text-xs">
                  <div className="flex items-center justify-between">
                    <h4 className="font-bold text-red-400">{inc.name}</h4>
                    {inc.isDemoData && (
                      <span className="text-[9px] bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded font-bold">
                        DEMO / SIMULATION
                      </span>
                    )}
                  </div>
                  <p className="text-slate-300">{inc.description}</p>
                  <p className="text-slate-400">Source: {inc.source}</p>
                  <button
                    onClick={() => onSelectFeature(inc)}
                    className="w-full mt-2 bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-2 rounded"
                  >
                    Inspect Incident & SAR Plan
                  </button>
                </div>
              </Popup>
            </Marker>
          </React.Fragment>
        );
      })}
    </>
  );
};
