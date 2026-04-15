"use client";

import { PokemonCard } from "@/types";
import { Minus, Plus, Trash2 } from "lucide-react";

interface DeckCardItemProps {
  card: PokemonCard;
  quantity: number;
  onIncrease: (card: PokemonCard) => void;
  onDecrease: (card: PokemonCard) => void;
  onRemove: (card: PokemonCard) => void;
}

export default function DeckCardItem({ card, quantity, onIncrease, onDecrease, onRemove }: DeckCardItemProps) {
  const bgColor = "bg-muted/30 border-border/60 text-foreground";

  return (
    <div className={`flex items-center gap-3 p-2 rounded-xl border ${bgColor} transition-all relative group`}>


      <div className="w-12 h-16 shrink-0 relative rounded-md overflow-hidden bg-muted shadow-sm flex items-center justify-center">
        {card.image_url ? (
          <img 
            src={card.image_url} 
            alt={card.name} 
            className="object-cover w-full h-full"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-foreground/20">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          </div>
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm truncate" title={card.variant_name ? `${card.name} - ${card.variant_name}` : card.name}>
          {card.name} {card.variant_name && <span className="text-foreground/50 text-xs"> - {card.variant_name}</span>}
        </h4>
        <p className="text-xs opacity-70 truncate">{card.sets?.code} {card.card_number}</p>
      </div>

      <div className="flex flex-col items-center gap-1.5 shrink-0 pr-3 z-10">
        <div className="flex bg-background/50 backdrop-blur rounded-lg border border-border overflow-hidden">
          <button 
            onClick={() => onDecrease(card)}
            className="p-1.5 hover:bg-muted text-foreground/70 hover:text-foreground transition-colors cursor-pointer"
          >
            <Minus size={14} />
          </button>
          <div className="w-8 flex items-center justify-center text-sm bg-muted/30">
            {quantity}
          </div>
          <button 
            onClick={() => onIncrease(card)}
            className="p-1.5 hover:bg-muted text-foreground/70 hover:text-foreground transition-colors cursor-pointer"
          >
            <Plus size={14} />
          </button>
        </div>
        
        <button 
          onClick={(e) => { e.preventDefault(); e.stopPropagation(); onRemove(card); }}
          className="bg-red-500/10 hover:bg-red-500/20 text-red-600 rounded-md py-1.5 transition-colors cursor-pointer w-full flex items-center justify-center gap-1.5 text-[10px] font-medium shadow-sm"
          title="Hapus dari Deck"
        >
          <Trash2 size={12} /> Hapus
        </button>
      </div>
    </div>
  );
}
