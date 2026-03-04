"use client";

import Link from "next/link";
import { useState } from "react";
import { Image as ImageIcon } from "lucide-react";

interface PokemonCardProps {
  card: any;
  source?: "library" | "collection" | "wishlist";
}

export default function PokemonCard({ card, source = "library" }: PokemonCardProps) {
  const [imageLoaded, setImageLoaded] = useState(false);
  const urlCardNumber = (card.card_number || "000").split('/')[0].trim();
  
  const hrefUrl = `/${card.sets?.code || "unknown"}/${urlCardNumber}${source !== "library" ? `?from=${source}` : ""}`;

  return (
    <Link href={hrefUrl}>
      <div className="group relative flex flex-col h-full bg-muted/40 rounded-[20px] border border-border/40 backdrop-blur-sm p-2 sm:p-2.5 gap-3 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md cursor-pointer">
        
        <div className="relative w-full aspect-[63/88] rounded-xl overflow-hidden bg-muted/50 border border-border/50 flex items-center justify-center">
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

        <div className="flex flex-col gap-1 px-1 pb-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest truncate">
            {card.card_number || "---"}
            </span>
            {card.rarity && (
              <span className="text-[10px] font-bold text-foreground/60 bg-background/80 px-1.5 py-0.5 rounded-md border border-border/50 shadow-sm">
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