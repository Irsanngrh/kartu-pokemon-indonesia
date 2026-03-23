"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Deck, DeckItem, PokemonCard as PokemonCardType } from "@/types";
import { fetchCardsBasedOnFilters, fetchFilterOptions, getCardsByIds } from "@/app/actions/cards.fetch";
import { createDeck, updateDeck } from "@/app/actions/decks";
import CustomDropdown from "@/components/ui/CustomDropdown";
import DeckCardItem from "@/components/ui/DeckCardItem";
import { Search, Loader2, Save, ChevronLeft, AlertCircle, Plus, Edit2, ArrowUp } from "lucide-react";
import { DECK_MAX_CARDS, DECK_MAX_COPIES_PER_NAME, DECK_MAX_BASIC_ENERGY, BASIC_ENERGY_KEYWORDS } from "@/lib/constants";

export default function DeckBuilderView({ initialDeck }: { initialDeck: Deck | null }) {
  const router = useRouter();

  // --- Right Panel (Deck State) ---
  const [deckName, setDeckName] = useState(initialDeck?.name || "Deck Baru Saya");
  const [deckCards, setDeckCards] = useState<DeckItem[]>(initialDeck?.cards || []);
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const [mobileTab, setMobileTab] = useState<'catalog' | 'deck'>('catalog');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const catalogScrollRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

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
    // Clear existing timeout if present to prevent overlapping toasts clearing too early
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
    showToast(`1 kartu ${card.name} ditambahkan`, 'success');
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
    showToast(`1 kartu ${card.name} dihapus dari deck`, 'error');
  };

  const handleRemoveCard = (card: PokemonCardType) => {
    setDeckCards(prev => prev.filter(p => p.cardId !== card.id));
    showToast(`Kartu ${card.name} dihapus seluruhnya dari deck`, 'error');
  };


  const handleSaveDeck = async () => {
    if (!deckName.trim()) {
      showToast('Nama deck tidak boleh kosong!');
      return;
    }
    setIsSaving(true);
    let success = false;
    let savedId: string | null = initialDeck?.id ?? null;

    if (initialDeck) {
      const res = await updateDeck(initialDeck.id, deckName, deckCards);
      success = !!res.deck;
      if (!success) showToast(`Gagal menyimpan: ${res.error}`);
    } else {
      const res = await createDeck(deckName, deckCards);
      success = !!res.deck;
      if (success && res.deck) {
        savedId = res.deck.id;
        window.history.replaceState({}, '', `/decks/build?id=${savedId}`);
      } else {
        showToast(`Gagal menyimpan: ${res.error}`);
      }
    }

    setIsSaving(false);
    if (success) showToast('Deck berhasil disimpan!', 'success');
  };

  // Back button: go to /decks/[id] if editing, otherwise /decks
  const handleBack = () => {
    if (initialDeck?.id) {
      router.push(`/decks/${initialDeck.id}`);
    } else {
      router.push('/decks');
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
      const opts = await fetchFilterOptions({ expansionFilter, cardTypeFilter });
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
      elementFilter: 'Semua',
      stageFilter: 'Semua',
      illustratorFilter: 'Semua',
      regulationFilter: 'Semua',
      rarityFilter: 'Semua',
    };
    const { cards, hasMore } = await fetchCardsBasedOnFilters(filters, pageToFetch, 30);

    // Merge fetched cards into fullCardObjects for display in the right panel
    setFullCardObjects((prev) => {
      const next = { ...prev };
      cards.forEach((c) => { next[c.id] = c; });
      return next;
    });

    if (overwrite) setFetchedCards(cards);
    else setFetchedCards((prev) => [...prev, ...cards]);

    setHasMoreServer(hasMore);
    setCurrentPage(pageToFetch);
    setIsLoadingCards(false);
  };

  useEffect(() => {
    fetchCatalog(0, true);
  }, [debouncedQuery, expansionFilter, cardTypeFilter]);



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

  // Show scroll-to-top when the filter header leaves the viewport
  useEffect(() => {
    if (!headerRef.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowScrollTop(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

  const cardTypes = ["Semua", "Pokémon", "Item", "Supporter", "Stadium", "Pokémon Tool", "Energy"];


  return (
    <div className="flex flex-col lg:flex-row gap-0 relative -ml-4 sm:-ml-6 lg:-ml-8 w-[calc(100%+1rem)] sm:w-[calc(100%+1.5rem)] lg:w-[calc(100%+2rem)]">
      {/* Toast */}
      {toastMessage && (
        <div className={`fixed top-16 left-1/2 -translate-x-1/2 z-[100] px-4 sm:px-6 py-3 rounded-2xl sm:rounded-full shadow-2xl text-xs sm:text-sm flex items-center gap-2.5 w-max max-w-[92vw] animate-in slide-in-from-top-4 ${toastMessage.type === 'error' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'}`}>
          <AlertCircle size={18} className="shrink-0" /> 
          <span className="leading-snug">{toastMessage.text}</span>
        </div>
      )}

      {/* Mobile Tab Switcher */}
      <div className="flex lg:hidden border-b border-border bg-background shrink-0">
        <button
          onClick={() => setMobileTab('catalog')}
          className={`flex-1 py-3 text-sm transition-colors ${mobileTab === 'catalog' ? 'border-b-2 border-foreground text-foreground' : 'text-foreground/50'}`}
        >
          Katalog Kartu
        </button>
        <button
          onClick={() => setMobileTab('deck')}
          className={`flex-1 py-3 text-sm transition-colors relative ${mobileTab === 'deck' ? 'border-b-2 border-foreground text-foreground' : 'text-foreground/50'}`}
        >
          Deck Saya
          {deckCards.length > 0 && (
            <span className="ml-1.5 bg-foreground text-background text-[10px] rounded-full px-1.5 py-0.5">{totalCardsInDeck}</span>
          )}
        </button>
      </div>

      {/* LEFT PANEL: CATALOG */}
      <div className={`${mobileTab === 'catalog' ? 'flex' : 'hidden'} lg:flex flex-1 flex-col border-b lg:border-b-0 lg:border-r border-border/50 min-w-0`}>

        {/* Header Left — padding compensates for parent negative margin to align with navbar */}
        <div ref={headerRef} className="pl-4 sm:pl-6 lg:pl-8 pr-0 lg:pr-8 pt-4 pb-4 border-b border-border bg-muted/20 flex flex-col gap-3 shrink-0">
          <div className="flex items-center gap-3 mb-2">
            <button onClick={handleBack} className="inline-flex items-center gap-2 text-sm text-foreground/50 hover:text-foreground transition-colors w-fit cursor-pointer">
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
                  placeholder="Cari nama kartu Pokémon..."
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
                <CustomDropdown label="Jenis Kartu" options={cardTypes} value={cardTypeFilter} onChange={setCardTypeFilter} />
              </div>
            </div>
          </div>
        </div>

        {/* Catalog Grid */}
        <div ref={catalogScrollRef} className="pl-4 sm:pl-6 lg:pl-8 pr-0 lg:pr-8 py-4 relative">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 pb-4 lg:pb-20">
            {fetchedCards.map((card, cardIndex) => (
              <div key={`${card.id}_${cardIndex}`} className="relative group cursor-pointer" onClick={() => handleAddCard(card)}>
                <img
                  src={card.image_url}
                  alt={card.name}
                  className="w-full h-auto rounded-lg shadow-sm border border-border/10 group-hover:shadow-md group-hover:border-foreground/30 transition-all group-active:scale-95"
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
          {!isLoadingCards && fetchedCards.length === 0 && (
            <div className="col-span-full py-16 flex flex-col items-center justify-center gap-3">
              <span className="text-4xl grayscale opacity-50">🔍</span>
              <p className="text-foreground/50 text-sm uppercase tracking-widest">Kartu tidak ditemukan</p>
            </div>
          )}
          <div ref={loaderRef} className="h-4 w-full"></div>
        </div>

        {/* Scroll-to-top: sticky positioning perfectly locked entirely within LEFT panel */}
        {showScrollTop && (
          <div className="sticky bottom-4 lg:bottom-6 flex justify-end pr-4 sm:pr-6 lg:pr-12 pointer-events-none z-50 mt-[-50px]">
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="p-4 bg-foreground text-background rounded-full shadow-xl hover:scale-110 transition-transform pointer-events-auto border border-border/20"
              title="Kembali ke atas"
            >
              <ArrowUp size={26} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>



      {/* RIGHT PANEL: DECK CANVAS — no border-l; left panel's border-r acts as separator */}
      <div className={`${mobileTab === 'deck' ? 'flex' : 'hidden'} lg:flex lg:sticky lg:top-[64px] lg:self-start w-full lg:w-[calc(315px+16px)] shrink-0 flex-col bg-background lg:max-h-[calc(100vh-64px)] lg:overflow-y-auto`}>
        <div className="pl-4 pr-0 pt-4 pb-4 border-b border-border bg-background dark:bg-muted/10 flex flex-col gap-4 shrink-0">
          {/* Deck name input with border */}
          <div className="flex items-center gap-2 border border-border rounded-xl px-3 py-2 mr-0 focus-within:ring-1 focus-within:ring-foreground/20">
            <input
              type="text"
              value={deckName}
              onChange={(e) => setDeckName(e.target.value)}
              className="flex-1 font-[inherit] bg-transparent text-sm lg:text-base border-none outline-none focus:ring-0 px-0 placeholder-foreground/20"
              placeholder="Nama Deck Anda..."
            />
            <Edit2 size={15} className="text-foreground/40 pointer-events-none shrink-0" />
          </div>

          <div className="flex items-center justify-between mr-0">
            <div className="flex items-center gap-2">
              <span className={`text-sm lg:text-base ${totalCardsInDeck > 60 ? 'text-red-500' : 'text-foreground'}`}>
                {totalCardsInDeck}
              </span>
              <span className="text-xs text-foreground/50">/ 60 Kartu</span>
            </div>

            <button
              onClick={handleSaveDeck}
              disabled={isSaving}
              className={`flex items-center gap-2 px-4 py-2 text-sm rounded-xl font-[inherit] transition-all shadow-sm cursor-pointer ${totalCardsInDeck > 60
                ? 'bg-muted/50 text-foreground/40 cursor-not-allowed'
                : 'bg-foreground text-background hover:opacity-90 active:scale-95'
                }`}
            >
              {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              Simpan
            </button>
          </div>
        </div>

        <div className="flex-1 lg:overflow-y-auto lg:overflow-x-hidden lg:overscroll-contain pl-4 lg:pl-6 pr-0 lg:pr-6 pt-5 lg:pt-6 pb-6 lg:custom-scrollbar flex flex-col gap-5">
          {deckCards.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-40">
              <p className="text-sm">Kanvas Anda Masih Kosong</p>
              <p className="text-xs mt-1">Klik kartu di katalog untuk menambahkannya.</p>
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
