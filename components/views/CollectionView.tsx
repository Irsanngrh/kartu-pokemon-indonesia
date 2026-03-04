"use client";

import { useState, useMemo } from "react";
import PokemonCard from "@/components/ui/PokemonCard";

interface CollectionViewProps {
  initialCollections: any[];
  userName: string;
}

export default function CollectionView({ initialCollections, userName }: CollectionViewProps) {
  const [activeTab, setActiveTab] = useState<"collection" | "wishlist">("collection");

  const filteredData = useMemo(() => {
    if (activeTab === "collection") {
      return initialCollections.filter((item) => item.quantity > 0);
    } else {
      return initialCollections.filter((item) => item.is_wishlist);
    }
  }, [initialCollections, activeTab]);

  return (
    <div className="flex flex-col gap-8 pb-10 pt-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl font-extrabold tracking-tight">Koleksi {userName}</h1>
      </header>

      <div className="flex gap-4 border-b border-border/40 pb-2">
        <button
          onClick={() => setActiveTab("collection")}
          className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${
            activeTab === "collection" ? "bg-foreground text-background" : "bg-muted text-foreground/60 hover:text-foreground"
          }`}
        >
          Koleksi Saya
        </button>
        <button
          onClick={() => setActiveTab("wishlist")}
          className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${
            activeTab === "wishlist" ? "bg-foreground text-background" : "bg-muted text-foreground/60 hover:text-foreground"
          }`}
        >
          Wishlist
        </button>
      </div>

      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
        {filteredData.map((item) => (
          <div key={item.cards.id} className="relative">
            <PokemonCard card={item.cards} />
            {activeTab === "collection" && (
              <div className="absolute -top-3 -right-3 bg-foreground text-background font-black text-sm w-8 h-8 rounded-full flex items-center justify-center border-2 border-background z-20 shadow-md">
                {item.quantity}
              </div>
            )}
          </div>
        ))}
        {filteredData.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-3">
            <span className="text-4xl grayscale opacity-50">📭</span>
            <p className="text-foreground/50 text-sm font-bold uppercase tracking-widest">Belum ada kartu</p>
          </div>
        )}
      </div>
    </div>
  );
}