import React from 'react';
import { Polyline, CircleMarker, Popup } from 'react-leaflet';
import { RouteFeature } from '../../types/feature';

interface RouteLayerRendererProps {
  routes: RouteFeature[];
  selectedFeatureId: string | null;
  onSelectFeature: (feature: RouteFeature) => void;
}

export const RouteLayerRenderer: React.FC<RouteLayerRendererProps> = ({
  routes,
  selectedFeatureId,
  onSelectFeature,
}) => {
  return (
    <>
      {routes.map((route) => {
        const isSelected = selectedFeatureId === route.id;
        const color = route.routeType === 'PRIMARY_ASTAR' ? '#06b6d4' : '#a855f7';

        return (
          <React.Fragment key={route.id}>
            {/* Route Line */}
            <Polyline
              positions={route.waypoints}
              pathOptions={{
                color: color,
                weight: isSelected ? 6 : 4,
                dashArray: '8, 8',
              }}
              eventHandlers={{
                click: () => onSelectFeature(route),
              }}
            >
              <Popup>
                <div className="p-2 space-y-1 text-xs">
                  <h4 className="font-bold text-cyan-400">{route.name}</h4>
                  <p className="text-slate-300">
                    Distance: <strong>{route.distanceKm} km</strong> | Travel: <strong>{route.durationMins} mins</strong>
                  </p>
                  <p className="text-amber-300">Est Fuel: <strong>{route.fuelLiters} Liters</strong></p>
                  {route.avoidedHazards && route.avoidedHazards.length > 0 && (
                    <p className="text-emerald-400">Avoided: {route.avoidedHazards.join(', ')}</p>
                  )}
                  <button
                    onClick={() => onSelectFeature(route)}
                    className="w-full mt-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1 px-2 rounded"
                  >
                    View Route Telemetry
                  </button>
                </div>
              </Popup>
            </Polyline>

            {/* Waypoint Circle Markers */}
            {route.waypoints.map((wp, idx) => (
              <CircleMarker
                key={`${route.id}_wp_${idx}`}
                center={wp}
                radius={4}
                pathOptions={{
                  color: color,
                  fillColor: '#021827',
                  fillOpacity: 1,
                  weight: 2,
                }}
              />
            ))}
          </React.Fragment>
        );
      })}
    </>
  );
};
