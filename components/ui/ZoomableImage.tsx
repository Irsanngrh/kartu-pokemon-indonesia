"use client";

import { useState } from "react";
import { ZoomIn, X } from "lucide-react";

export default function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const [isZoomed, setIsZoomed] = useState(false);

  return (
    <>
      <div 
        className="relative group cursor-zoom-in w-full aspect-[63/88] rounded-[24px] overflow-hidden border border-border shadow-md hover:shadow-xl transition-all"
        onClick={() => setIsZoomed(true)}
      >
        <img src={src} alt={alt} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-background/0 group-hover:bg-background/10 transition-colors flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-background/80 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity transform scale-90 group-hover:scale-100 text-foreground">
            <ZoomIn size={24} />
          </div>
        </div>
      </div>

      {isZoomed && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center bg-background/90 backdrop-blur-md p-4 sm:p-8 cursor-zoom-out"
          onClick={() => setIsZoomed(false)}
        >
          <button 
            className="absolute top-6 right-6 p-3 bg-foreground text-background rounded-full hover:scale-110 transition-transform shadow-lg z-50"
            onClick={(e) => {
              e.stopPropagation();
              setIsZoomed(false);
            }}
          >
            <X size={24} strokeWidth={2.5} />
          </button>
          
          <img 
            src={src} 
            alt={alt} 
            className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </>
  );
}