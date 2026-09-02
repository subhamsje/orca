import React from 'react';
import { Circle, Marker, Polygon, Polyline, Popup } from 'react-leaflet';
import L from 'leaflet';
import { VectorZoneFeature } from '../../types/feature';
import { MAP_THEME } from '../../theme';

interface VectorPolygonRendererProps {
  zones: ReadonlyArray<VectorZoneFeature>;
  selectedFeatureId: string | null;
  onSelectFeature: (feature: VectorZoneFeature) => void;
}

/**
 * Probe icon — used when a zone is a single-point feature (e.g. an IMBL
 * proximity reference that the backend hasn't yet provided polygon
 * geometry for).
 */
const probeIcon = L.divIcon({
  className: 'custom-zone-probe',
  html: `<div class="bg-amber-600 text-white p-1.5 rounded-full border-2 border-amber-300 shadow-lg" aria-hidden="true"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>`,
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

function zoneColor(z: VectorZoneFeature): string {
  if (z.type === 'IMBL') return MAP_THEME.zone.IMBL;
  return MAP_THEME.zone[z.zoneType] ?? '#3b82f6';
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
        const color = zoneColor(zone);
        const polygon = zone.polygonCoordinates;
        const isProbe = polygon.length === 1;

        // Probe (single-point) zones: marker with a small reference circle
        // around it, never pretending we know the actual boundary.
        if (isProbe) {
          const [centerLat, centerLon] = polygon[0];
          const radius = typeof zone.radiusKm === 'number' ? zone.radiusKm : 5;
          return (
            <React.Fragment key={zone.id}>
              {typeof zone.distanceKm === 'number' && (
                <Circle
                  center={[centerLat, centerLon]}
                  radius={radius * 1000}
                  pathOptions={{
                    color,
                    fillColor: color,
                    fillOpacity: isSelected ? 0.35 : 0.15,
                    weight: isSelected ? 2.5 : 1.5,
                    dashArray: '4, 4',
                  }}
                />
              )}
              <Marker
                position={[centerLat, centerLon]}
                icon={probeIcon}
                eventHandlers={{ click: () => onSelectFeature(zone) }}
                title={zone.name}
                aria-label={zone.name}
              >
                <Popup>
                  <div className="p-2 space-y-1 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <h4 className="font-bold text-slate-800 truncate">{zone.name}</h4>
                      {zone.isDemoData && (
                        <span className="text-[9px] bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded font-bold">
                          DEMO
                        </span>
                      )}
                    </div>
                    <p className="text-slate-600">
                      Reference probe · real polygon geometry not yet available
                    </p>
                    {typeof zone.distanceKm === 'number' && (
                      <p className="text-slate-600">Distance: {zone.distanceKm} km</p>
                    )}
                    <button
                      type="button"
                      onClick={() => onSelectFeature(zone)}
                      className="w-full mt-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1 px-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                    >
                      View details
                    </button>
                  </div>
                </Popup>
              </Marker>
            </React.Fragment>
          );
        }

        // IMBL is a polyline when the backend ships a polyline; for now
        // our adapter never ships polygons for IMBL, so this branch is
        // reserved for future authoritative geometry.
        if (zone.type === 'IMBL') {
          return (
            <Polyline
              key={zone.id}
              positions={[...polygon] as Array<[number, number]>}
              pathOptions={{
                color,
                weight: isSelected ? 5 : 3.5,
                dashArray: '8, 8',
              }}
              eventHandlers={{ click: () => onSelectFeature(zone) }}
            />
          );
        }

        return (
          <Polygon
            key={zone.id}
            positions={[...polygon] as Array<[number, number]>}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: isSelected ? 0.45 : 0.2,
              weight: isSelected ? 3.5 : 2,
              dashArray: zone.zoneType === 'NAVAL_RESTRICTED' ? '6, 6' : undefined,
            }}
            eventHandlers={{ click: () => onSelectFeature(zone) }}
          >
            <Popup>
              <div className="p-2 space-y-1 text-xs">
                <div className="flex items-center justify-between gap-2">
                  <h4 className="font-bold text-slate-800 truncate">{zone.name}</h4>
                  {zone.isDemoData && (
                    <span className="text-[9px] bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.5 rounded font-bold">
                      DEMO
                    </span>
                  )}
                </div>
                <p className="text-slate-600">Type: <strong>{zone.zoneType}</strong></p>
                {typeof zone.hsiScore === 'number' && (
                  <p className="text-emerald-700 font-bold">HSI: {zone.hsiScore}/100</p>
                )}
                {zone.targetSpecies && zone.targetSpecies.length > 0 && (
                  <p className="text-slate-700 truncate">Species: {zone.targetSpecies.join(', ')}</p>
                )}
                <button
                  type="button"
                  onClick={() => onSelectFeature(zone)}
                  className="w-full mt-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1 px-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  View details
                </button>
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </>
  );
};