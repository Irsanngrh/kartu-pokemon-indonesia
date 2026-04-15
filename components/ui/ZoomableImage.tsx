"use client";

import NextImage from "next/image";
import { useState, useRef, useCallback } from "react";

export default function ZoomableImage({ src, alt }: { src: string; alt: string }) {
  const [isZoomed, setIsZoomed] = useState(false);
  const [position, setPosition] = useState({ x: 50, y: 50 });
  const containerRef = useRef<HTMLDivElement>(null);

  const updatePosition = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (containerRef.current) {
      const { left, top, width, height } = containerRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((e.clientX - left) / width) * 100));
      const y = Math.max(0, Math.min(100, ((e.clientY - top) / height) * 100));
      setPosition({ x, y });
    }
  }, []);

  const handleClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (!isZoomed) {
      updatePosition(e);
      setIsZoomed(true);
    } else {
      setIsZoomed(false);
    }
  }, [isZoomed, updatePosition]);

  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    if (isZoomed) {
      updatePosition(e);
    }
  }, [isZoomed, updatePosition]);

  const handleMouseLeave = useCallback(() => {
    if (isZoomed) setIsZoomed(false);
  }, [isZoomed]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full aspect-[63/88] rounded-[24px] overflow-hidden border border-border shadow-md ${isZoomed ? 'cursor-zoom-out' : 'cursor-zoom-in'}`}
      onClick={handleClick}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <NextImage
        src={src}
        alt={alt}
        fill
        sizes="(max-width: 1024px) 90vw, 380px"
        priority
        className="object-cover"
        style={{ 
          transform: isZoomed ? 'scale(2.5)' : 'scale(1)', 
          transformOrigin: `${position.x}% ${position.y}%`,
          transition: isZoomed ? 'transform 0.2s ease-out' : 'transform 0.3s ease-out, transform-origin 0.3s ease-out'
        }}
      />
    </div>
  );
}
