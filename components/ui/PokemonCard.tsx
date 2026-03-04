"use client";

import Link from "next/link";
import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";

interface PokemonCardProps {
  card: any;
}

export default function PokemonCard({ card }: PokemonCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const urlCardNumber = (card.card_number || "000").split('/')[0].trim();

  return (
    <Link href={`/${card.sets?.code || "unknown"}/${urlCardNumber}`}>
      <div className="group relative flex flex-col gap-2.5 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer h-full">
        
        <div className="relative w-full aspect-[63/88] rounded-[16px] overflow-hidden bg-muted/50 border border-border/50 shadow-sm group-hover:shadow-xl group-hover:border-foreground/30 transition-all flex items-center justify-center">
          {!imageLoaded && (
             <div className="absolute inset-0 flex items-center justify-center text-foreground/20">
               <ImageIcon size={32} />
             </div>
          )}
          {card.image_url ? (
            <img 
              src={card.image_url} 
              alt={card.name}
              onLoad={() => setImageLoaded(true)}
              className={`w-full h-full object-cover transition-opacity duration-500 ${imageLoaded ? 'opacity-100' : 'opacity-0'}`}
              loading="lazy"
            />
          ) : (
            <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">No Image</span>
          )}
        </div>

        <div className="flex flex-col gap-1 px-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest truncate">
            {card.card_number || "---"}
            </span>
            {card.rarity && (
              <span className="text-[10px] font-bold text-foreground/60 bg-muted px-1.5 py-0.5 rounded-md">
                {card.rarity}
              </span>
            )}
          </div>
          <h3 className="text-sm font-bold leading-tight truncate group-hover:text-blue-500 transition-colors">
            {card.name}
          </h3>
          <div className="flex items-center gap-1.5">
            <span className="text-xs font-medium text-foreground/60 truncate">
              {card.sets?.name || "Unknown Set"}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}