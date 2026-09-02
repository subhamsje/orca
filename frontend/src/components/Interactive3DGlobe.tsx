import React, { useEffect, useRef, useState } from 'react';
import { Globe as GlobeIcon, Compass, Radio, MapPin, Layers, RefreshCw } from 'lucide-react';
import { GLOBAL_HARBORS, HarborLocation } from '../utils/harbors';

interface Interactive3DGlobeProps {
  onSelectHarbor?: (harbor: HarborLocation) => void;
}

export const Interactive3DGlobe: React.FC<Interactive3DGlobeProps> = ({ onSelectHarbor }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPin, setSelectedPin] = useState<HarborLocation | null>(GLOBAL_HARBORS[0]);
  const [isRotating, setIsRotating] = useState(true);
  const rotationAngleRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const radius = Math.min(width, height) * 0.38;
      const centerX = width / 2;
      const centerY = height / 2;

      ctx.clearRect(0, 0, width, height);

      // Deep Ocean Atmosphere Glow
      const glowGrad = ctx.createRadialGradient(centerX, centerY, radius * 0.8, centerX, centerY, radius * 1.35);
      glowGrad.addColorStop(0, 'rgba(6, 182, 212, 0.25)');
      glowGrad.addColorStop(0.5, 'rgba(2, 132, 199, 0.1)');
      glowGrad.addColorStop(1, 'rgba(2, 24, 39, 0)');
      ctx.fillStyle = glowGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius * 1.35, 0, Math.PI * 2);
      ctx.fill();

      // Earth Base Sphere
      const oceanGrad = ctx.createRadialGradient(
        centerX - radius * 0.3,
        centerY - radius * 0.3,
        radius * 0.1,
        centerX,
        centerY,
        radius
      );
      oceanGrad.addColorStop(0, '#0c4a6e');
      oceanGrad.addColorStop(0.6, '#0284c7');
      oceanGrad.addColorStop(1, '#021827');
      ctx.fillStyle = oceanGrad;
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#06b6d4';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Rotating Latitude / Longitude Mesh Lines
      if (isRotating) {
        rotationAngleRef.current += 0.005;
      }
      const rot = rotationAngleRef.current;

      ctx.strokeStyle = 'rgba(6, 182, 212, 0.25)';
      ctx.lineWidth = 1;

      // Parallels (Latitude lines)
      for (let lat = -60; lat <= 60; lat += 30) {
        const y = centerY - radius * Math.sin((lat * Math.PI) / 180);
        const rLat = radius * Math.cos((lat * Math.PI) / 180);
        ctx.beginPath();
        ctx.ellipse(centerX, y, rLat, rLat * 0.3, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Meridians (Longitude lines)
      for (let lon = 0; lon < 180; lon += 30) {
        const radLon = (lon * Math.PI) / 180 + rot;
        const xOffset = Math.sin(radLon) * radius;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, Math.abs(xOffset), radius, 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Rotating ISRO / Copernicus Satellite Orbit Ring
      ctx.strokeStyle = 'rgba(234, 179, 8, 0.6)';
      ctx.setLineDash([6, 6]);
      ctx.beginPath();
      ctx.ellipse(centerX, centerY, radius * 1.25, radius * 0.55, rot * 1.5, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);

      // Satellite Icon Dot on Orbit
      const satX = centerX + Math.cos(rot * 1.5) * radius * 1.25;
      const satY = centerY + Math.sin(rot * 1.5) * radius * 0.55;
      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(satX, satY, 4, 0, Math.PI * 2);
      ctx.fill();

      // Render Global Harbor Pins on 3D Globe Surface
      GLOBAL_HARBORS.slice(0, 15).forEach((h) => {
        const lambda = (h.lon * Math.PI) / 180 + rot;
        const phi = (h.lat * Math.PI) / 180;

        // Spherical 3D Projection
        const x = centerX + radius * Math.cos(phi) * Math.sin(lambda);
        const y = centerY - radius * Math.sin(phi);
        const z = radius * Math.cos(phi) * Math.cos(lambda);

        // Only draw pins on front hemisphere
        if (z > 0) {
          const isSelected = selectedPin?.id === h.id;
          ctx.fillStyle = isSelected ? '#34d399' : '#38bdf8';
          ctx.beginPath();
          ctx.arc(x, y, isSelected ? 6 : 3.5, 0, Math.PI * 2);
          ctx.fill();

          if (isSelected) {
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 2;
            ctx.stroke();
          }

          // Label Text for Key Hotspots
          ctx.fillStyle = isSelected ? '#ffffff' : 'rgba(226, 232, 240, 0.8)';
          ctx.font = isSelected ? 'bold 11px Inter, sans-serif' : '9px Inter, sans-serif';
          ctx.fillText(h.name.split(' ')[0], x + 8, y + 3);
        }
      });

      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [isRotating, selectedPin]);

  return (
    <div className="relative w-full h-[520px] bg-ocean-950 border border-ocean-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col justify-between p-4">
      {/* Background Subtle Stars Grid */}
      <div className="absolute inset-0 bg-[radial-gradient(#0891b2_1px,transparent_1px)] [background-size:24px_24px] opacity-15 pointer-events-none" />

      {/* Top Controls Overlay */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <div className="p-2 bg-cyan-950 border border-cyan-800 rounded-xl text-cyan-400">
            <GlobeIcon className="w-5 h-5 animate-pulse-slow" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">
              3D Universal Ocean Digital Twin
            </h3>
            <span className="text-[10px] text-slate-400">ISRO / INCOIS Global Earth Surface Grid</span>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsRotating((r) => !r)}
            className="flex items-center space-x-1 text-[11px] font-bold bg-ocean-900 hover:bg-ocean-800 text-slate-200 border border-ocean-700 px-3 py-1.5 rounded-xl transition"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRotating ? 'animate-spin-slow text-cyan-400' : ''}`} />
            <span>{isRotating ? 'Auto Rotate' : 'Paused'}</span>
          </button>
        </div>
      </div>

      {/* 3D Canvas Sphere */}
      <div className="relative flex-1 flex items-center justify-center">
        <canvas
          ref={canvasRef}
          width={650}
          height={400}
          className="max-w-full max-h-full cursor-pointer"
        />
      </div>

      {/* Bottom Selected Pin Inspector & Global Preset Quick Chips */}
      <div className="relative z-10 bg-ocean-900/90 border border-ocean-800 p-3 rounded-xl flex items-center justify-between text-xs backdrop-blur-md">
        <div className="flex items-center space-x-3">
          <MapPin className="w-4 h-4 text-emerald-400 shrink-0" />
          <div>
            <span className="font-bold text-white block">
              {selectedPin?.name || 'Select Global Harbor'} ({selectedPin?.country})
            </span>
            <span className="text-[10px] font-mono text-cyan-300">
              {selectedPin?.lat.toFixed(4)}°N, {selectedPin?.lon.toFixed(4)}°E • {selectedPin?.region}
            </span>
          </div>
        </div>

        {/* Global Hotspots Select Bar */}
        <div className="flex items-center space-x-1.5 overflow-x-auto max-w-xs sm:max-w-md">
          {GLOBAL_HARBORS.slice(0, 7).map((h) => (
            <button
              key={h.id}
              onClick={() => {
                setSelectedPin(h);
                onSelectHarbor?.(h);
              }}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-lg border transition ${
                selectedPin?.id === h.id
                  ? 'bg-cyan-600 border-cyan-400 text-white shadow-lg'
                  : 'bg-ocean-950 border-ocean-800 text-slate-300 hover:text-white'
              }`}
            >
              {h.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
