import React, { useEffect } from 'react';
import { TripAssessmentResponse } from '../types';

interface LivingChartProps {
  assessment: TripAssessmentResponse | null;
}

export const LivingChart: React.FC<LivingChartProps> = ({ assessment }) => {
  useEffect(() => {
    // Leaflet map initialization logic
    if (typeof window !== 'undefined' && (window as any).L && assessment) {
      const L = (window as any).L;
      const mapContainer = document.getElementById('map-container');
      
      if (mapContainer && !(mapContainer as any)._leaflet_id) {
        const map = L.map('map-container').setView(
          [assessment.coordinate.lat, assessment.coordinate.lon],
          9
        );

        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          maxZoom: 18,
          attribution: '&copy; OpenStreetMap contributors | ISRO / INCOIS',
        }).addTo(map);

        // Marker for vessel location
        L.marker([assessment.coordinate.lat, assessment.coordinate.lon])
          .addTo(map)
          .bindPopup('<b>Your Harbor/Vessel</b><br/>Current Position')
          .openPopup();

        // Markers for PFZ grounds
        assessment.pfz_grounds.forEach((ground) => {
          L.circleMarker(ground.coordinates, {
            radius: 12,
            fillColor: '#10b981',
            color: '#047857',
            weight: 2,
            opacity: 1,
            fillOpacity: 0.7,
          })
            .addTo(map)
            .bindPopup(`<b>${ground.name}</b><br/>HSI Score: ${ground.hsi}/100`);
        });

        // Polyline for A* safest path
        if (assessment.route.waypoints.length > 0) {
          L.polyline(assessment.route.waypoints, {
            color: '#06b6d4',
            weight: 4,
            dashArray: '8, 8',
          }).addTo(map);
        }
      }
    }
  }, [assessment]);

  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-300">
          🗺️ Nautical Living Canvas Map & Vector Field
        </h3>
        <span className="text-xs bg-ocean-800 text-cyan-300 px-2.5 py-1 rounded-md border border-ocean-700 font-mono">
          Layer: ISRO Oceansat-3 + WaveWatch III
        </span>
      </div>

      <div className="relative w-full h-[450px] rounded-2xl overflow-hidden border border-ocean-800 shadow-2xl">
        <div id="map-container" className="w-full h-full"></div>
      </div>
    </div>
  );
};
