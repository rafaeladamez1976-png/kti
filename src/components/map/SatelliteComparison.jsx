import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Maximize2, MoveHorizontal } from 'lucide-react';

export default function SatelliteComparison({ beforeImg, afterImg, beforeDate, afterDate }) {
  const [sliderPos, setSliderPos] = useState(50);

  const handleMouseMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    setSliderPos(Math.min(Math.max(x, 0), 100));
  };

  return (
    <Card className="overflow-hidden border-none shadow-xl bg-slate-900 text-white">
      <CardHeader className="border-b border-slate-800">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Maximize2 size={18} className="text-emerald-400" />
            Análisis de Comparación Satelital
          </CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline" className="bg-slate-800 text-slate-300 border-slate-700">
              Antes: {beforeDate}
            </Badge>
            <Badge variant="outline" className="bg-emerald-900/30 text-emerald-400 border-emerald-800">
              Después: {afterDate}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0 relative h-[500px] cursor-col-resize select-none overflow-hidden" onMouseMove={handleMouseMove}>
        {/* After Image (Background) */}
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ backgroundImage: `url(${afterImg})` }}
        />
        
        {/* Before Image (Foreground with Clip) */}
        <div 
          className="absolute inset-0 bg-cover bg-center" 
          style={{ 
            backgroundImage: `url(${beforeImg})`,
            clipPath: `inset(0 ${100 - sliderPos}% 0 0)`
          }}
        />

        {/* Slider Handle */}
        <div 
          className="absolute inset-y-0 w-1 bg-white shadow-[0_0_10px_rgba(0,0,0,0.5)] z-10"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center text-slate-900 border-2 border-emerald-500">
            <MoveHorizontal size={16} />
          </div>
        </div>

        {/* Labels Overlay */}
        <div className="absolute bottom-4 left-4 z-20 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold text-white border border-white/20">
            Imagen Histórica
          </div>
        </div>
        <div className="absolute bottom-4 right-4 z-20 pointer-events-none text-right">
          <div className="bg-emerald-600/60 backdrop-blur-md px-3 py-1 rounded-md text-[10px] uppercase tracking-wider font-bold text-white border border-emerald-400/20">
            Estado Actual
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
