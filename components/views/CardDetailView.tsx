"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, Plus, Minus, Heart, Bookmark } from "lucide-react";
import ZoomableImage from "@/components/ui/ZoomableImage";
import { createClient } from "@/utils/supabase/client";

interface CollectionData {
  quantity: number;
  is_wishlist: boolean;
}

export default function CardDetailView({ initialCards }: { initialCards: any[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const [collectionMap, setCollectionMap] = useState<Record<string, CollectionData>>({});
  const [isLoading, setIsLoading] = useState(false);

  const card = initialCards[activeIndex];
  const supabase = createClient();

  useEffect(() => {
    const fetchUserAndCollection = async () => {
      const { data: authData } = await supabase.auth.getUser();
      if (!authData.user) return;
      
      setUserId(authData.user.id);
      const cardIds = initialCards.map(c => c.id);
      const { data: colData } = await supabase
        .from("user_collections")
        .select("card_id, quantity, is_wishlist")
        .in("card_id", cardIds)
        .eq("user_id", authData.user.id);

      if (colData) {
        const newMap: Record<string, CollectionData> = {};
        colData.forEach(item => {
          newMap[item.card_id] = { quantity: item.quantity, is_wishlist: item.is_wishlist };
        });
        setCollectionMap(newMap);
      }
    };
    fetchUserAndCollection();
  }, [initialCards, supabase]);

  const updateDatabase = async (cardId: string, newData: CollectionData) => {
    if (!userId) return;
    setIsLoading(true);
    
    if (newData.quantity === 0 && !newData.is_wishlist) {
      await supabase.from("user_collections").delete().eq("user_id", userId).eq("card_id", cardId);
    } else {
      await supabase.from("user_collections").upsert({
        user_id: userId, card_id: cardId, quantity: newData.quantity, is_wishlist: newData.is_wishlist
      }, { onConflict: "user_id, card_id" });
    }
    
    setCollectionMap(prev => ({ ...prev, [cardId]: newData }));
    setIsLoading(false);
  };

  const handleQuantityChange = (amount: number) => {
    if (!userId) {
      alert("Silakan login terlebih dahulu untuk menambahkan ke koleksi.");
      return;
    }
    const currentData = collectionMap[card.id] || { quantity: 0, is_wishlist: false };
    const newQuantity = Math.max(0, currentData.quantity + amount);
    updateDatabase(card.id, { ...currentData, quantity: newQuantity });
  };

  const toggleWishlist = () => {
    if (!userId) {
      alert("Silakan login terlebih dahulu untuk menggunakan fitur wishlist.");
      return;
    }
    const currentData = collectionMap[card.id] || { quantity: 0, is_wishlist: false };
    updateDatabase(card.id, { ...currentData, is_wishlist: !currentData.is_wishlist });
  };

  const cardStage = (() => {
    const nameUpper = (card.name || "").toUpperCase();
    const stageRaw = (card.stage || "").trim();
    const stageLower = stageRaw.toLowerCase();

    let base = "Lainnya";
    if (stageLower.includes("basic") || stageLower === "basic") base = "Basic";
    else if (stageLower.includes("stage 1")) base = "Stage 1";
    else if (stageLower.includes("stage 2")) base = "Stage 2";
    else if (stageRaw) base = stageRaw;

    if (nameUpper.includes("VMAX")) return "VMAX";
    if (nameUpper.includes("VSTAR")) return "VSTAR";

    let suffix = "";
    if (nameUpper.endsWith(" EX") || nameUpper.includes(" EX ")) suffix = "EX";
    else if (nameUpper.includes("GX")) suffix = "GX";
    else if (nameUpper.endsWith(" V") || nameUpper.includes(" V ")) suffix = "V";

    if (suffix && (base === "Basic" || base === "Stage 1" || base === "Stage 2")) return `${base} ${suffix}`;
    return base;
  })();

  const currentCollection = collectionMap[card.id] || { quantity: 0, is_wishlist: false };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 pb-20 pt-8">
      <div className="mb-6">
        <Link href="/" className="inline-flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors w-fit font-medium">
          <ChevronLeft size={16} /> Kembali ke Library
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-start">
        <div className="lg:col-span-5 flex flex-col items-center gap-6">
          <div className="w-full max-w-[380px] lg:max-w-full relative">
            {card.image_url ? (
              <ZoomableImage key={card.id} src={card.image_url} alt={card.name} />
            ) : (
              <div className="w-full aspect-[63/88] rounded-[24px] bg-muted flex items-center justify-center border border-border">
                <span className="text-foreground/40 font-medium">No Image</span>
              </div>
            )}
            {currentCollection.quantity > 0 && (
              <div className="absolute -top-3 -right-3 bg-foreground text-background font-black text-lg w-10 h-10 rounded-full flex items-center justify-center border-4 border-background shadow-lg z-10">
                {currentCollection.quantity}
              </div>
            )}
          </div>

          <div className="w-full max-w-[380px] lg:max-w-full flex gap-3">
            <div className="flex-1 flex items-center justify-between bg-muted/30 border border-border/60 rounded-xl p-1.5">
              <button onClick={() => handleQuantityChange(-1)} disabled={isLoading || currentCollection.quantity === 0} className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-background border border-transparent hover:border-border/60 transition-all disabled:opacity-30">
                <Minus size={18} />
              </button>
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold uppercase tracking-widest text-foreground/50">Koleksi</span>
                <span className="font-black text-lg leading-none">{currentCollection.quantity}</span>
              </div>
              <button onClick={() => handleQuantityChange(1)} disabled={isLoading} className="w-10 h-10 flex items-center justify-center rounded-lg bg-foreground text-background hover:scale-105 transition-all disabled:opacity-50">
                <Plus size={18} />
              </button>
            </div>
            
            <button onClick={toggleWishlist} disabled={isLoading} className={`w-14 flex items-center justify-center rounded-xl border transition-all disabled:opacity-50 ${currentCollection.is_wishlist ? 'bg-red-500/10 border-red-500/30 text-red-500' : 'bg-muted/30 border-border/60 text-foreground/50 hover:text-foreground hover:bg-background'}`}>
              <Heart size={20} className={currentCollection.is_wishlist ? "fill-current" : ""} />
            </button>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">{card.name}</h1>
            <div className="flex flex-wrap items-center gap-2 mt-1">
              <span className="text-xs font-bold text-foreground/50 uppercase tracking-widest">{cardStage}</span>
              {card.evolution && card.evolution.length > 0 && (
                <><span className="text-foreground/30 px-1">•</span><span className="text-xs font-semibold text-foreground/60">Evolusi: {card.evolution.join(" → ")}</span></>
              )}
            </div>

            {initialCards.length > 1 && (
              <div className="mt-5 flex flex-col gap-2.5">
                <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/40">Varian Kartu</span>
                <div className="flex flex-wrap gap-2">
                  {initialCards.map((variantCard, idx) => {
                    const label = variantCard.variant_name ? variantCard.variant_name : `Varian ${idx + 1}`;
                    const variantCollection = collectionMap[variantCard.id];
                    const hasVariant = variantCollection && variantCollection.quantity > 0;

                    return (
                      <button
                        key={variantCard.id}
                        onClick={() => setActiveIndex(idx)}
                        className={`px-4 py-2 text-xs font-bold rounded-xl transition-all border flex items-center gap-2 ${
                          activeIndex === idx ? 'bg-foreground text-background border-foreground shadow-md' : 'bg-background text-foreground/70 border-border/60 hover:border-foreground/40 hover:bg-muted/30'
                        }`}
                      >
                        {label}
                        {hasVariant && <Bookmark size={12} className={activeIndex === idx ? "text-background" : "text-foreground"} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
            
            <div className="flex flex-wrap items-center gap-5 mt-5">
              {Number(card.hp) > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-foreground/40 font-bold text-sm tracking-widest uppercase">HP</span>
                  <span className="text-3xl font-bold leading-none">{card.hp}</span>
                </div>
              )}
              {card.types && card.types.length > 0 && (
                <>
                  {Number(card.hp) > 0 && <span className="text-border text-2xl font-light hidden sm:block">/</span>}
                  <div className="flex items-center gap-2">
                    <span className="text-foreground/40 font-bold text-sm tracking-widest uppercase">TIPE</span>
                    <div className="flex items-center gap-1">
                      {card.types.map((imgUrl: string, index: number) => (
                        <img key={index} src={imgUrl} alt="Type" className="object-contain drop-shadow-sm w-6 h-6" />
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>

            {(card.pokedex_number || card.species || card.height || card.weight) && (
              <div className="mt-4 flex flex-wrap items-center gap-2.5 text-xs font-medium text-foreground/50">
                {card.pokedex_number && <span>Pokédex No. {card.pokedex_number.replace(/No\.?/ig, '').trim()}</span>}
                {card.pokedex_number && card.species && <span className="text-border">•</span>}
                {card.species && <span>{card.species}</span>}
                {(card.pokedex_number || card.species) && (card.height || card.weight) && <span className="text-border">•</span>}
                {card.height && <span>Tinggi: {card.height.replace(/m/ig, '').trim()} m</span>}
                {card.height && card.weight && <span className="text-border">•</span>}
                {card.weight && <span>Berat: {card.weight.replace(/kg/ig, '').trim()} kg</span>}
              </div>
            )}
            
            {card.description && <p className="text-foreground/70 leading-relaxed italic text-sm mt-1">"{card.description}"</p>}
          </div>

          <hr className="border-border/60" />

          {card.attacks && card.attacks.length > 0 && (
            <div className="flex flex-col gap-3">
              {card.attacks.map((attack: any, index: number) => {
                const validCost = attack.cost && attack.cost.length > 0;
                const validName = attack.name && attack.name.trim() !== "";
                const validDamage = attack.damage && attack.damage.trim() !== "";
                const hasHeader = validCost || validName || validDamage;
                
                return (
                  <div key={index} className="flex flex-col justify-center p-5 rounded-[20px] bg-background border border-border/80 shadow-sm hover:border-foreground/20 transition-colors">
                    {hasHeader && (
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-4 flex-wrap">
                          {validCost && (
                            <div className="flex items-center gap-1">
                              {attack.cost.map((costImg: string, i: number) => (
                                <img key={i} src={costImg} alt="Cost" className="object-contain drop-shadow-sm w-6 h-6" />
                              ))}
                            </div>
                          )}
                          {validName && <span className="font-bold text-lg">{attack.name}</span>}
                        </div>
                        {validDamage && <span className="font-black text-xl whitespace-nowrap">{attack.damage}</span>}
                      </div>
                    )}
                    {attack.effect && <p className="text-sm text-foreground/70 leading-relaxed">{attack.effect}</p>}
                  </div>
                );
              })}
            </div>
          )}

          {Number(card.hp) > 0 && (
            <div className="grid grid-cols-3 divide-x divide-border/60 border border-border/60 rounded-[20px] bg-background">
              <div className="flex flex-col items-center justify-center p-4 gap-1.5">
                <span className="text-foreground/40 text-[10px] font-bold uppercase tracking-widest">Kelemahan</span>
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  {card.weakness?.type ? (
                    <><img src={card.weakness.type} alt="Weakness" className="w-[18px] h-[18px]" /><span>{card.weakness.value}</span></>
                  ) : (<span className="text-foreground/30">--</span>)}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center p-4 gap-1.5">
                <span className="text-foreground/40 text-[10px] font-bold uppercase tracking-widest">Resistansi</span>
                <div className="flex items-center gap-1.5 font-bold text-sm">
                  {card.resistance?.type ? (
                    <><img src={card.resistance.type} alt="Resistance" className="w-[18px] h-[18px]" /><span>{card.resistance.value}</span></>
                  ) : (<span className="text-foreground/30">--</span>)}
                </div>
              </div>
              <div className="flex flex-col items-center justify-center p-4 gap-1.5">
                <span className="text-foreground/40 text-[10px] font-bold uppercase tracking-widest">Mundur</span>
                <div className="flex items-center gap-1">
                  {card.retreat_cost > 0 ? (
                    Array.from({ length: card.retreat_cost }).map((_, i) => (
                      <img key={i} src="https://asia.pokemon-card.com/various_images/energy/Colorless.png" alt="Retreat" className="w-[18px] h-[18px]" />
                    ))
                  ) : (<span className="text-foreground/30">--</span>)}
                </div>
              </div>
            </div>
          )}

          <div className="grid grid-cols-5 divide-x divide-border/60 border border-border/60 rounded-[20px] bg-background text-center">
            <div className="flex flex-col p-3 md:p-4 gap-1 justify-center items-center">
              <span className="text-foreground/40 text-[9px] font-bold uppercase tracking-widest">Ilustrator</span>
              <span className="font-bold text-[11px] text-center break-words">{card.illustrator || "--"}</span>
            </div>
            <div className="flex flex-col p-3 md:p-4 gap-1 justify-center items-center">
              <span className="text-foreground/40 text-[9px] font-bold uppercase tracking-widest">Ekspansi</span>
              {card.expansion_symbol_url ? (
                <img src={card.expansion_symbol_url} alt="Symbol" className="h-4 w-auto object-contain drop-shadow-sm" />
              ) : (<span className="text-foreground/30 text-[11px] font-bold">--</span>)}
            </div>
            <div className="flex flex-col p-3 md:p-4 gap-1 justify-center items-center">
              <span className="text-foreground/40 text-[9px] font-bold uppercase tracking-widest">Regulasi</span>
              <span className="font-bold text-[11px]">{card.regulation_mark || "--"}</span>
            </div>
            <div className="flex flex-col p-3 md:p-4 gap-1 justify-center items-center">
              <span className="text-foreground/40 text-[9px] font-bold uppercase tracking-widest">No. Kartu</span>
              <span className="font-bold text-[11px]">{card.card_number || "--"}</span>
            </div>
            <div className="flex flex-col p-3 md:p-4 gap-1 justify-center items-center">
              <span className="text-foreground/40 text-[9px] font-bold uppercase tracking-widest">Rarity</span>
              <span className="font-bold text-[11px]">{card.rarity || "--"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}