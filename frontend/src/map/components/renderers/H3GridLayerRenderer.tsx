import React from 'react';
import { Polygon, Popup } from 'react-leaflet';
import { H3CellFeature } from '../../types/feature';

interface H3GridLayerRendererProps {
  cells: H3CellFeature[];
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

        return (
          <Polygon
            key={cell.id}
            positions={cell.cellBoundary}
            pathOptions={{
              color: '#06b6d4',
              fillColor: '#06b6d4',
              fillOpacity: isSelected ? 0.35 : 0.12,
              weight: isSelected ? 2.5 : 1,
              dashArray: '3, 3',
            }}
            eventHandlers={{
              click: () => onSelectFeature(cell),
            }}
          >
            <Popup>
              <div className="p-2 space-y-1 text-xs font-mono">
                <h4 className="font-bold text-cyan-400">H3 Cell: {cell.h3Index}</h4>
                <p className="text-slate-300">Resolution: {cell.resolution} (~1.2 km²)</p>
                {cell.hsiValue && (
                  <p className="text-emerald-400 font-bold font-sans">HSI Index: {cell.hsiValue}/100</p>
                )}
                <button
                  onClick={() => onSelectFeature(cell)}
                  className="w-full mt-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-1 px-2 rounded font-sans"
                >
                  Inspect H3 Cell Analytics
                </button>
              </div>
            </Popup>
          </Polygon>
        );
      })}
    </>
  );
};
