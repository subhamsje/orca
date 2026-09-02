import React from 'react';
import { Polygon, Popup } from 'react-leaflet';
import { H3CellFeature } from '../../types/feature';
import { MAP_THEME } from '../../theme';

interface H3GridLayerRendererProps {
  cells: ReadonlyArray<H3CellFeature>;
  selectedFeatureId: string | null;
  onSelectFeature: (feature: H3CellFeature) => void;
}

export const H3GridLayerRenderer: React.FC<H3GridLayerRendererProps> = ({
  cells,
  selectedFeatureId,
  onSelectFeature,
}) => {
  return (
    <>
      {cells.map((cell) => {
        const isSelected = selectedFeatureId === cell.id;
        const fillOpacity = isSelected ? 0.32 : 0.12;
        const strokeWeight = isSelected ? 2.5 : 1;

        // Visual encoding: cells render in cyan for normal / amber for
        // elevated HSI / red for anomaly. We never use only colour — the
        // popup and detail panel always include the H3 index + resolution.
        const stroke =
          typeof cell.anomalyScore === 'number' && cell.anomalyScore > 0
            ? MAP_THEME.zone.NAVAL_RESTRICTED
            : MAP_THEME.selection;

        return (
          <Polygon
            key={cell.id}
            positions={[...cell.cellBoundary] as Array<[number, number]>}
            pathOptions={{
              color: stroke,
              fillColor: stroke,
              fillOpacity,
              weight: strokeWeight,
              dashArray: '3, 3',
            }}
            eventHandlers={{ click: () => onSelectFeature(cell) }}
          >
            <Popup>
              <div className="p-2 space-y-1 text-xs font-mono">
                <h4 className="font-bold text-cyan-700">H3 cell {cell.h3Index}</h4>
                <p className="text-slate-700 font-sans">Resolution: {cell.resolution}</p>
                {typeof cell.hsiValue === 'number' && (
                  <p className="text-emerald-700 font-bold font-sans">
                    HSI: {cell.hsiValue}/100
                  </p>
                )}
                {typeof cell.vesselCount === 'number' && (
                  <p className="text-slate-700 font-sans">
                    Vessels in cell: {cell.vesselCount}
                  </p>
                )}
                <button
                  type="button"
                  onClick={() => onSelectFeature(cell)}
                  className="w-full mt-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1 px-2 rounded font-sans focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400"
                >
                  Inspect cell analytics
                </button>
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </>
  );
};