import React, { useState, useRef } from 'react';
import { cn } from '@/lib/utils';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ImageComparer({ 
  imageA, 
  imageB, 
  labelA = "Antes", 
  labelB = "Después",
  className 
}) {
  const [sliderPosition, setSliderPosition] = useState(50);
  const [zoom, setZoom] = useState(1);
  const containerRef = useRef(null);
  const isDragging = useRef(false);

  const handleMouseDown = () => {
    isDragging.current = true;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || !containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleTouchMove = (e) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.touches[0].clientX - rect.left;
    const percentage = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(percentage);
  };

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.25, 0.5));
  const handleReset = () => {
    setZoom(1);
    setSliderPosition(50);
  };

  const placeholderA = "https://images.unsplash.com/photo-1569163139599-0f4517e36f51?w=600&h=400&fit=crop";
  const placeholderB = "https://images.unsplash.com/photo-1473773508845-188df298d2d1?w=600&h=400&fit=crop";

  return (
    <div className={cn("space-y-3", className)}>
      {/* Zoom controls */}
      <div className="flex items-center justify-end gap-2">
        <Button size="sm" variant="outline" onClick={handleZoomOut} disabled={zoom <= 0.5}>
          <ZoomOut size={16} />
        </Button>
        <span className="text-sm text-slate-500 min-w-[50px] text-center">{Math.round(zoom * 100)}%</span>
        <Button size="sm" variant="outline" onClick={handleZoomIn} disabled={zoom >= 3}>
          <ZoomIn size={16} />
        </Button>
        <Button size="sm" variant="outline" onClick={handleReset}>
          <RotateCcw size={16} />
        </Button>
      </div>

      {/* Comparer */}
      <div 
        ref={containerRef}
        className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-100 select-none"
        style={{ height: '400px' }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchMove={handleTouchMove}
      >
        {/* Image B (full width, below) */}
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ transform: `scale(${zoom})`, transformOrigin: 'center' }}
        >
          <img
            src={imageB || placeholderB}
            alt={labelB}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>

        {/* Image A (clipped) */}
        <div 
          className="absolute inset-0 overflow-hidden"
          style={{ 
            clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
            transform: `scale(${zoom})`, 
            transformOrigin: 'center' 
          }}
        >
          <img
            src={imageA || placeholderA}
            alt={labelA}
            className="w-full h-full object-cover"
            draggable={false}
          />
        </div>

        {/* Slider handle */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white cursor-ew-resize shadow-lg z-10"
          style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
          onMouseDown={handleMouseDown}
          onTouchStart={handleMouseDown}
        >
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full shadow-lg flex items-center justify-center border-2 border-slate-300">
            <div className="flex gap-0.5">
              <div className="w-0.5 h-3 bg-slate-400 rounded"></div>
              <div className="w-0.5 h-3 bg-slate-400 rounded"></div>
            </div>
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-3 left-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
          {labelA}
        </div>
        <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded">
          {labelB}
        </div>
      </div>
    </div>
  );
}