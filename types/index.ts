export interface SetInfo {
  name: string;
  code: string;
  set_order: number;
}

export interface PokemonCard {
  id: number;
  name: string;
  card_number: string;
  image_url: string;
  rarity: string;
  variant_name: string | null;
  variant_order: number | null;
  stage: string | null;
  hp: string | null;
  types: string[] | null;
  illustrator: string | null;
  regulation_mark: string | null;
  set_id: number;
  sets?: SetInfo;
  pokedex_number?: string | null;
  species?: string | null;
  height?: string | null;
  weight?: string | null;
  description?: string | null;
  attacks?: any[] | null;
  weakness?: { type: string; value: string } | null;
  resistance?: { type: string; value: string } | null;
  retreat_cost?: number;
  expansion_symbol_url?: string | null;
  evolution?: string[] | null;
}

export interface CardPayload {
  name: string;
  card_number: string;
  image_url: string;
  rarity: string;
  variant_name?: string | null;
  variant_order?: number | null;
  stage?: string | null;
  hp?: string | null;
  types?: string[] | null;
  illustrator?: string | null;
  regulation_mark?: string | null;
  set_id: number;
  pokedex_number?: string | null;
  species?: string | null;
  height?: string | null;
  weight?: string | null;
  description?: string | null;
  attacks?: any[] | null;
  weakness?: { type: string; value: string } | null;
  resistance?: { type: string; value: string } | null;
  retreat_cost?: number;
  expansion_symbol_url?: string | null;
  evolution?: string[] | null;
}

export interface DeckItem {
  cardId: number;
  quantity: number;
}

export interface Deck {
  id: string;
  user_id: string;
  name: string;
  cards: DeckItem[];
  created_at: string;
}
