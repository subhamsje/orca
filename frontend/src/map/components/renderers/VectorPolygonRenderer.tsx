import React from 'react';
import { Polygon, Polyline, Popup, Tooltip } from 'react-leaflet';
import { VectorZoneFeature } from '../../types/feature';

interface VectorPolygonRendererProps {
  zones: VectorZoneFeature[];
  selectedFeatureId: string | null;
  onSelectFeature: (feature: VectorZoneFeature) => void;
}

export const VectorPolygonRenderer: React.FC<VectorPolygonRendererProps> = ({
  zones,
  selectedFeatureId,
  onSelectFeature,
}) => {
  return (
    <>
      {zones.map((zone) => {
        const isSelected = selectedFeatureId === zone.id;

        if (zone.type === 'IMBL') {
          // Render IMBL line
          return (
            <Polyline
              key={zone.id}
              positions={zone.polygonCoordinates}
              pathOptions={{
                color: '#f59e0b',
                weight: isSelected ? 5 : 3.5,
                dashArray: '8, 8',
              }}
              eventHandlers={{
                click: () => onSelectFeature(zone),
              }}
            >
              <Tooltip permanent direction="center">
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider">
                  {zone.name}
                </span>
              </Tooltip>
            </Polyline>
          );
        }

        // Render Polygons (Naval restricted, PFZ grounds, Marine reserves)
        let strokeColor = '#3b82f6';
        let fillColor = '#3b82f6';
        if (zone.zoneType === 'NAVAL_RESTRICTED') {
          strokeColor = '#ef4444';
          fillColor = '#ef4444';
        } else if (zone.zoneType === 'PFZ_GROUND') {
          strokeColor = '#10b981';
          fillColor = '#10b981';
        }

        return (
          <Polygon
            key={zone.id}
            positions={zone.polygonCoordinates}
            pathOptions={{
              color: strokeColor,
              fillColor: fillColor,
              fillOpacity: isSelected ? 0.45 : 0.2,
              weight: isSelected ? 3.5 : 2,
              dashArray: zone.zoneType === 'NAVAL_RESTRICTED' ? '6, 6' : undefined,
            }}
            eventHandlers={{
              click: () => onSelectFeature(zone),
            }}
          >
            <Popup>
              <div className="p-2 space-y-1 text-xs">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-slate-200">{zone.name}</h4>
                  {zone.isDemoData && (
                    <span className="text-[9px] bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded font-bold">
                      DEMO / SIMULATION
                    </span>
                  )}
                </div>
                <p className="text-slate-400">Type: <strong className="uppercase">{zone.zoneType}</strong></p>
                {zone.hsiScore && (
                  <p className="text-emerald-400 font-bold">HSI Score: {zone.hsiScore}/100</p>
                )}
                {zone.targetSpecies && (
                  <p className="text-slate-300">Species: {zone.targetSpecies.join(', ')}</p>
                )}
                <button
                  onClick={() => onSelectFeature(zone)}
                  className="w-full mt-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1 px-2 rounded"
                >
                  View Boundary Details
                </button>
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </>
  );
};
