"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Deck, DeckItem, PokemonCard as PokemonCardType } from "@/types";
import { fetchCardsBasedOnFilters, fetchFilterOptions, getCardsByIds } from "@/app/actions/cards.fetch";
import { createDeck, updateDeck } from "@/app/actions/decks";
import CustomDropdown from "@/components/ui/CustomDropdown";
import DeckCardItem from "@/components/ui/DeckCardItem";
import { Search, Loader2, Save, ChevronLeft, AlertCircle, Plus, Edit2 } from "lucide-react";
import { DECK_MAX_CARDS, DECK_MAX_COPIES_PER_NAME, DECK_MAX_BASIC_ENERGY, BASIC_ENERGY_KEYWORDS } from "@/lib/constants";

export default function DeckBuilderView({ initialDeck }: { initialDeck: Deck | null }) {
  const router = useRouter();

  // --- Right Panel (Deck State) ---
  const [deckName, setDeckName] = useState(initialDeck?.name || "Deck Baru Saya");
  const [deckCards, setDeckCards] = useState<DeckItem[]>(initialDeck?.cards || []);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  const [fullCardObjects, setFullCardObjects] = useState<{ [id: number]: PokemonCardType }>({});

  // Hydrate full card data for deck items loaded from the database
  useEffect(() => {
    if (!initialDeck?.cards?.length) return;
    const ids = initialDeck.cards.map((item) => item.cardId);
    getCardsByIds(ids).then((cardMap) => {
      setFullCardObjects((prev) => ({ ...prev, ...cardMap }));
    });
  }, [initialDeck]);

  const showToast = (text: string, type: 'error' | 'success' = 'error') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 3000);
  };

  const totalCardsInDeck = deckCards.reduce((acc, item) => acc + item.quantity, 0);

  const getCardLimit = (card: PokemonCardType): number => {
    const nameLower = card.name.toLowerCase();
    const isBasicEnergy = BASIC_ENERGY_KEYWORDS.some((kw) => nameLower.includes(kw));
    return isBasicEnergy ? DECK_MAX_BASIC_ENERGY : DECK_MAX_COPIES_PER_NAME;
  };

  const currentCopiesInDeck = (cardName: string): number => {
    // Pokemon TCG rules: copy limits apply to cards sharing the exact same name
    return deckCards.reduce((acc, item) => {
      const c = fullCardObjects[item.cardId];
      if (c && c.name === cardName) return acc + item.quantity;
      return acc;
    }, 0);
  };

  const handleAddCard = (card: PokemonCardType) => {
    if (totalCardsInDeck >= DECK_MAX_CARDS) {
      showToast(`Deck sudah mencapai batas maksimal ${DECK_MAX_CARDS} kartu!`);
      return;
    }

    const limit = getCardLimit(card);
    const currentCopies = currentCopiesInDeck(card.name);

    if (currentCopies >= limit) {
      showToast(`Kamu sudah memasukkan batas maksimal ${limit} kartu berjudul "${card.name}".`);
      return;
    }

    setFullCardObjects(prev => ({ ...prev, [card.id]: card }));

    setDeckCards(prev => {
      const existing = prev.find(p => p.cardId === card.id);
      if (existing) {
        return prev.map(p => p.cardId === card.id ? { ...p, quantity: p.quantity + 1 } : p);
      }
      return [...prev, { cardId: card.id, quantity: 1 }];
    });
  };

  const handleDecreaseCard = (card: PokemonCardType) => {
    setDeckCards(prev => {
      const existing = prev.find(p => p.cardId === card.id);
      if (!existing) return prev;
      if (existing.quantity === 1) {
        return prev.filter(p => p.cardId !== card.id);
      }
      return prev.map(p => p.cardId === card.id ? { ...p, quantity: p.quantity - 1 } : p);
    });
  };

  const handleRemoveCard = (card: PokemonCardType) => {
    setDeckCards(prev => prev.filter(p => p.cardId !== card.id));
  };


  const handleSaveDeck = async () => {
    if (!deckName.trim()) {
      showToast("Nama deck tidak boleh kosong!");
      return;
    }
    setIsSaving(true);
    let success = false;
    let err = null;

    if (initialDeck) {
      const res = await updateDeck(initialDeck.id, deckName, deckCards);
      success = !!res.deck;
      err = res.error;
    } else {
      const res = await createDeck(deckName, deckCards);
      success = !!res.deck;
      err = res.error;
      if (success && res.deck) {
        // Change URL to edit mode quietly
        window.history.replaceState({}, '', `/decks/build?id=${res.deck.id}`);
      }
    }

    setIsSaving(false);
    if (success) {
      showToast("Deck berhasil disimpan!", "success");
    } else {
      showToast(`Gagal menyimpan: ${err}`);
    }
  };


  // --- Left Panel (Catalog Search State) --- 
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [cardTypeFilter, setCardTypeFilter] = useState("Semua");
  const [expansionFilter, setExpansionFilter] = useState("Semua");
  const [filterOptions, setFilterOptions] = useState<any>({ expansions: ["Semua"] });
  const [fetchedCards, setFetchedCards] = useState<PokemonCardType[]>([]);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [hasMoreServer, setHasMoreServer] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const loaderRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    let isMounted = true;
    const fetchOptions = async () => {
       const opts = await fetchFilterOptions(expansionFilter);
       if (isMounted) setFilterOptions(opts);
    };
    fetchOptions();
    return () => { isMounted = false; };
  }, [expansionFilter]);

  const fetchCatalog = async (pageToFetch: number, overwrite: boolean = false) => {
    setIsLoadingCards(true);
    const filters = { 
      searchQuery: debouncedQuery, 
      expansionFilter, 
      cardTypeFilter, 
      elementFilter: "Semua", 
      stageFilter: "Semua", 
      illustratorFilter: "Semua", 
      regulationFilter: "Semua", 
      rarityFilter: "Semua" 
    };
    const { cards, hasMore, totalCount } = await fetchCardsBasedOnFilters(filters, pageToFetch, 30);
    
    // Store them in fullCardObjects so the right panel can read them if clicked
    const cardObjMap = { ...fullCardObjects };
    cards.forEach(c => cardObjMap[c.id] = c);
    setFullCardObjects(cardObjMap);

    if (overwrite) setFetchedCards(cards);
    else setFetchedCards(prev => [...prev, ...cards]);
    
    setHasMoreServer(hasMore);
    setCurrentPage(pageToFetch);
    setIsLoadingCards(false);
  };

  useEffect(() => {
    fetchCatalog(0, true);
  }, [debouncedQuery, expansionFilter, cardTypeFilter]);

  // Special fetch to populate full card objects for initially loaded decks
  useEffect(() => {
    if (initialDeck && initialDeck.cards.length > 0) {
      // Extremely basic hydration for the demo. In production, we should specifically
      // fetch WHERE id IN (deck items). Since our search is text based, we'll wait for the user to type 
      // or we just assume they'll surface. For a perfect UX, you'd add an endpoint to get cards by array of IDs.
    }
  }, [initialDeck]);

  useEffect(() => {
    const currentObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingCards && hasMoreServer) {
          fetchCatalog(currentPage + 1, false);
        }
      },
      { rootMargin: "300px" }
    );
    if (loaderRef.current) currentObserver.observe(loaderRef.current);
    return () => { if (loaderRef.current) currentObserver.unobserve(loaderRef.current); };
  }, [hasMoreServer, isLoadingCards, currentPage]);

  const cardTypes = ["Semua", "Pokémon", "Item", "Supporter", "Stadium", "Pokémon Tool", "Energy"];


  return (
    <div className="flex flex-col lg:flex-row h-full overflow-hidden bg-background max-w-[1400px] mx-auto w-full border-x border-border/20 shadow-sm relative">
      {/* Toast */}
      {toastMessage && (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 rounded-full shadow-2xl  text-sm flex items-center gap-2 animate-in slide-in-from-top-4 ${toastMessage.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
          <AlertCircle size={18} /> {toastMessage.text}
        </div>
      )}

      {/* LEFT PANEL: CATALOG */}
      <div className="flex-1 w-full lg:w-2/3 h-auto min-h-[50vh] lg:h-full flex flex-col border-b lg:border-b-0 lg:border-r border-border lg:overflow-hidden">
        
        {/* Header Left */}
        <div className="p-4 border-b border-border bg-muted/20 flex flex-col gap-3 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={() => router.push('/decks')} className="inline-flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors w-fit cursor-pointer">
              <ChevronLeft size={16} /> Kembali ke Deck
            </button>
          </div>
          
          <div className="flex flex-col gap-3">
            <div className="relative flex-1 flex flex-col gap-1 w-full">
              <span className="text-[10px] items-end  uppercase tracking-widest text-foreground/50 ml-1">Pencarian</span>
              <div className="relative w-full">
                <Search className="absolute left-3 top-[50%] -translate-y-[50%] text-foreground/40 pointer-events-none" size={16} />
                <input 
                  type="text" 
                  placeholder="Cari nama kartu..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full font-[inherit] pl-9 pr-3 h-[42px] bg-background border border-border/50 rounded-xl text-sm transition-all focus:outline-none focus:ring-1 focus:ring-foreground/30 shadow-sm"
                />
              </div>
            </div>
            <div className="flex gap-2 w-full">
              <div className="flex-1 min-w-[120px]">
                 <CustomDropdown label="Ekspansi" options={filterOptions.expansions || ["Semua"]} value={expansionFilter} onChange={setExpansionFilter} />
              </div>
              <div className="flex-1 min-w-[120px]">
                 <CustomDropdown label="Jenis" options={cardTypes} value={cardTypeFilter} onChange={setCardTypeFilter} />
              </div>
            </div>
          </div>
        </div>

        {/* Catalog Grid Left */}
        <div className="flex-1 overflow-visible lg:overflow-y-auto p-4 lg:custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-4 lg:pb-20">
            {fetchedCards.map((card) => (
              <div key={card.id} className="relative group cursor-pointer" onClick={() => handleAddCard(card)}>
                <img 
                  src={card.image_url} 
                  alt={card.name} 
                  className="w-full h-auto rounded-lg shadow-sm border border-border/10 group-hover:shadow-md group-hover:border-blue-500/50 transition-all group-active:scale-95"
                  loading="lazy"
                />
                {/* Overlay Add Button */}
                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center cursor-pointer">
                  <div className="bg-foreground text-background px-3 py-1.5 rounded-full text-xs flex items-center gap-1 shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-all font-[inherit]">
                    <Plus size={14} /> Tambah
                  </div>
                </div>
              </div>
            ))}
          </div>
          {isLoadingCards && <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-foreground/30" size={24} /></div>}
          <div ref={loaderRef} className="h-4 w-full"></div>
        </div>
      </div>

      {/* RIGHT PANEL: DECK CANVAS */}
      <div className="w-full lg:w-1/3 lg:min-w-[320px] lg:max-w-[500px] h-full min-h-[50vh] bg-slate-50 dark:bg-muted/30 border-t-2 border-border/50 lg:border-t-0 flex flex-col shrink-0">
        <div className="p-4 border-b border-border bg-slate-50 dark:bg-transparent flex flex-col gap-4 shadow-sm lg:shadow-none shrink-0">
          <div className="relative flex items-center group">
            <input 
              type="text" 
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              className="w-full font-[inherit] bg-transparent text-sm lg:text-base border-none outline-none focus:ring-0 px-0 pr-8 placeholder-foreground/20"
              placeholder="Nama Deck Anda..."
            />
            <Edit2 size={16} className="absolute right-2 text-foreground/50 transition-opacity pointer-events-none" />
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className={`text-sm lg:text-base ${totalCardsInDeck > 60 ? 'text-red-500' : 'text-foreground'}`}>
                {totalCardsInDeck}
              </span>
              <span className="text-xs text-foreground/50">/ 60 Kartu</span>
            </div>

            <button 
              onClick={handleSaveDeck}
              disabled={isSaving}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-xl font-[inherit] transition-all shadow-sm cursor-pointer ${
                totalCardsInDeck > 60 
                  ? 'bg-muted/50 text-foreground/40 cursor-not-allowed' 
                  : 'bg-foreground text-background hover:scale-105'
              }`}
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Simpan
            </button>
          </div>
        </div>

        {/* Deck List Array By Category */}
        <div className="flex-1 overflow-visible lg:overflow-y-auto p-4 lg:custom-scrollbar flex flex-col gap-5">
          {deckCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center p-6 opacity-40">
              <div className="text-4xl mb-4">🎴</div>
              <p className=" text-sm">Kanvas Anda Masih Kosong</p>
              <p className="text-xs mt-1">Klik kartu di katalog sebelah kiri untuk menambahkannya ke deck ini.</p>
            </div>
          ) : (
            <>
              {["Pokemon", "Trainer", "Energy"].map(category => {
                const itemsInCategory = deckCards.filter(item => {
                  const c = fullCardObjects[item.cardId];
                  if (!c) return category === "Pokemon"; // Default unmatched to Pokemon
                  
                  const isEnergy = c.name.toLowerCase().includes("energi") || c.name.toLowerCase().includes("energy");
                  const isTrainer = !c.hp && !c.types?.length && !isEnergy;
                  
                  if (category === "Energy") return isEnergy;
                  if (category === "Trainer") return isTrainer;
                  return !isTrainer && !isEnergy;
                });

                if (itemsInCategory.length === 0) return null;

                const categoryCount = itemsInCategory.reduce((acc, item) => acc + item.quantity, 0);

                return (
                  <div key={category} className="flex flex-col gap-2">
                    <h3 className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest border-b border-border/50 pb-1 mb-1">
                      {category} ({categoryCount})
                    </h3>
                    {itemsInCategory.map(item => {
                      const displayCard = fullCardObjects[item.cardId] || { 
                        id: item.cardId, name: `Memuat Kartu...`, image_url: "", sets: { code: "" }, card_number: "" 
                      } as any;

                      return (
                        <DeckCardItem 
                          key={item.cardId}
                          card={displayCard}
                          quantity={item.quantity}
                          onIncrease={handleAddCard}
                          onDecrease={handleDecreaseCard}
                          onRemove={handleRemoveCard}
                        />
                      )
                    })}
                  </div>
                )
              })}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
