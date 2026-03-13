"use client";

import { useState, useRef } from "react";

export default function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const imageRef = useRef<HTMLImageElement>(null);

  const updatePosition = (e: React.MouseEvent<HTMLDivElement>) => {
    if (imageRef.current) {
      const { left, top, width, height } = imageRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
      setPosition({ x, y });
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) {
      updatePosition(e);
      setIsZoomed(true);
    } else {
      setIsZoomed(false);
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isZoomed) {
      updatePosition(e);
    }
  };

  const handleMouseLeave = () => {
    if (isZoomed) setIsZoomed(false);
  };

  return (
    <div 
      className={`relative w-full aspect-[63/88] rounded-[24px] overflow-hidden border border-border shadow-md ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <img 
        ref={imageRef}
        src={src} 
        alt={alt} 
        className="w-full h-full object-cover"
        style={{ 
          transform: isZoomed ? 'scale(2.5)' : 'scale(1)', 
          transformOrigin: `${position.x}% ${position.y}%`,
          transition: isZoomed ? 'transform 0.2s ease-out' : 'transform 0.3s ease-out, transform-origin 0.3s ease-out'
        }}
      />
    </div>
  );
}
