"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import PokemonCard from "@/components/ui/PokemonCard";
import CustomDropdown from "@/components/ui/CustomDropdown";
import { Search, ArrowUp, Loader2, Info } from "lucide-react";
import { PokemonCard as PokemonCardType } from "@/types";
import { fetchCardsBasedOnFilters, fetchFilterOptions } from "@/app/actions/cards.fetch";

function getCardType(card: any) {
  if (card.hp) return "Pokémon";
  const stage = (card.stage || "").toLowerCase();
  if (stage.includes("supporter")) return "Supporter";
  if (stage.includes("stadium")) return "Stadium";
  if (stage.includes("tool")) return "Pokémon Tool";
  if (stage.includes("item")) return "Item";
  if (stage.includes("energy") || stage.includes("energi")) return "Energy";
  return "Lainnya";
}

function getElements(card: any) {
  if (!card.types) return [];
  return card.types.map((url: string) => {
    const u = url.toLowerCase();
    if (u.includes("grass")) return "Rumput";
    if (u.includes("fire")) return "Api";
    if (u.includes("water")) return "Air";
    if (u.includes("lightning")) return "Listrik";
    if (u.includes("psychic")) return "Psikis";
    if (u.includes("fighting")) return "Petarung";
    if (u.includes("darkness") || u.includes("dark")) return "Kegelapan";
    if (u.includes("metal")) return "Baja";
    if (u.includes("fairy")) return "Peri";
    if (u.includes("dragon")) return "Naga";
    if (u.includes("colorless")) return "Normal";
    return "Lainnya";
  });
}

function getStageInfo(card: any) {
  const nameUpper = (card.name || "").toUpperCase();
  const stageRaw = (card.stage || "").trim();
  const stageLower = stageRaw.toLowerCase();

  let base = "Lainnya";
  if (stageLower.includes("basic") || stageLower === "basic") base = "Basic";
  else if (stageLower.includes("stage 1")) base = "Stage 1";
  else if (stageLower.includes("stage 2")) base = "Stage 2";
  else if (stageRaw) base = stageRaw;

  if (nameUpper.includes("VMAX")) return { categories: ["VMAX"] };
  if (nameUpper.includes("VSTAR")) return { categories: ["VSTAR"] };

  let suffix = "";
  if (nameUpper.endsWith(" EX") || nameUpper.includes(" EX ")) suffix = "EX";
  else if (nameUpper.includes("GX")) suffix = "GX";
  else if (nameUpper.endsWith(" V") || nameUpper.includes(" V ")) suffix = "V";

  if (suffix) {
    if (base === "Basic" || base === "Stage 1" || base === "Stage 2") return { categories: [base, suffix] };
    return { categories: [suffix] };
  }
  return { categories: [base] };
}

export default function LibraryView({ 
  initialCards, 
  initialTotalCount, 
  initialFilterOptions 
}: { 
  initialCards: PokemonCardType[], 
  initialTotalCount: number, 
  initialFilterOptions: any 
}) {
  const [fetchedCards, setFetchedCards] = useState<PokemonCardType[]>(initialCards);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [hasMoreServer, setHasMoreServer] = useState(initialCards.length < initialTotalCount);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [filterOptions, setFilterOptions] = useState(initialFilterOptions);

  const [searchQuery, setSearchQuery] = useState("");
  const [expansionFilter, setExpansionFilter] = useState("Semua");
  const [cardTypeFilter, setCardTypeFilter] = useState("Semua");
  const [elementFilter, setElementFilter] = useState("Semua");
  const [stageFilter, setStageFilter] = useState("Semua");
  const [illustratorFilter, setIllustratorFilter] = useState("Semua");
  const [regulationFilter, setRegulationFilter] = useState("Semua");
  const [rarityFilter, setRarityFilter] = useState("Semua");
  const [visibleCount, setVisibleCount] = useState(30);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filterRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  
  const [isInitialized, setIsInitialized] = useState(false);
  const scrollYRef = useRef(0);
  const isRestoring = useRef(false);
  const isFirstRender = useRef(true);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    if (typeof window !== 'undefined') {
      if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

      const navEntries = performance.getEntriesByType("navigation");
      const isReload = navEntries.length > 0 && (navEntries[0] as PerformanceNavigationTiming).type === "reload";

      if (isReload) {
        scrollYRef.current = 0;
        sessionStorage.removeItem('libraryFilters');
        sessionStorage.removeItem('libraryScrollY');
      } else {
        const savedState = sessionStorage.getItem('libraryFilters');
        if (savedState) {
          try {
            const parsed = JSON.parse(savedState);
            setSearchQuery(parsed.searchQuery || "");
            setExpansionFilter(parsed.expansionFilter || "Semua");
            setCardTypeFilter(parsed.cardTypeFilter || "Semua");
            setElementFilter(parsed.elementFilter || "Semua");
            setStageFilter(parsed.stageFilter || "Semua");
            setIllustratorFilter(parsed.illustratorFilter || "Semua");
            setRegulationFilter(parsed.regulationFilter || "Semua");
            setRarityFilter(parsed.rarityFilter || "Semua");
            setVisibleCount(parsed.visibleCount || 30);
          } catch (e) {}
        }
        const savedScroll = sessionStorage.getItem('libraryScrollY');
        if (savedScroll) {
          scrollYRef.current = parseInt(savedScroll, 10) || 0;
          if (scrollYRef.current > 0) isRestoring.current = true;
        }
      }
      setIsInitialized(true);
    }
  }, []);

  useEffect(() => {
    if (!isInitialized) return; 

    const currentSession = {
      searchQuery, expansionFilter, cardTypeFilter, elementFilter, 
      stageFilter, illustratorFilter, regulationFilter, rarityFilter
    };
    
    sessionStorage.setItem('libraryFilters', JSON.stringify(currentSession));
  }, [searchQuery, expansionFilter, cardTypeFilter, elementFilter, stageFilter, illustratorFilter, regulationFilter, rarityFilter, isInitialized]);

  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  useEffect(() => {
    if (!isInitialized) return;
    
    let isMounted = true;
    const fetchFirstPage = async () => {
       setIsLoadingCards(true);
       const filters = { 
         searchQuery: debouncedQuery, 
         expansionFilter, 
         cardTypeFilter, 
         elementFilter, 
         stageFilter, 
         illustratorFilter, 
         regulationFilter, 
         rarityFilter 
       };
       const { cards, hasMore, totalCount } = await fetchCardsBasedOnFilters(filters, 0, 30);
       
       if (isMounted) {
         setFetchedCards(cards);
         setHasMoreServer(hasMore);
         setTotalCount(totalCount);
         setCurrentPage(0);
         setIsLoadingCards(false);
       }
    };
    fetchFirstPage();
    return () => { isMounted = false; };
  }, [debouncedQuery, expansionFilter, cardTypeFilter, elementFilter, stageFilter, illustratorFilter, regulationFilter, rarityFilter, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;
    let isMounted = true;
    const fetchOptions = async () => {
       const opts = await fetchFilterOptions(expansionFilter);
       if (isMounted) {
         setFilterOptions(opts);
         if (illustratorFilter !== "Semua" && !opts.illustrators.includes(illustratorFilter)) setIllustratorFilter("Semua");
         if (regulationFilter !== "Semua" && !opts.regulations.includes(regulationFilter)) setRegulationFilter("Semua");
         if (rarityFilter !== "Semua" && !opts.rarities.includes(rarityFilter)) setRarityFilter("Semua");
       }
    };
    fetchOptions();
    return () => { isMounted = false; };
  }, [expansionFilter, isInitialized]);

  useEffect(() => {
    if (!isInitialized) return;

    let timeoutId: NodeJS.Timeout;
    
    const handleScroll = () => {
      if (!isRestoring.current) {
        scrollYRef.current = window.scrollY;
        sessionStorage.setItem('libraryScrollY', window.scrollY.toString());
      }
      setShowScrollTop(window.scrollY > 400);
    };

    const throttledScroll = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(handleScroll, 100);
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    setShowScrollTop(window.scrollY > 400);

    return () => window.removeEventListener('scroll', throttledScroll);
  }, [isInitialized]);

  const expansions = filterOptions.expansions || ["Semua"];
  const cardTypes = ["Semua", "Pokémon", "Item", "Supporter", "Stadium", "Pokémon Tool", "Energy"];
  const elements = ["Semua", "Normal", "Api", "Air", "Listrik", "Rumput", "Petarung", "Psikis", "Naga", "Kegelapan", "Baja", "Peri"];
  const stages = ["Semua", "Basic", "Stage 1", "Stage 2", "EX", "GX", "V", "VMAX", "VSTAR"];
  
  const illustrators = filterOptions.illustrators || ["Semua"];
  const regulations = filterOptions.regulations || ["Semua"];
  const rarities = filterOptions.rarities || ["Semua"];

  const handleCardTypeChange = (val: string) => {
    setCardTypeFilter(val);
    if (val !== "Pokémon") {
      setElementFilter("Semua");
      setStageFilter("Semua");
    }
  };

  const displayedCards = fetchedCards;
  const hasMoreCards = hasMoreServer;

  const loadMoreCards = async () => {
    if (isLoadingCards || !hasMoreServer) return;
    setIsLoadingCards(true);
    const filters = { 
         searchQuery: debouncedQuery, 
         expansionFilter, 
         cardTypeFilter, 
         elementFilter, 
         stageFilter, 
         illustratorFilter, 
         regulationFilter, 
         rarityFilter 
    };
    const nextPage = currentPage + 1;
    const { cards, hasMore } = await fetchCardsBasedOnFilters(filters, nextPage, 30);
    setFetchedCards(prev => [...prev, ...cards]);
    setCurrentPage(nextPage);
    setHasMoreServer(hasMore);
    setIsLoadingCards(false);
  };

  useEffect(() => {
    const currentObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingCards && hasMoreServer) {
          loadMoreCards();
        }
      },
      { rootMargin: "300px" }
    );

    if (loaderRef.current) {
      currentObserver.observe(loaderRef.current);
    }
    
    return () => { 
      if (loaderRef.current) {
        currentObserver.unobserve(loaderRef.current); 
      }
    };
  }, [hasMoreServer, isLoadingCards, currentPage]);

  useEffect(() => {
    if (isInitialized && isRestoring.current && scrollYRef.current > 0) {
      let attempts = 0;
      const targetY = scrollYRef.current;
      const restoreInterval = setInterval(() => {
        attempts++;
        if (document.documentElement.scrollHeight >= targetY + window.innerHeight / 2) {
            window.scrollTo({ top: targetY, behavior: 'auto' });
        } else {
            window.scrollTo({ top: document.documentElement.scrollHeight, behavior: 'auto' });
        }
        
        if (Math.abs(window.scrollY - targetY) < 5 || attempts >= 20) {
          clearInterval(restoreInterval);
          setTimeout(() => { isRestoring.current = false; }, 100);
        }
      }, 100);
      return () => clearInterval(restoreInterval);
    } else if (isInitialized) {
      isRestoring.current = false;
    }
  }, [displayedCards, isInitialized]);

  const scrollToFilters = () => {
    if (filterRef.current) {
      const y = filterRef.current.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col gap-8 pb-10 pt-6 relative w-full">
      {toastMessage && (
        <div className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] sm:w-fit max-w-[360px] sm:max-w-none bg-foreground text-background px-4 sm:px-6 py-3 sm:py-3.5 rounded-2xl sm:rounded-full shadow-2xl  text-[13px] sm:text-sm flex items-center justify-center sm:justify-start gap-3 transition-all animate-in fade-in slide-in-from-top-4 text-center sm:text-left leading-relaxed sm:whitespace-nowrap">
          <Info size={18} className="text-background shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
      <header className="flex flex-col gap-1">
        <h1 className="text-3xl  tracking-tight">Koleksi Kartu</h1>
        <p className="text-foreground/50 text-sm ">Jelajahi dan saring database kartu Pokémon Indonesia.</p>
      </header>
      <div ref={filterRef} className="relative z-40 flex flex-col gap-5 p-5 md:p-6 bg-muted/30 border border-border/50 rounded-[20px]">
        <div className="flex flex-col lg:flex-row gap-4 w-full items-end">
          <div className="relative w-full lg:flex-[2] flex flex-col gap-1.5">
            <span className="text-[10px]  uppercase tracking-widest text-foreground/50 ml-1">Pencarian</span>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
              <input 
                type="text" 
                placeholder="Cari nama kartu Pokémon..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 h-[40px] bg-background border border-border/50 rounded-xl focus:outline-none focus:border-foreground/30 focus:ring-1 focus:ring-foreground/30 text-sm  transition-all shadow-sm"
              />
            </div>
          </div>
          <div className="w-full lg:flex-[1] min-w-[250px]">
            <CustomDropdown label="Ekspansi" options={expansions} value={expansionFilter} onChange={setExpansionFilter} />
          </div>
        </div>
        <div className="flex flex-wrap gap-3 lg:gap-4">
          <div className="flex-1 min-w-[130px] md:min-w-[160px]">
            <CustomDropdown label="Jenis Kartu" options={cardTypes} value={cardTypeFilter} onChange={handleCardTypeChange} />
          </div>
          <div className="flex-1 min-w-[130px] md:min-w-[160px] relative">
            <CustomDropdown 
              label="Elemen (Pokémon)" 
              options={elements} 
              value={cardTypeFilter !== "Pokémon" ? "Semua" : elementFilter} 
              onChange={setElementFilter} 
              disabled={cardTypeFilter !== "Pokémon"} 
              disabledText="Semua" 
            />
            {cardTypeFilter !== "Pokémon" && (
              <div 
                className="absolute inset-0 z-10 cursor-pointer" 
                onClick={() => showToast("Pilih Jenis Kartu \"Pokémon\" terlebih dahulu.")}
              />
            )}
          </div>
          <div className="flex-1 min-w-[130px] md:min-w-[160px] relative">
            <CustomDropdown 
              label="Stage (Pokémon)" 
              options={stages} 
              value={cardTypeFilter !== "Pokémon" ? "Semua" : stageFilter} 
              onChange={setStageFilter} 
              disabled={cardTypeFilter !== "Pokémon"} 
              disabledText="Semua" 
            />
            {cardTypeFilter !== "Pokémon" && (
              <div 
                className="absolute inset-0 z-10 cursor-pointer" 
                onClick={() => showToast("Pilih Jenis Kartu \"Pokémon\" terlebih dahulu.")}
              />
            )}
          </div>
          <div className="flex-1 min-w-[130px] md:min-w-[160px]">
            <CustomDropdown label="Ilustrator" options={illustrators} value={illustratorFilter} onChange={setIllustratorFilter} />
          </div>
          <div className="flex-1 min-w-[130px] md:min-w-[160px]">
            <CustomDropdown label="Regulasi" options={regulations} value={regulationFilter} onChange={setRegulationFilter} />
          </div>
          <div className="flex-1 min-w-[130px] md:min-w-[160px]">
            <CustomDropdown label="Rarity" options={rarities} value={rarityFilter} onChange={setRarityFilter} />
          </div>
        </div>
      </div>
      <div className="flex items-center justify-between text-[11px]  text-foreground/40 tracking-widest uppercase border-b border-border/40 pb-2">
        <span>Menampilkan {totalCount} Kartu</span>
      </div>
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
        {displayedCards.map((card) => (
          <PokemonCard key={card.id} card={card} source="library" />
        ))}
        {displayedCards.length === 0 && !isLoadingCards && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-3">
            <span className="text-4xl grayscale opacity-50">🔍</span>
            <p className="text-foreground/50 text-sm  uppercase tracking-widest">Tidak ada kartu yang cocok</p>
          </div>
        )}
      </div>
      {isLoadingCards && (
        <div ref={loaderRef} className="w-full py-10 flex justify-center items-center">
          <Loader2 className="animate-spin text-foreground/30" size={36} />
        </div>
      )}
      {!isLoadingCards && hasMoreCards && (
        <div ref={loaderRef} className="w-full py-2"></div>
      )}
      {showScrollTop && (
        <button
          onClick={scrollToFilters}
          className="fixed bottom-6 right-6 p-3.5 bg-foreground text-background rounded-full shadow-2xl hover:scale-110 transition-transform z-50 flex items-center justify-center border border-border/20"
        >
          <ArrowUp size={22} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
