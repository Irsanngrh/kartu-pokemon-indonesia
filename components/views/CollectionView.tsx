"use client";

import { useState, useMemo } from "react";
import PokemonCard from "@/components/ui/PokemonCard";
import { Share2, Check } from "lucide-react";

interface CollectionViewProps {
  initialCollections: any[];
  userName: string;
  isOwner: boolean;
  userId: string;
}

export default function CollectionView({ initialCollections, userName, isOwner, userId }: CollectionViewProps) {
  const [activeTab, setActiveTab] = useState<"collection" | "wishlist">("collection");
  const [copied, setCopied] = useState(false);

  const filteredData = useMemo(() => {
    let data = [];
    
    if (activeTab === "collection") {
      data = initialCollections.filter((item) => item.quantity > 0);
    } else {
      data = initialCollections.filter((item) => item.is_wishlist);
    }
    
    return data.sort((a, b) => {
      const cardA = a.cards;
      const cardB = b.cards;
      const setA = cardA.sets?.code || "";
      const setB = cardB.sets?.code || "";
      
      if (setA !== setB) return setB.localeCompare(setA);
      
      const numA = parseInt((cardA.card_number || "0").replace(/\D/g, "")) || 0;
      const numB = parseInt((cardB.card_number || "0").replace(/\D/g, "")) || 0;
      if (numA !== numB) return numA - numB;
      
      const orderA = cardA.variant_order || 1;
      const orderB = cardB.variant_order || 1;
      if (orderA !== orderB) return orderA - orderB;
      
      return (cardA.image_url || "").localeCompare(cardB.image_url || "");
    });
  }, [initialCollections, activeTab]);

  const handleShare = () => {

    const safeName = encodeURIComponent(userName);
    const url = `${window.location.origin}/collection?uid=${userId}&n=${safeName}`;
    
    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col gap-8 pb-10 pt-6">
      <header className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl  tracking-tight">Koleksi {userName}</h1>
          {isOwner && (
            <button 
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-xl text-sm  hover:scale-105 transition-transform shadow-sm"
            >
              {copied ? <Check size={16} /> : <Share2 size={16} />}
              <span className="hidden sm:inline">{copied ? "Tersalin!" : "Bagikan"}</span>
            </button>
          )}
        </div>
      </header>

      <div className="flex gap-4 border-b border-border/40 pb-2">
        <button
          onClick={() => setActiveTab("collection")}
          className={`px-4 py-2 text-sm  rounded-t-lg transition-colors ${
            activeTab === "collection" ? "bg-foreground text-background" : "bg-muted text-foreground/60 hover:text-foreground"
          }`}
        >
          Koleksi {isOwner ? "Saya" : ""}
        </button>
        <button
          onClick={() => setActiveTab("wishlist")}
          className={`px-4 py-2 text-sm  rounded-t-lg transition-colors ${
            activeTab === "wishlist" ? "bg-foreground text-background" : "bg-muted text-foreground/60 hover:text-foreground"
          }`}
        >
          Wishlist
        </button>
      </div>

      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
        {filteredData.map((item) => (
          <div key={item.cards.id} className="relative">
            <PokemonCard card={item.cards} source={activeTab} />
            {activeTab === "collection" && (
              <div className="absolute -top-3 -right-3 bg-foreground text-background  text-sm w-8 h-8 rounded-full flex items-center justify-center border-2 border-background z-20 shadow-md">
                {item.quantity}
              </div>
            )}
          </div>
        ))}
        {filteredData.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-3">
            <span className="text-4xl grayscale opacity-50">📭</span>
            <p className="text-foreground/50 text-sm  uppercase tracking-widest">Belum ada kartu</p>
          </div>
        )}
      </div>
    </div>
  );
}
