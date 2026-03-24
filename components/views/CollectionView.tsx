"use client";

import { useState, useMemo } from "react";
import PokemonCard from "@/components/ui/PokemonCard";
import { Share2, Check, LibrarySquare } from "lucide-react";

interface CollectionViewProps {
  initialCollections: any[];
  userName: string;
  isOwner: boolean;
  userId: string;
  isLoggedIn?: boolean;
  initialTab?: "collection" | "wishlist";
}

export default function CollectionView({ initialCollections, userName, isOwner, userId, isLoggedIn = true, initialTab }: CollectionViewProps) {
  const [activeTab, setActiveTab] = useState<"collection" | "wishlist">(initialTab === "wishlist" ? "wishlist" : "collection");
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
    const url = `${window.location.origin}/collection?uid=${userId}&n=${safeName}&tab=${activeTab}`;

    navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex flex-col py-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1 flex items-center gap-2.5">
            <LibrarySquare size={26} />
            Koleksi {userName}
          </h1>
          <p className="text-foreground/50 text-sm">Kelola kartu koleksi dan wishlist kamu.</p>
        </div>
        {isOwner && (
          <button
            onClick={handleShare}
            className="flex items-center gap-2 bg-foreground text-background h-[42px] px-5 rounded-xl text-sm transition-all shadow-sm hover:scale-105 active:scale-95 duration-200"
          >
            {copied ? <Check size={18} /> : <Share2 size={18} />}
            {copied ? "Tersalin!" : "Bagikan"}
          </button>
        )}
      </header>

      <div className="flex gap-4 border-b border-border/40 pb-2 mb-6">
        <button
          onClick={() => setActiveTab("collection")}
          className={`px-4 py-2 text-sm  rounded-t-lg transition-colors ${activeTab === "collection" ? "bg-foreground text-background" : "bg-muted text-foreground/60 hover:text-foreground"
            }`}
        >
          Koleksi {isOwner ? "" : ""}
        </button>
        <button
          onClick={() => setActiveTab("wishlist")}
          className={`px-4 py-2 text-sm  rounded-t-lg transition-colors ${activeTab === "wishlist" ? "bg-foreground text-background" : "bg-muted text-foreground/60 hover:text-foreground"
            }`}
        >
          Wishlist
        </button>
      </div>

      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
        {filteredData.map((item) => (
          <div key={item.cards.id} className="relative">
            <PokemonCard card={item.cards} source={activeTab} uid={userId} n={userName} />
            {activeTab === "collection" && (
              <div className="absolute -top-3 -right-3 bg-foreground text-background  text-sm w-8 h-8 rounded-full flex items-center justify-center border-2 border-background z-20 shadow-md">
                {item.quantity}
              </div>
            )}
          </div>
        ))}
        {filteredData.length === 0 && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-3">
            <LibrarySquare size={36} className="text-foreground/30" />
            <p className="text-foreground/50 text-sm uppercase tracking-widest">{isLoggedIn ? 'Belum ada kartu' : 'Login untuk menambahkan kartu'}</p>
          </div>
        )}
      </div>
    </div>
  );
}
