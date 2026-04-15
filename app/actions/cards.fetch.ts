'use server';

import { createClient } from '@/utils/supabase/server';
import { PokemonCard } from '@/types';
import { Redis } from '@upstash/redis';
import { getCardType, getElements, getStageInfo } from '@/lib/card-helpers';
import {
  CACHE_TTL_MS,
  CACHE_KEY_ALL_CARDS,
  PAGINATION_DEFAULT_LIMIT,
} from '@/lib/constants';

export interface FilterParams {
  searchQuery?: string;
  expansionFilter?: string;
  cardTypeFilter?: string;
  elementFilter?: string;
  stageFilter?: string;
  illustratorFilter?: string;
  regulationFilter?: string;
  rarityFilter?: string;
}

const isRedisConfigured =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = isRedisConfigured ? Redis.fromEnv() : null;

let inMemoryCache: PokemonCard[] | null = null;
let inMemoryCacheTime = 0;

async function getAllCardsForFiltering(): Promise<PokemonCard[]> {
  if (redis) {
    try {
      const cached = await redis.get<PokemonCard[]>(CACHE_KEY_ALL_CARDS);
      if (cached) return cached;
    } catch {
      // Redis error — fall through to DB fetch
    }
  }

  const now = Date.now();
  if (inMemoryCache && now - inMemoryCacheTime < CACHE_TTL_MS) {
    return inMemoryCache;
  }

  const supabase = createClient();
  const { data, error } = await supabase
    .from('cards')
    .select(
      'id, name, card_number, image_url, rarity, variant_name, variant_order, stage, hp, types, illustrator, regulation_mark, set_id, sets(name, code, set_order)'
    )
    .order('id');

  if (error) return [];

  const cards = (data as unknown as PokemonCard[]) ?? [];

  if (redis && cards.length > 0) {
    try {
      await redis.set(CACHE_KEY_ALL_CARDS, cards, { ex: 3600 });
    } catch {
      // Redis write failure — non-critical
    }
  }

  inMemoryCache = cards;
  inMemoryCacheTime = now;
  return cards;
}

export async function fetchCardsBasedOnFilters(
  filters: FilterParams,
  page: number = 0,
  limit: number = PAGINATION_DEFAULT_LIMIT,
  deduplicateVariants: boolean = false
): Promise<{
  cards: PokemonCard[];
  hasMore: boolean;
  totalCount: number;
  error?: string;
}> {
  try {
    const allCards = await getAllCardsForFiltering();

    const filtered = allCards.filter((card) => {
      if (
        filters.searchQuery &&
        !card.name?.toLowerCase().includes(filters.searchQuery.toLowerCase())
      )
        return false;

      if (filters.expansionFilter && filters.expansionFilter !== 'Semua') {
        const cardExp = card.sets 
          ? (card.sets.name.includes(`(${card.sets.code})`) ? card.sets.name : `${card.sets.name} (${card.sets.code})`)
          : '';
        if (cardExp !== filters.expansionFilter) return false;
      }

      const cType = getCardType(card);
      if (
        filters.cardTypeFilter &&
        filters.cardTypeFilter !== 'Semua' &&
        cType !== filters.cardTypeFilter
      )
        return false;

      if (cType === 'Pokémon') {
        if (
          filters.elementFilter &&
          filters.elementFilter !== 'Semua' &&
          !getElements(card).includes(filters.elementFilter)
        )
          return false;
        if (
          filters.stageFilter &&
          filters.stageFilter !== 'Semua' &&
          !getStageInfo(card).includes(filters.stageFilter)
        )
          return false;
      }

      if (
        filters.illustratorFilter &&
        filters.illustratorFilter !== 'Semua' &&
        card.illustrator !== filters.illustratorFilter
      )
        return false;
      if (
        filters.regulationFilter &&
        filters.regulationFilter !== 'Semua' &&
        card.regulation_mark !== filters.regulationFilter
      )
        return false;
      if (
        filters.rarityFilter &&
        filters.rarityFilter !== 'Semua' &&
        card.rarity !== filters.rarityFilter
      )
        return false;

      return true;
    });

    filtered.sort((a, b) => {
      const orderSetA = a.sets?.set_order ?? 99;
      const orderSetB = b.sets?.set_order ?? 99;
      if (orderSetA !== orderSetB) return orderSetA - orderSetB;

      const numA =
        parseInt((a.card_number ?? '0').replace(/\D/g, ''), 10) || 0;
      const numB =
        parseInt((b.card_number ?? '0').replace(/\D/g, ''), 10) || 0;
      if (numA !== numB) return numA - numB;

      return (a.variant_order ?? 1) - (b.variant_order ?? 1);
    });

    // After sorting by variant_order asc, the first occurrence of each
    // (set_id, card_number) pair is always the normal/base variant.
    const displayList = deduplicateVariants
      ? Array.from(
          filtered
            .reduce((map, card) => {
              const key = `${card.set_id ?? ''}-${card.card_number ?? ''}`;
              if (!map.has(key)) map.set(key, card);
              return map;
            }, new Map<string, PokemonCard>())
            .values()
        )
      : filtered;

    const totalCount = displayList.length;
    const from = page * limit;
    const paginated = displayList.slice(from, from + limit);

    return { cards: paginated, hasMore: from + limit < totalCount, totalCount };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { cards: [], hasMore: false, totalCount: 0, error: message };
  }
}

/** Fetch specific cards by their IDs — used for deck hydration on load */
export async function getCardsByIds(
  ids: number[]
): Promise<Record<number, PokemonCard>> {
  if (!ids.length) return {};

  const allCards = await getAllCardsForFiltering();
  const idSet = new Set(ids);
  const result: Record<number, PokemonCard> = {};

  for (const card of allCards) {
    if (idSet.has(card.id)) {
      result[card.id] = card;
    }
  }

  return result;
}

export async function fetchFilterOptions(filters: FilterParams) {
  const allCards = await getAllCardsForFiltering();
  const { expansionFilter = 'Semua', cardTypeFilter = 'Semua', elementFilter = 'Semua', stageFilter = 'Semua', illustratorFilter = 'Semua', regulationFilter = 'Semua', rarityFilter = 'Semua' } = filters;

  // Expansions always show all sets
  const setMap = new Map<string, number>();
  for (const c of allCards) {
    if (c.sets) {
      const key = c.sets.name.includes(`(${c.sets.code})`) ? c.sets.name : `${c.sets.name} (${c.sets.code})`;
      if (!setMap.has(key)) setMap.set(key, c.sets.set_order ?? 99);
    }
  }
  const sortedSets = Array.from(setMap.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([name]) => name);
  const expansions = ['Semua', ...sortedSets];

  // Base subset: filter by search string + expansion + cardType
  let base = allCards;
  if (filters.searchQuery) {
    base = base.filter((c) => c.name?.toLowerCase().includes(filters.searchQuery!.toLowerCase()));
  }
  if (expansionFilter !== 'Semua') {
    base = base.filter((c) => {
      const exp = c.sets ? (c.sets.name.includes(`(${c.sets.code})`) ? c.sets.name : `${c.sets.name} (${c.sets.code})`) : '';
      return exp === expansionFilter;
    });
  }
  if (cardTypeFilter !== 'Semua') {
    base = base.filter((c) => getCardType(c) === cardTypeFilter);
  }

  // For each secondary filter list, compute options from cards matching ALL OTHER active filters
  const matchFor = (excludeKey: keyof FilterParams): PokemonCard[] => {
    return base.filter((c) => {
      if (excludeKey !== 'elementFilter' && elementFilter !== 'Semua' && c.hp) {
        if (!getElements(c).includes(elementFilter)) return false;
      }
      if (excludeKey !== 'stageFilter' && stageFilter !== 'Semua' && c.hp) {
        if (!getStageInfo(c).includes(stageFilter)) return false;
      }
      if (excludeKey !== 'illustratorFilter' && illustratorFilter !== 'Semua') {
        if (c.illustrator !== illustratorFilter) return false;
      }
      if (excludeKey !== 'regulationFilter' && regulationFilter !== 'Semua') {
        if (c.regulation_mark !== regulationFilter) return false;
      }
      if (excludeKey !== 'rarityFilter' && rarityFilter !== 'Semua') {
        if (c.rarity !== rarityFilter) return false;
      }
      return true;
    });
  };

  const illustratorCards = matchFor('illustratorFilter');
  const illustrators = [
    'Semua',
    ...Array.from(new Set(illustratorCards.map((c) => c.illustrator).filter(Boolean))).sort().map(String),
  ];

  const regulationCards = matchFor('regulationFilter');
  const regulations = [
    'Semua',
    ...Array.from(new Set(regulationCards.map((c) => c.regulation_mark).filter(Boolean))).sort().map(String),
  ];

  const rarityCards = matchFor('rarityFilter');
  const rarityOrder = ['Tanpa Tanda', 'C', 'U', 'R', 'RR', 'ACE', 'RRR', 'AR', 'PR', 'TR', 'SR', 'MA', 'HR', 'UR', 'K', 'A', 'SAR', 'S', 'SSR', 'BWR', 'MUR'];
  const existingRarities = new Set(rarityCards.map((c) => c.rarity).filter(Boolean));
  const sortedRarities = rarityOrder.filter((r) => existingRarities.has(r));
  const unknownRarities = Array.from(existingRarities).filter((r) => !rarityOrder.includes(r as string)).sort().map(String);
  const rarities = ['Semua', ...sortedRarities, ...unknownRarities];

  const elementCards = matchFor('elementFilter');
  const elementsSet = new Set<string>();
  elementCards.forEach(c => {
    if (c.hp) getElements(c).forEach(e => elementsSet.add(e));
  });
  const elementOrder = ['Normal', 'Api', 'Air', 'Listrik', 'Rumput', 'Petarung', 'Psikis', 'Naga', 'Kegelapan', 'Baja'];
  const elements = ['Semua', ...elementOrder.filter(e => elementsSet.has(e)), ...Array.from(elementsSet).filter(e => !elementOrder.includes(e)).sort()];

  const stageCards = matchFor('stageFilter');
  const stagesSet = new Set<string>();
  stageCards.forEach(c => {
    if (c.hp) getStageInfo(c).forEach(s => stagesSet.add(s));
  });
  const stageOrder = ['Basic', 'Stage 1', 'Stage 2', 'EX', 'GX', 'V', 'V-UNION', 'VMAX', 'VSTAR'];
  const stages = ['Semua', ...stageOrder.filter(s => stagesSet.has(s)), ...Array.from(stagesSet).filter(s => !stageOrder.includes(s)).sort()];

  return { expansions, elements, stages, illustrators, regulations, rarities };
}
