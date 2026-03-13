'use server';

import { createClient } from '@/utils/supabase/server';
import { PokemonCard } from '@/types';
import { Redis } from '@upstash/redis';
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

// Upstash Redis persistent cache (shared across serverless invocations)
const isRedisConfigured =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN;
const redis = isRedisConfigured ? Redis.fromEnv() : null;

// Module-level fallback cache for environments without Redis
let inMemoryCache: PokemonCard[] | null = null;
let inMemoryCacheTime = 0;

async function getAllCardsForFiltering(): Promise<PokemonCard[]> {
  // 1. Try Redis cache
  if (redis) {
    try {
      const cached = await redis.get<PokemonCard[]>(CACHE_KEY_ALL_CARDS);
      if (cached) return cached;
    } catch {
      // Redis error — fall through to DB fetch
    }
  }

  // 2. Try in-memory cache (cold start within same invocation)
  const now = Date.now();
  if (inMemoryCache && now - inMemoryCacheTime < CACHE_TTL_MS) {
    return inMemoryCache;
  }

  // 3. Fetch from Supabase
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('cards')
    .select(
      'id, name, card_number, image_url, rarity, variant_name, variant_order, stage, hp, types, illustrator, regulation_mark, set_id, sets(name, code, set_order)'
    )
    .order('id');

  if (error) {
    console.error('[cards.fetch] getAllCardsForFiltering error:', error.message);
    return [];
  }

  const cards = (data as unknown as PokemonCard[]) ?? [];

  // Store in Redis with 1-hour TTL
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
  limit: number = PAGINATION_DEFAULT_LIMIT
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
          ? `${card.sets.name} (${card.sets.code})`
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

    const totalCount = filtered.length;
    const from = page * limit;
    const paginated = filtered.slice(from, from + limit);

    return { cards: paginated, hasMore: from + limit < totalCount, totalCount };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    console.error('[cards.fetch] fetchCardsBasedOnFilters error:', message);
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

export async function fetchFilterOptions(expansionFilter: string) {
  const allCards = await getAllCardsForFiltering();

  const setMap = new Map<string, number>();
  for (const c of allCards) {
    if (c.sets) {
      const key = `${c.sets.name} (${c.sets.code})`;
      if (!setMap.has(key)) setMap.set(key, c.sets.set_order ?? 99);
    }
  }
  const sortedSets = Array.from(setMap.entries())
    .sort((a, b) => a[1] - b[1])
    .map(([name]) => name);
  const expansions = ['Semua', ...sortedSets];

  let filtered = allCards;
  if (expansionFilter !== 'Semua') {
    filtered = allCards.filter((card) => {
      const exp = card.sets ? `${card.sets.name} (${card.sets.code})` : '';
      return exp === expansionFilter;
    });
  }

  const illustrators = [
    'Semua',
    ...Array.from(new Set(filtered.map((c) => c.illustrator).filter(Boolean)))
      .sort()
      .map(String),
  ];
  const regulations = [
    'Semua',
    ...Array.from(
      new Set(filtered.map((c) => c.regulation_mark).filter(Boolean))
    )
      .sort()
      .map(String),
  ];

  const rarityOrder = [
    'Tanpa Tanda',
    'C',
    'U',
    'R',
    'RR',
    'ACE',
    'RRR',
    'AR',
    'PR',
    'TR',
    'SR',
    'MA',
    'HR',
    'UR',
    'K',
    'A',
    'SAR',
    'S',
    'SSR',
    'BWR',
    'MUR',
  ];
  const existingRarities = new Set(
    filtered.map((c) => c.rarity).filter(Boolean)
  );
  const sortedRarities = rarityOrder.filter((r) => existingRarities.has(r));
  const unknownRarities = Array.from(existingRarities)
    .filter((r) => !rarityOrder.includes(r as string))
    .sort()
    .map(String);
  const rarities = ['Semua', ...sortedRarities, ...unknownRarities];

  return { expansions, illustrators, regulations, rarities };
}

// --- Internal helpers ---

function getCardType(card: PokemonCard): string {
  if (card.hp) return 'Pokémon';
  const stage = (card.stage ?? '').toLowerCase();
  if (stage.includes('supporter')) return 'Supporter';
  if (stage.includes('stadium')) return 'Stadium';
  if (stage.includes('tool')) return 'Pokémon Tool';
  if (stage.includes('item')) return 'Item';
  if (stage.includes('energy') || stage.includes('energi')) return 'Energy';
  return 'Lainnya';
}

function getElements(card: PokemonCard): string[] {
  if (!card.types) return [];
  return card.types.map((url: string) => {
    const u = url.toLowerCase();
    if (u.includes('grass')) return 'Rumput';
    if (u.includes('fire')) return 'Api';
    if (u.includes('water')) return 'Air';
    if (u.includes('lightning')) return 'Listrik';
    if (u.includes('psychic')) return 'Psikis';
    if (u.includes('fighting')) return 'Petarung';
    if (u.includes('darkness') || u.includes('dark')) return 'Kegelapan';
    if (u.includes('metal')) return 'Baja';
    if (u.includes('fairy')) return 'Peri';
    if (u.includes('dragon')) return 'Naga';
    if (u.includes('colorless')) return 'Normal';
    return 'Lainnya';
  });
}

function getStageInfo(card: PokemonCard): string[] {
  const nameUpper = (card.name ?? '').toUpperCase();
  const stageRaw = (card.stage ?? '').trim();
  const stageLower = stageRaw.toLowerCase();

  let base = 'Lainnya';
  if (stageLower.includes('basic') || stageLower === 'basic') base = 'Basic';
  else if (stageLower.includes('stage 1')) base = 'Stage 1';
  else if (stageLower.includes('stage 2')) base = 'Stage 2';
  else if (stageRaw) base = stageRaw;

  if (nameUpper.includes('VMAX')) return ['VMAX'];
  if (nameUpper.includes('VSTAR')) return ['VSTAR'];

  let suffix = '';
  if (nameUpper.endsWith(' EX') || nameUpper.includes(' EX ')) suffix = 'EX';
  else if (nameUpper.includes('GX')) suffix = 'GX';
  else if (nameUpper.endsWith(' V') || nameUpper.includes(' V ')) suffix = 'V';

  if (suffix && ['Basic', 'Stage 1', 'Stage 2'].includes(base)) {
    return [base, suffix];
  }
  return suffix ? [suffix] : [base];
}
