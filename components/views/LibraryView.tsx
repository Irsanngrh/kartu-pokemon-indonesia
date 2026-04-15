"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import PokemonCard from "@/components/ui/PokemonCard";
import CustomDropdown from "@/components/ui/CustomDropdown";
import { Search, ArrowUp, Loader2, Info, RotateCcw, BookOpen, Layers } from "lucide-react";
import { PokemonCard as PokemonCardType } from "@/types";
import { fetchCardsBasedOnFilters, fetchFilterOptions } from "@/app/actions/cards.fetch";



// Reads saved filters from sessionStorage — returns null on server.
function getSavedFilters(): Record<string, string> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem('libraryFilters');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function getSavedScrollY(): number {
  if (typeof window === 'undefined') return 0;
  try {
    return parseInt(sessionStorage.getItem('libraryScrollY') || '0', 10);
  } catch { return 0; }
}

export default function LibraryView({
  initialCards,
  initialTotalCount,
  initialFilterOptions,
  initialExpansionFilter
}: {
  initialCards: PokemonCardType[],
  initialTotalCount: number,
  initialFilterOptions: any,
  initialExpansionFilter?: string
}) {
  // Strict SSR Initialization to prevent Hydration Errors
  const [fetchedCards, setFetchedCards] = useState<PokemonCardType[]>(initialCards);
  const [totalCount, setTotalCount] = useState(initialTotalCount);
  const [hasMoreServer, setHasMoreServer] = useState(initialCards.length < initialTotalCount);
  const [currentPage, setCurrentPage] = useState(0);
  const [isLoadingCards, setIsLoadingCards] = useState(false);
  const [filterOptions, setFilterOptions] = useState(initialFilterOptions);

  // Filters initialized conservatively — hydrated from sessionStorage in useEffect.
  const [searchQuery, setSearchQuery] = useState("");
  const [expansionFilter, setExpansionFilter] = useState(initialExpansionFilter || "Semua");
  const [cardTypeFilter, setCardTypeFilter] = useState("Semua");
  const [elementFilter, setElementFilter] = useState("Semua");
  const [stageFilter, setStageFilter] = useState("Semua");
  const [illustratorFilter, setIllustratorFilter] = useState("Semua");
  const [regulationFilter, setRegulationFilter] = useState("Semua");
  const [rarityFilter, setRarityFilter] = useState("Semua");
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const filterRef = useRef<HTMLDivElement>(null);
  const loaderRef = useRef<HTMLDivElement>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const [isInitialized, setIsInitialized] = useState(false);
  const scrollYRef = useRef(0);
  const isRestoring = useRef(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedFilters = getSavedFilters();
      const savedScroll = getSavedScrollY();

      if (initialExpansionFilter && initialExpansionFilter !== "Semua") {
        setSearchQuery("");
        setExpansionFilter(initialExpansionFilter);
        setCardTypeFilter("Semua");
        setElementFilter("Semua");
        setStageFilter("Semua");
        setIllustratorFilter("Semua");
        setRegulationFilter("Semua");
        setRarityFilter("Semua");

        sessionStorage.setItem('libraryFilters', JSON.stringify({
          searchQuery: "",
          expansionFilter: initialExpansionFilter,
          cardTypeFilter: "Semua",
          elementFilter: "Semua",
          stageFilter: "Semua",
          illustratorFilter: "Semua",
          regulationFilter: "Semua",
          rarityFilter: "Semua"
        }));
      } else if (savedFilters) {
        setSearchQuery(savedFilters.searchQuery || "");
        setExpansionFilter(savedFilters.expansionFilter || "Semua");
        setCardTypeFilter(savedFilters.cardTypeFilter || "Semua");
        setElementFilter(savedFilters.elementFilter || "Semua");
        setStageFilter(savedFilters.stageFilter || "Semua");
        setIllustratorFilter(savedFilters.illustratorFilter || "Semua");
        setRegulationFilter(savedFilters.regulationFilter || "Semua");
        setRarityFilter(savedFilters.rarityFilter || "Semua");

        // Clear displayed cards to show loading state for new filter set.
        setFetchedCards([]);
        setIsLoadingCards(true);
      }

      if (savedScroll > 0) {
        scrollYRef.current = savedScroll;
        isRestoring.current = true;
      }
    }

    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    setIsInitialized(true);
  }, []);

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const isAnyFilterActive = searchQuery !== '' || expansionFilter !== 'Semua' || cardTypeFilter !== 'Semua' ||
    elementFilter !== 'Semua' || stageFilter !== 'Semua' || illustratorFilter !== 'Semua' ||
    regulationFilter !== 'Semua' || rarityFilter !== 'Semua';

  const handleResetFilters = () => {
    setSearchQuery('');
    setExpansionFilter('Semua');
    setCardTypeFilter('Semua');
    setElementFilter('Semua');
    setStageFilter('Semua');
    setIllustratorFilter('Semua');
    setRegulationFilter('Semua');
    setRarityFilter('Semua');
  };

  // Persist current filters to sessionStorage for back-navigation restoration.
  useEffect(() => {
    if (!isInitialized || isRestoring.current) return;
    sessionStorage.setItem('libraryFilters', JSON.stringify({
      searchQuery, expansionFilter, cardTypeFilter, elementFilter,
      stageFilter, illustratorFilter, regulationFilter, rarityFilter
    }));
  }, [searchQuery, expansionFilter, cardTypeFilter, elementFilter, stageFilter, illustratorFilter, regulationFilter, rarityFilter, isInitialized]);

  // Persist visible card count so scroll restoration can fetch enough cards.
  useEffect(() => {
    if (!isInitialized || isRestoring.current || fetchedCards.length === 0) return;
    sessionStorage.setItem('libraryLimit', fetchedCards.length.toString());
  }, [fetchedCards.length, isInitialized]);

  const [debouncedQuery, setDebouncedQuery] = useState(searchQuery);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(searchQuery), 300);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Fetch cards when filters change
  useEffect(() => {
    if (!isInitialized) return;
    let isMounted = true;
    const fetchFirstPage = async () => {
      setIsLoadingCards(true);
      const filters = {
        searchQuery: debouncedQuery, expansionFilter, cardTypeFilter,
        elementFilter, stageFilter, illustratorFilter, regulationFilter, rarityFilter
      };

      // On restore, fetch enough cards to cover the previous scroll position.
      const limitStr = isRestoring.current ? sessionStorage.getItem('libraryLimit') : null;
      const limit = limitStr ? Math.max(parseInt(limitStr, 10) || 30, 30) : 30;

      const { cards, hasMore, totalCount } = await fetchCardsBasedOnFilters(filters, 0, limit, true);
      if (isMounted) {
        setFetchedCards(cards);
        setHasMoreServer(hasMore);
        setTotalCount(totalCount);
        setCurrentPage(Math.max(0, Math.ceil(limit / 30) - 1));
        setIsLoadingCards(false);
      }
    };
    fetchFirstPage();
    return () => { isMounted = false; };
  }, [debouncedQuery, expansionFilter, cardTypeFilter, elementFilter, stageFilter, illustratorFilter, regulationFilter, rarityFilter, isInitialized]);

  // Derive dynamic filter option lists from current result set.
  useEffect(() => {
    if (!isInitialized) return;
    let isMounted = true;
    const fetchOptions = async () => {
      const opts = await fetchFilterOptions({
        searchQuery: debouncedQuery,
        expansionFilter, cardTypeFilter, elementFilter,
        stageFilter, illustratorFilter, regulationFilter, rarityFilter,
      });
      if (isMounted) {
        setFilterOptions(opts);
        if (elementFilter !== 'Semua' && opts.elements && !opts.elements.includes(elementFilter)) setElementFilter('Semua');
        if (stageFilter !== 'Semua' && opts.stages && !opts.stages.includes(stageFilter)) setStageFilter('Semua');
        if (illustratorFilter !== 'Semua' && !opts.illustrators.includes(illustratorFilter)) setIllustratorFilter('Semua');
        if (regulationFilter !== 'Semua' && !opts.regulations.includes(regulationFilter)) setRegulationFilter('Semua');
        if (rarityFilter !== 'Semua' && !opts.rarities.includes(rarityFilter)) setRarityFilter('Semua');
      }
    };
    fetchOptions();
    return () => { isMounted = false; };
  }, [debouncedQuery, expansionFilter, cardTypeFilter, elementFilter, stageFilter, illustratorFilter, regulationFilter, rarityFilter, isInitialized]);

  // Track scroll position — skip saving 0 since Next.js resets scrollY during route transitions.
  useEffect(() => {
    if (!isInitialized) return;
    const handleScroll = () => {
      const scrollY = Math.round(window.scrollY);
      if (!isRestoring.current && scrollY > 0) {
        sessionStorage.setItem('libraryScrollY', scrollY.toString());
      }
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    setShowScrollTop(window.scrollY > 400);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [isInitialized]);

  // Scroll restoration via rAF — polls until position is reached or timeout exceeded.
  useEffect(() => {
    if (!isInitialized || !isRestoring.current || isLoadingCards || fetchedCards.length === 0) return;

    const targetY = scrollYRef.current;
    if (targetY <= 0) {
      isRestoring.current = false;
      return;
    }

    const startTime = Date.now();
    let rafId: number;

    const forceScroll = () => {
      const elapsed = Date.now() - startTime;
      // Read before write to avoid layout thrashing.
      const currentY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight;
      const reached = elapsed > 300 && Math.abs(currentY - targetY) < 5;

      if (reached || elapsed > 1500) {
        isRestoring.current = false;
        return;
      }

      const scrollTarget = docHeight > targetY ? targetY : docHeight;
      window.scrollTo(0, scrollTarget);
      rafId = requestAnimationFrame(forceScroll);
    };

    rafId = requestAnimationFrame(forceScroll);
    return () => cancelAnimationFrame(rafId);
  }, [isInitialized, isLoadingCards, fetchedCards]);

  const expansions = filterOptions.expansions || ['Semua'];
  const cardTypes = ['Semua', 'Pokémon', 'Item', 'Supporter', 'Stadium', 'Pokémon Tool', 'Energi'];
  const elements = filterOptions.elements || ['Semua', 'Normal', 'Api', 'Air', 'Listrik', 'Rumput', 'Petarung', 'Psikis', 'Naga', 'Kegelapan', 'Baja'];
  const stages = filterOptions.stages || ['Semua', 'Basic', 'Stage 1', 'Stage 2', 'EX', 'GX', 'V', 'V-UNION', 'VMAX', 'VSTAR'];
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


  const loadMoreCards = async () => {
    if (isLoadingCards || !hasMoreServer) return;
    setIsLoadingCards(true);
    const filters = {
      searchQuery: debouncedQuery, expansionFilter, cardTypeFilter,
      elementFilter, stageFilter, illustratorFilter, regulationFilter, rarityFilter
    };
    const nextPage = currentPage + 1;
    const { cards, hasMore } = await fetchCardsBasedOnFilters(filters, nextPage, 30, true);
    setFetchedCards(prev => [...prev, ...cards]);
    setCurrentPage(nextPage);
    setHasMoreServer(hasMore);
    setIsLoadingCards(false);
  };

  // Infinite scroll observer.
  useEffect(() => {
    const currentObserver = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingCards && hasMoreServer) {
          loadMoreCards();
        }
      },
      { rootMargin: "300px" }
    );
    if (loaderRef.current) currentObserver.observe(loaderRef.current);
    return () => { if (loaderRef.current) currentObserver.unobserve(loaderRef.current); };
  }, [hasMoreServer, isLoadingCards, currentPage]);


  const scrollToFilters = () => {
    if (filterRef.current) {
      const y = filterRef.current.getBoundingClientRect().top + window.scrollY - 80;
      window.scrollTo({ top: y, behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col py-8 relative w-full">
      {toastMessage && (
        <div className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] sm:w-fit max-w-[360px] sm:max-w-none bg-background dark:bg-muted/30 border border-border/50 text-foreground px-4 sm:px-6 py-3 sm:py-3.5 rounded-2xl sm:rounded-full shadow-2xl text-[13px] sm:text-sm flex items-center justify-center sm:justify-start gap-3 transition-all animate-in fade-in slide-in-from-top-4 text-center sm:text-left leading-relaxed sm:whitespace-nowrap">
          <Info size={18} className="text-foreground shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-semibold mb-1 flex items-center gap-2.5">
            <BookOpen size={26} />
            Koleksi Kartu
          </h1>
          <p className="text-foreground/50 text-sm">Jelajahi database kartu Pokémon Indonesia.</p>
        </div>
      </header>
      <div ref={filterRef} className="relative z-40 flex flex-col gap-5 p-5 md:p-6 bg-muted/30 border border-border/50 rounded-[20px]">
        <div className="flex flex-col lg:flex-row gap-4 w-full items-end">
          <div className="relative w-full lg:w-[55%] xl:w-[60%] flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 ml-1">Pencarian</span>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
              <input
                type="text"
                placeholder="Cari nama kartu Pokémon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 h-[42px] bg-background border border-border/50 rounded-xl focus:outline-none focus:border-foreground/30 focus:ring-1 focus:ring-foreground/30 text-sm transition-all shadow-sm hover:border-foreground/40"
              />
            </div>
          </div>
          <div className="w-full lg:w-[45%] xl:w-[40%] flex flex-col sm:flex-row items-stretch sm:items-end gap-2">
            <div className="flex-1">
              <CustomDropdown label="Ekspansi" options={expansions} value={expansionFilter} onChange={setExpansionFilter} />
            </div>
            <Link 
              href="/sets" 
              className="h-[42px] px-4 flex items-center justify-center gap-2 bg-background border border-border/50 text-foreground/80 rounded-xl text-sm whitespace-nowrap hover:bg-muted/30 hover:text-foreground transition-all shadow-sm"
            >
              <BookOpen size={16} />
              Lihat Semua Ekspansi
            </Link>
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
        {isAnyFilterActive && (
          <button
            onClick={handleResetFilters}
            className="self-end flex items-center gap-2 text-xs text-foreground/50 hover:text-foreground transition-colors cursor-pointer"
          >
            <RotateCcw size={13} />
            Reset Semua Filter
          </button>
        )}
      </div>
      <div className="flex items-center justify-between text-[11px] text-foreground/40 tracking-widest uppercase py-4 mt-2">
        <span>Menampilkan {totalCount} Kartu</span>
      </div>
      <div className="relative z-10 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
        {fetchedCards.map((card, index) => (
          <PokemonCard key={card.id} card={card} source="library" priority={index < 6} />
        ))}
        {fetchedCards.length === 0 && !isLoadingCards && (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-3">
            <span className="text-4xl grayscale opacity-50">🔍</span>
            <p className="text-foreground/50 text-sm uppercase tracking-widest">Kartu tidak ditemukan</p>
          </div>
        )}
      </div>
      {isLoadingCards && (
        <div ref={loaderRef} className="w-full py-10 flex justify-center items-center">
          <Loader2 className="animate-spin text-foreground/30" size={36} />
        </div>
      )}
      {!isLoadingCards && hasMoreServer && (
        <div ref={loaderRef} className="w-full py-2"></div>
      )}
      {showScrollTop && (
        <button
          onClick={scrollToFilters}
          className="fixed bottom-6 right-6 p-3.5 bg-background dark:bg-muted/50 text-foreground border border-border/50 rounded-full shadow-2xl hover:scale-110 hover:bg-muted/50 transition-all z-50 flex items-center justify-center"
        >
          <ArrowUp size={22} strokeWidth={2.5} />
        </button>
      )}
    </div>
  );
}
