"use client";

import { PokemonCard } from "@/types";
import { Minus, Plus, X } from "lucide-react";

interface DeckCardItemProps {
  card: PokemonCard;
  quantity: number;
  onIncrease: (card: PokemonCard) => void;
  onDecrease: (card: PokemonCard) => void;
  onRemove: (card: PokemonCard) => void;
}

export default function DeckCardItem({ card, quantity, onIncrease, onDecrease, onRemove }: DeckCardItemProps) {
  // Removed colored backgrounds
  let bgColor = "bg-muted/30 border-border/60 text-foreground";

  return (
    <div className={`flex items-center gap-3 p-2 rounded-xl border ${bgColor} transition-all relative group`}>
      <button 
        onClick={() => onRemove(card)}
        className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 
                   group-hover:opacity-100 transition-opacity shadow-md z-10"
      >
        <X size={12} strokeWidth={3} />
      </button>

      <div className="w-12 h-16 shrink-0 relative rounded-md overflow-hidden bg-muted shadow-sm flex items-center justify-center">
        {card.image_url ? (
          <img 
            src={card.image_url} 
            alt={card.name} 
            className="object-cover w-full h-full"
            loading="lazy"
          />
        ) : (
          <div className="w-6 h-6 rounded-full border-2 border-dashed border-muted-foreground/30 animate-spin" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <h4 className="text-sm truncate" title={card.variant_name ? `${card.name} - ${card.variant_name}` : card.name}>
          {card.name} {card.variant_name && <span className="text-foreground/50 text-xs"> - {card.variant_name}</span>}
        </h4>
        <p className="text-xs opacity-70 truncate">{card.sets?.code} {card.card_number}</p>
      </div>

      <div className="flex bg-background/50 backdrop-blur rounded-lg border border-border overflow-hidden shrink-0">
        <button 
          onClick={() => onDecrease(card)}
          className="p-1.5 hover:bg-muted text-foreground/70 hover:text-foreground transition-colors"
        >
          <Minus size={14} />
        </button>
        <div className="w-8 flex items-center justify-center text-sm  bg-muted/30">
          {quantity}
        </div>
        <button 
          onClick={() => onIncrease(card)}
          className="p-1.5 hover:bg-muted text-foreground/70 hover:text-foreground transition-colors"
        >
          <Plus size={14} />
        </button>
      </div>
    </div>
  );
}
