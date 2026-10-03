import React, { useState, useEffect, useRef } from 'react';
import { GeoPoint, VehicleType } from '../../../packages/shared_types/src';
import { MapPin, Navigation, Compass, Layers } from 'lucide-react';

interface InteractiveMapProps {
  center?: { lat: number; lng: number };
  pickup?: GeoPoint | null;
  destination?: GeoPoint | null;
  driverPosition?: { lat: number; lng: number; bearing?: number } | null;
  vehicleType?: VehicleType;
  nearbyDrivers?: { id: string; lat: number; lng: number; type: VehicleType; name: string }[];
  isSearching?: boolean;
  onMapClick?: (point: { lat: number; lng: number }) => void;
  selectionMode?: 'pickup' | 'destination' | null;
  height?: string;
  interactive?: boolean;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  center = { lat: 15.3500, lng: 44.1950 },
  pickup,
  destination,
  driverPosition,
  vehicleType = 'CAR',
  nearbyDrivers = [],
  isSearching = false,
  onMapClick,
  selectionMode = null,
  height = '100%',
  interactive = true
}) => {
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);

  // Coordinate projection helper: converts GPS lat/lng to SVG coordinate space [0, 800] x [0, 600]
  // Centered around Sana'a (lat: 15.350, lng: 44.195)
  const project = (lat: number, lng: number) => {
    const latSpan = 0.08;
    const lngSpan = 0.08;
    const x = ((lng - (center.lng - lngSpan / 2)) / lngSpan) * 800;
    const y = (((center.lat + latSpan / 2) - lat) / latSpan) * 600;
    return { x, y };
  };

  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!interactive || !onMapClick) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = ((e.clientX - rect.left) / rect.width) * 800;
    const clickY = ((e.clientY - rect.top) / rect.height) * 600;

    const latSpan = 0.08;
    const lngSpan = 0.08;
    const lng = (clickX / 800) * lngSpan + (center.lng - lngSpan / 2);
    const lat = (center.lat + latSpan / 2) - (clickY / 600) * latSpan;

    onMapClick({ lat, lng });
  };

  const pickupProjected = pickup ? project(pickup.latitude, pickup.longitude) : null;
  const destProjected = destination ? project(destination.latitude, destination.longitude) : null;
  const driverProjected = driverPosition ? project(driverPosition.lat, driverPosition.lng) : null;

  return (
    <div
      ref={containerRef}
      className="relative w-full overflow-hidden bg-slate-900 select-none"
      style={{ height }}
    >
      {/* Map SVG Canvas */}
      <svg
        viewBox="0 0 800 600"
        className={`w-full h-full object-cover transition-transform duration-300 ${selectionMode ? 'cursor-crosshair' : 'cursor-grab'}`}
        onClick={handleSvgClick}
      >
        {/* Background Urban Blocks */}
        <defs>
          <pattern id="city-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <rect width="38" height="38" fill="#0f172a" rx="4" />
            <rect x="0" y="0" width="40" height="40" fill="none" stroke="#1e293b" strokeWidth="1" />
          </pattern>
          <radialGradient id="radar-pulse" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.4" />
            <stop offset="70%" stopColor="#059669" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#047857" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="route-glow" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#06b6d4" />
          </linearGradient>
        </defs>

        {/* Map Background Base */}
        <rect width="800" height="600" fill="#090d16" />
        <rect width="800" height="600" fill="url(#city-grid)" opacity="0.65" />

        {/* Major Roads / Highways in Sana'a (Sixtieth Ring Rd, Zubairi, Hadda, Airport Rd) */}
        <g stroke="#1e293b" strokeWidth="18" fill="none" strokeLinecap="round" strokeLinejoin="round">
          {/* Sixtieth Road (Ring) */}
          <path d="M 120 500 Q 180 200 420 140 T 700 220" />
          {/* Zubairi St */}
          <path d="M 150 320 Q 380 340 680 290" />
          {/* Hadda St */}
          <path d="M 380 160 Q 420 380 470 540" />
          {/* Tahrir Square Cross */}
          <path d="M 280 240 L 520 280" />
        </g>
        
        {/* Road Surface Center Lines */}
        <g stroke="#334155" strokeWidth="8" fill="none" strokeLinecap="round" strokeLinejoin="round">
          <path d="M 120 500 Q 180 200 420 140 T 700 220" />
          <path d="M 150 320 Q 380 340 680 290" />
          <path d="M 380 160 Q 420 380 470 540" />
          <path d="M 280 240 L 520 280" />
        </g>

        {/* Street Name Labels in Arabic */}
        <text x="490" y="460" fill="#64748b" fontSize="11" fontWeight="bold" fontFamily="Cairo" textAnchor="middle" transform="rotate(75, 490, 460)">
          شارع حدة العام
        </text>
        <text x="320" y="340" fill="#64748b" fontSize="11" fontWeight="bold" fontFamily="Cairo" textAnchor="middle" transform="rotate(2, 320, 340)">
          شارع الزبيري
        </text>
        <text x="210" y="220" fill="#64748b" fontSize="11" fontWeight="bold" fontFamily="Cairo" textAnchor="middle" transform="rotate(-40, 210, 220)">
          شارع الستين
        </text>
        <text x="440" y="270" fill="#64748b" fontSize="10" fontWeight="bold" fontFamily="Cairo">
          ميدان التحرير
        </text>

        {/* Landmarks */}
        <g opacity="0.85">
          {/* Sabeen Square park area */}
          <rect x="440" y="470" width="130" height="70" rx="10" fill="#064e3b" opacity="0.4" stroke="#047857" strokeWidth="1" />
          <text x="505" y="510" fill="#34d399" fontSize="10" fontWeight="600" fontFamily="Cairo" textAnchor="middle">
            حديقة وميدان السبعين
          </text>
          
          {/* Sana'a University area */}
          <rect x="230" y="260" width="90" height="50" rx="8" fill="#1e1b4b" opacity="0.5" stroke="#4338ca" strokeWidth="1" />
          <text x="275" y="290" fill="#818cf8" fontSize="9" fontWeight="600" fontFamily="Cairo" textAnchor="middle">
            جامعة صنعاء
          </text>
        </g>

        {/* Route Polyline if both pickup & destination exist */}
        {pickupProjected && destProjected && (
          <g>
            {/* Route Outer Shadow */}
            <path
              d={`M ${pickupProjected.x} ${pickupProjected.y} Q ${(pickupProjected.x + destProjected.x) / 2 + 30} ${(pickupProjected.y + destProjected.y) / 2 - 25} ${destProjected.x} ${destProjected.y}`}
              stroke="#0f172a"
              strokeWidth="10"
              fill="none"
              strokeLinecap="round"
            />
            {/* Route Main Glowing Path */}
            <path
              d={`M ${pickupProjected.x} ${pickupProjected.y} Q ${(pickupProjected.x + destProjected.x) / 2 + 30} ${(pickupProjected.y + destProjected.y) / 2 - 25} ${destProjected.x} ${destProjected.y}`}
              stroke="url(#route-glow)"
              strokeWidth="5"
              fill="none"
              strokeLinecap="round"
              strokeDasharray="8 4"
              className="animate-pulse"
            />
          </g>
        )}

        {/* Nearby Drivers on Map */}
        {nearbyDrivers.map((drv) => {
          const pt = project(drv.lat, drv.lng);
          return (
            <g key={drv.id} transform={`translate(${pt.x}, ${pt.y})`} className="cursor-pointer transition-all duration-700">
              <circle r="14" fill="#0284c7" fillOpacity="0.25" className="animate-ping" />
              <circle r="12" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
              <text y="4" textAnchor="middle" fontSize="12" fill="#ffffff">
                {drv.type === 'MOTORCYCLE' ? '🏍️' : '🚗'}
              </text>
            </g>
          );
        })}

        {/* Active Driver Vehicle Animation */}
        {driverProjected && (
          <g
            transform={`translate(${driverProjected.x}, ${driverProjected.y}) rotate(${driverPosition?.bearing || 0})`}
            className="transition-all duration-500 ease-linear cursor-pointer"
          >
            {/* Vehicle Halo */}
            <circle r="20" fill="#10b981" fillOpacity="0.2" className="animate-pulse" />
            <circle r="15" fill="#059669" stroke="#ffffff" strokeWidth="2.5" />
            <text y="5" textAnchor="middle" fontSize="14">
              {vehicleType === 'MOTORCYCLE' ? '🏍️' : '🚗'}
            </text>
          </g>
        )}

        {/* Radar Pulse when Searching */}
        {isSearching && pickupProjected && (
          <g transform={`translate(${pickupProjected.x}, ${pickupProjected.y})`}>
            <circle r="120" fill="url(#radar-pulse)" className="animate-ping origin-center" style={{ animationDuration: '2s' }} />
            <circle r="70" fill="none" stroke="#10b981" strokeWidth="1.5" strokeDasharray="5 5" className="animate-spin origin-center" style={{ animationDuration: '6s' }} />
          </g>
        )}

        {/* Pickup Pin */}
        {pickupProjected && (
          <g transform={`translate(${pickupProjected.x}, ${pickupProjected.y})`} className="cursor-pointer">
            <circle r="6" fill="#10b981" fillOpacity="0.4" className="animate-ping" />
            <path
              d="M 0 0 C -6 -6 -12 -14 -12 -24 A 12 12 0 0 1 12 -24 C 12 -14 6 -6 0 0 Z"
              fill="#10b981"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <circle cx="0" cy="-24" r="4" fill="#ffffff" />
            <text x="0" y="-32" textAnchor="middle" fill="#10b981" fontSize="11" fontWeight="bold" fontFamily="Cairo">
              نقطة الانطلاق
            </text>
          </g>
        )}

        {/* Destination Pin */}
        {destProjected && (
          <g transform={`translate(${destProjected.x}, ${destProjected.y})`} className="cursor-pointer">
            <circle r="6" fill="#ef4444" fillOpacity="0.4" className="animate-ping" />
            <path
              d="M 0 0 C -6 -6 -12 -14 -12 -24 A 12 12 0 0 1 12 -24 C 12 -14 6 -6 0 0 Z"
              fill="#ef4444"
              stroke="#ffffff"
              strokeWidth="2"
            />
            <circle cx="0" cy="-24" r="4" fill="#ffffff" />
            <text x="0" y="-32" textAnchor="middle" fill="#f87171" fontSize="11" fontWeight="bold" fontFamily="Cairo">
              الوجهة
            </text>
          </g>
        )}
      </svg>

      {/* Floating Map Controls & Overlays */}
      <div className="absolute top-4 left-4 flex flex-col gap-2 z-10">
        <button
          onClick={() => setZoom(prev => Math.min(prev + 0.2, 2))}
          className="p-2 rounded-xl bg-slate-900/90 border border-slate-700/70 text-slate-200 hover:bg-slate-800 shadow-lg text-xs font-bold"
          title="تكبير الخريطة"
        >
          +
        </button>
        <button
          onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.8))}
          className="p-2 rounded-xl bg-slate-900/90 border border-slate-700/70 text-slate-200 hover:bg-slate-800 shadow-lg text-xs font-bold"
          title="تصغير الخريطة"
        >
          −
        </button>
      </div>

      {/* Map Hint / Selection Indicator */}
      {selectionMode && (
        <div className="absolute top-4 inset-x-0 flex justify-center z-10 pointer-events-none">
          <div className="bg-emerald-500/90 text-white text-xs font-bold px-4 py-2 rounded-full shadow-lg backdrop-blur-sm border border-emerald-400/50 animate-bounce flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            <span>
              {selectionMode === 'pickup' ? 'اضغط على الخريطة لتحديد نقطة الانطلاق' : 'اضغط على الخريطة لتحديد الوجهة'}
            </span>
          </div>
        </div>
      )}

      {/* City Badge */}
      <div className="absolute bottom-3 right-3 bg-slate-900/80 backdrop-blur-md border border-slate-800 px-3 py-1.5 rounded-lg text-xs text-slate-300 flex items-center gap-1.5 pointer-events-none">
        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        <span>صنعاء المركزية (Sana'a)</span>
      </div>
    </div>
  );
};
