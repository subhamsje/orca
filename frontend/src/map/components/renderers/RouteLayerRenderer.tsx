import React from 'react';
import { CircleMarker, Polyline, Popup } from 'react-leaflet';
import { RouteFeature } from '../../types/feature';
import { MAP_THEME } from '../../theme';

interface RouteLayerRendererProps {
  routes: ReadonlyArray<RouteFeature>;
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
        const color = MAP_THEME.route[route.routeType] ?? MAP_THEME.route.PRIMARY_ASTAR;
        return (
          <React.Fragment key={route.id}>
            <Polyline
              positions={[...route.waypoints] as Array<[number, number]>}
              pathOptions={{
                color,
                weight: isSelected ? 6 : 4,
                dashArray: '8, 8',
              }}
              eventHandlers={{ click: () => onSelectFeature(route) }}
            >
              <Popup>
                <div className="p-2 space-y-1 text-xs">
                  <h4 className="font-bold text-cyan-700">{route.name}</h4>
                  <p className="text-slate-700">
                    Distance: <strong>{route.distanceKm} km</strong> · Travel:{' '}
                    <strong>{route.durationMins} min</strong>
                  </p>
                  <p className="text-amber-700">Est fuel: <strong>{route.fuelLiters} L</strong></p>
                  {route.avoidedHazards.length > 0 && (
                    <p className="text-emerald-700 truncate">
                      Avoided: {route.avoidedHazards.join(', ')}
                    </p>
                  )}
                  <button
                    type="button"
                    onClick={() => onSelectFeature(route)}
                    className="w-full mt-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1 px-2 rounded focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                  >
                    View route telemetry
                  </button>
                </div>
              </Popup>
            </Polyline>

            {route.waypoints.map((wp, idx) => (
              <CircleMarker
                key={`${route.id}_wp_${idx}`}
                center={wp}
                radius={4}
                pathOptions={{
                  color,
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