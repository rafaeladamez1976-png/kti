import React, { useState, useRef, useCallback } from 'react';
import { MapContainer, TileLayer, FeatureGroup, Polygon, useMap, LayersControl } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Button } from '@/components/ui/button';
import { Pencil, Trash2, Upload, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

function DrawingControls({ isDrawing, onStartDraw, onClear, onFinish, hasPolygon }) {
  return (
    <div className="absolute bottom-3 left-3 bg-white rounded-lg shadow-lg p-2 z-[1000] flex gap-2">
      {!isDrawing ? (
        <>
          <Button
            size="sm"
            variant={hasPolygon ? "outline" : "default"}
            onClick={onStartDraw}
            className="gap-1"
          >
            <Pencil size={14} />
            {hasPolygon ? 'Redibujar' : 'Dibujar área'}
          </Button>
          {hasPolygon && (
            <Button
              size="sm"
              variant="destructive"
              onClick={onClear}
              className="gap-1"
            >
              <Trash2 size={14} />
              Borrar
            </Button>
          )}
        </>
      ) : (
        <Button
          size="sm"
          onClick={onFinish}
          className="gap-1 bg-emerald-600 hover:bg-emerald-700"
        >
          <Check size={14} />
          Finalizar dibujo
        </Button>
      )}
    </div>
  );
}

function ClickHandler({ isDrawing, onMapClick }) {
  const map = useMap();
  
  React.useEffect(() => {
    if (isDrawing) {
      map.on('click', onMapClick);
      map.getContainer().style.cursor = 'crosshair';
    } else {
      map.off('click', onMapClick);
      map.getContainer().style.cursor = '';
    }
    
    return () => {
      map.off('click', onMapClick);
      map.getContainer().style.cursor = '';
    };
  }, [isDrawing, map, onMapClick]);
  
  return null;
}

export default function DrawingMap({ 
  value,
  onChange,
  center = [4.6097, -74.0817],
  zoom = 6,
  height = "400px",
  className
}) {
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState([]);
  const fileInputRef = useRef(null);

  // Convert GeoJSON to Leaflet format
  const getPolygonPositions = () => {
    if (!value?.coordinates?.[0]) return [];
    return value.coordinates[0].map(c => [c[1], c[0]]);
  };

  const handleMapClick = useCallback((e) => {
    if (!isDrawing) return;
    const { lat, lng } = e.latlng;
    setDrawPoints(prev => [...prev, [lat, lng]]);
  }, [isDrawing]);

  const handleStartDraw = () => {
    setIsDrawing(true);
    setDrawPoints([]);
  };

  const handleFinishDraw = () => {
    if (drawPoints.length >= 3) {
      // Convert to GeoJSON format
      const coordinates = drawPoints.map(p => [p[1], p[0]]);
      coordinates.push(coordinates[0]); // Close the polygon
      
      onChange({
        type: 'Polygon',
        coordinates: [coordinates]
      });
    }
    setIsDrawing(false);
    setDrawPoints([]);
  };

  const handleClear = () => {
    onChange(null);
    setDrawPoints([]);
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target.result;
        let geojson;

        if (file.name.endsWith('.kml')) {
          // Basic KML parsing (simplified)
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(content, "text/xml");
          const coordinates = xmlDoc.querySelector('coordinates');
          if (coordinates) {
            const coordText = coordinates.textContent.trim();
            const coords = coordText.split(/\s+/).map(c => {
              const [lng, lat] = c.split(',').map(Number);
              return [lng, lat];
            }).filter(c => !isNaN(c[0]) && !isNaN(c[1]));
            
            if (coords.length >= 3) {
              if (coords[0][0] !== coords[coords.length-1][0] || coords[0][1] !== coords[coords.length-1][1]) {
                coords.push(coords[0]);
              }
              geojson = { type: 'Polygon', coordinates: [coords] };
            }
          }
        } else {
          // GeoJSON parsing
          const parsed = JSON.parse(content);
          if (parsed.type === 'FeatureCollection' && parsed.features?.[0]) {
            geojson = parsed.features[0].geometry;
          } else if (parsed.type === 'Feature') {
            geojson = parsed.geometry;
          } else if (parsed.type === 'Polygon') {
            geojson = parsed;
          }
        }

        if (geojson) {
          onChange(geojson);
        } else {
          alert('No se pudo leer el archivo. Asegúrese de que sea un KML o GeoJSON válido.');
        }
      } catch (err) {
        console.error('Error parsing file:', err);
        alert('Error al leer el archivo. Verifique que el formato sea correcto.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const polygonPositions = getPolygonPositions();
  const hasPolygon = polygonPositions.length > 0;

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
        
        <ClickHandler isDrawing={isDrawing} onMapClick={handleMapClick} />

        {/* Current drawing */}
        {isDrawing && drawPoints.length > 0 && (
          <Polygon
            positions={drawPoints}
            pathOptions={{
              color: '#3b82f6',
              fillColor: '#3b82f6',
              fillOpacity: 0.3,
              weight: 2,
              dashArray: '5, 5'
            }}
          />
        )}

        {/* Saved polygon */}
        {!isDrawing && hasPolygon && (
          <Polygon
            positions={polygonPositions}
            pathOptions={{
              color: '#22c55e',
              fillColor: '#22c55e',
              fillOpacity: 0.2,
              weight: 2
            }}
          />
        )}
      </MapContainer>

      {/* Controls */}
      <DrawingControls
        isDrawing={isDrawing}
        onStartDraw={handleStartDraw}
        onClear={handleClear}
        onFinish={handleFinishDraw}
        hasPolygon={hasPolygon}
      />

      {/* File upload */}
      <div className="absolute top-3 right-3 z-[1000]">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept=".kml,.geojson,.json"
          className="hidden"
        />
        <Button
          size="sm"
          variant="secondary"
          onClick={() => fileInputRef.current?.click()}
          className="gap-1 bg-white shadow"
        >
          <Upload size={14} />
          Cargar KML/GeoJSON
        </Button>
      </div>

      {/* Instructions */}
      {isDrawing && (
        <div className="absolute top-3 left-3 bg-blue-50 text-blue-700 text-xs px-3 py-2 rounded-lg z-[1000] max-w-[200px]">
          Haga clic en el mapa para agregar puntos. Mínimo 3 puntos para formar un área.
        </div>
      )}
    </div>
  );
}