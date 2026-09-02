import React from 'react';
import { Circle, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import { IncidentFeature } from '../../types/feature';
import { MAP_THEME } from '../../theme';

interface IncidentLayerRendererProps {
  incidents: ReadonlyArray<IncidentFeature>;
  selectedFeatureId: string | null;
  onSelectFeature: (feature: IncidentFeature) => void;
}

const incidentIcon = L.divIcon({
  className: 'custom-incident-icon',
  html: `<div class="bg-red-600 text-white p-2 rounded-full shadow-2xl border-2 border-white" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="m12 8-4 8 4-2 4 2-4-8z"/></svg></div>`,
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
        const color = MAP_THEME.incident[inc.incidentType] ?? MAP_THEME.incident.SAR_DRIFT;
        return (
          <React.Fragment key={inc.id}>
            {typeof inc.searchRadiusKm === 'number' && (
              <Circle
                center={inc.position}
                radius={inc.searchRadiusKm * 1000}
                pathOptions={{
                  color,
                  fillColor: color,
                  fillOpacity: isSelected ? 0.35 : 0.18,
                  weight: 2,
                  dashArray: '4, 4',
                }}
              />
            )}
            <Marker
              position={inc.position}
              icon={incidentIcon}
              eventHandlers={{ click: () => onSelectFeature(inc) }}
              title={inc.name}
              aria-label={inc.name}
            >
              <Popup>
                <div className="p-2 space-y-1 text-xs">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-bold text-red-700 truncate">{inc.name}</h4>
                    {inc.isDemoData && (
                      <span className="text-[9px] bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded font-bold">
                        DEMO
                      </span>
                    )}
                  </div>
                  <p className="text-slate-700">{inc.description}</p>
                  <button
                    type="button"
                    onClick={() => onSelectFeature(inc)}
                    className="w-full mt-2 bg-red-600 hover:bg-red-500 text-white font-bold py-1 px-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-red-400"
                  >
                    Inspect incident
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