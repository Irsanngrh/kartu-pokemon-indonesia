"use client";

import Link from "next/link";
import { useState } from "react";
import { Image as ImageIcon, AlertCircle } from "lucide-react";

interface PokemonCardProps {
  card: any;
  source?: "library" | "collection" | "wishlist";
}

export default function PokemonCard({ card, source = "library" }: PokemonCardProps) {
  const [imageState, setImageState] = useState<"loading" | "loaded" | "error">("loading");
  const [retryCount, setRetryCount] = useState(0);

  const urlCardNumber = (card.card_number || "000").split('/')[0].trim();
  
  let queryParams = new URLSearchParams();
  
  if (card.variant_name) {
    const cleanVariant = card.variant_name.toLowerCase().replace(/\s+/g, '-');
    queryParams.append("variant", cleanVariant);
  }
  
  if (source !== "library") queryParams.append("from", source);
  
  const qs = queryParams.toString() ? `?${queryParams.toString()}` : "";
  const hrefUrl = `/${card.sets?.code || "unknown"}/${urlCardNumber}${qs}`;

  const handleImageError = () => {
    if (retryCount < 3) {
      setTimeout(() => {
        setRetryCount(prev => prev + 1);
        setImageState("loading");
      }, 1500 * (retryCount + 1));
    } else {
      setImageState("error");
    }
  };

  const imgSrc = retryCount > 0 && card.image_url ? `${card.image_url}?retry=${retryCount}` : card.image_url;

  return (
    <Link href={hrefUrl}>
      <div className="group relative flex flex-col h-full bg-muted/40 rounded-[20px] border border-border/40 backdrop-blur-sm p-2 sm:p-2.5 gap-3 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md cursor-pointer">
        <div className="relative w-full aspect-[63/88] rounded-xl overflow-hidden bg-muted/50 border border-border/50 flex items-center justify-center">
          {imageState === "loading" && (
             <div className="absolute inset-0 flex items-center justify-center text-foreground/20 animate-pulse">
               <ImageIcon size={32} />
             </div>
          )}
          {imageState === "error" && (
             <div className="absolute inset-0 flex flex-col gap-2 items-center justify-center text-red-500/50">
               <AlertCircle size={28} />
               <span className="text-[9px] font-bold uppercase tracking-widest text-center">Gagal<br/>Memuat</span>
             </div>
          )}
          {card.image_url ? (
            <img 
              key={imgSrc}
              src={imgSrc} 
              alt={card.name}
              onLoad={() => setImageState("loaded")}
              onError={handleImageError}
              className={`w-full h-full object-cover transition-opacity duration-500 ${imageState === "loaded" ? 'opacity-100' : 'opacity-0'}`}
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