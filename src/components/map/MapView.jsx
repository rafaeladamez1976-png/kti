import React, { useEffect, useRef, useState } from 'react';
import { MapContainer, TileLayer, Polygon, Marker, Popup, useMap, LayersControl, FeatureGroup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { cn } from '@/lib/utils';

// Fix for default marker icons
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom icons for risk levels
const createRiskIcon = (level) => {
  const colors = {
    alto: '#ef4444',
    medio: '#f59e0b',
    bajo: '#22c55e'
  };
  const symbols = {
    alto: '▲',
    medio: '◆',
    bajo: '●'
  };
  
  return L.divIcon({
    className: 'custom-risk-icon',
    html: `<div style="
      background: ${colors[level]};
      color: white;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: bold;
      border: 2px solid white;
      box-shadow: 0 2px 6px rgba(0,0,0,0.3);
    ">${symbols[level]}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
  });
};

function MapController({ center, zoom }) {
  const map = useMap();
  
  useEffect(() => {
    if (center) {
      map.setView(center, zoom || map.getZoom());
    }
  }, [center, zoom, map]);
  
  return null;
}

export default function MapView({ 
  territorios = [], 
  hallazgos = [],
  center = [4.6097, -74.0817], // Bogotá default
  zoom = 6,
  height = "500px",
  onTerritorioClick,
  onHallazgoClick,
  showLayers = true,
  className
}) {
  const [activeLayers, setActiveLayers] = useState({
    territorios: true,
    hallazgos: true,
    riesgoAlto: true,
    riesgoMedio: true,
    riesgoBajo: true
  });

  const getPolygonColor = (territorio) => {
    if (!territorio.activo) return '#94a3b8';
    return '#3b82f6';
  };

  const filteredHallazgos = hallazgos.filter(h => {
    if (!activeLayers.hallazgos) return false;
    if (h.nivel_riesgo === 'alto' && !activeLayers.riesgoAlto) return false;
    if (h.nivel_riesgo === 'medio' && !activeLayers.riesgoMedio) return false;
    if (h.nivel_riesgo === 'bajo' && !activeLayers.riesgoBajo) return false;
    return true;
  });

  return (
    <div className={cn("relative rounded-xl overflow-hidden border border-slate-200", className)} style={{ height }}>
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        className="z-0"
      >
        <LayersControl position="topright">
          <LayersControl.BaseLayer checked name="OpenStreetMap">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satélite (ESRI)">
            <TileLayer
              attribution='&copy; <a href="https://www.esri.com/">Esri</a>, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EBP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            />
          </LayersControl.BaseLayer>
          <LayersControl.BaseLayer name="Satélite (Híbrido)">
            <TileLayer
              attribution='&copy; <a href="https://www.google.com/copyright">Google Maps</a>'
              url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"
            />
          </LayersControl.BaseLayer>
        </LayersControl>
        
        <MapController center={center} zoom={zoom} />

        {/* Territorios */}
        {activeLayers.territorios && territorios.map((territorio) => {
          if (!territorio.geometria?.coordinates) return null;
          
          const coords = territorio.geometria.type === 'Polygon' 
            ? territorio.geometria.coordinates[0].map(c => [c[1], c[0]])
            : [];
          
          if (coords.length === 0) return null;

          return (
            <Polygon
              key={territorio.id}
              positions={coords}
              pathOptions={{
                color: getPolygonColor(territorio),
                fillColor: getPolygonColor(territorio),
                fillOpacity: 0.2,
                weight: 2
              }}
              eventHandlers={{
                click: () => onTerritorioClick?.(territorio)
              }}
            >
              <Popup>
                <div className="p-2">
                  <h3 className="font-semibold">{territorio.nombre}</h3>
                  <p className="text-sm text-slate-500">
                    {territorio.activo ? 'Monitoreo activo' : 'Monitoreo pausado'}
                  </p>
                </div>
              </Popup>
            </Polygon>
          );
        })}

        {/* Hallazgos */}
        {filteredHallazgos.map((hallazgo) => {
          if (!hallazgo.latitud || !hallazgo.longitud) return null;
          
          return (
            <Marker
              key={hallazgo.id}
              position={[hallazgo.latitud, hallazgo.longitud]}
              icon={createRiskIcon(hallazgo.nivel_riesgo)}
              eventHandlers={{
                click: () => onHallazgoClick?.(hallazgo)
              }}
            >
              <Popup>
                <div className="p-2 min-w-[200px]">
                  <h3 className="font-semibold">{hallazgo.nombre}</h3>
                  <p className="text-sm text-slate-500 capitalize mt-1">
                    Riesgo: {hallazgo.nivel_riesgo}
                  </p>
                  {hallazgo.descripcion && (
                    <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                      {hallazgo.descripcion}
                    </p>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Layer controls */}
      {showLayers && (
        <div className="absolute top-3 right-3 bg-white rounded-lg shadow-lg p-3 z-[1000] max-w-[180px]">
          <p className="text-xs font-semibold text-slate-700 mb-2">Capas</p>
          <div className="space-y-1.5">
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={activeLayers.territorios}
                onChange={(e) => setActiveLayers(prev => ({ ...prev, territorios: e.target.checked }))}
                className="rounded"
              />
              <span>Territorios</span>
            </label>
            <label className="flex items-center gap-2 text-xs cursor-pointer">
              <input
                type="checkbox"
                checked={activeLayers.hallazgos}
                onChange={(e) => setActiveLayers(prev => ({ ...prev, hallazgos: e.target.checked }))}
                className="rounded"
              />
              <span>Hallazgos</span>
            </label>
            <div className="border-t pt-1.5 mt-1.5">
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeLayers.riesgoAlto}
                  onChange={(e) => setActiveLayers(prev => ({ ...prev, riesgoAlto: e.target.checked }))}
                  className="rounded"
                />
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-red-500 rounded-full"></span>
                  Riesgo alto
                </span>
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeLayers.riesgoMedio}
                  onChange={(e) => setActiveLayers(prev => ({ ...prev, riesgoMedio: e.target.checked }))}
                  className="rounded"
                />
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-amber-500 rounded-full"></span>
                  Riesgo medio
                </span>
              </label>
              <label className="flex items-center gap-2 text-xs cursor-pointer">
                <input
                  type="checkbox"
                  checked={activeLayers.riesgoBajo}
                  onChange={(e) => setActiveLayers(prev => ({ ...prev, riesgoBajo: e.target.checked }))}
                  className="rounded"
                />
                <span className="flex items-center gap-1">
                  <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                  Riesgo bajo
                </span>
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}