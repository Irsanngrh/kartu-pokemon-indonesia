'use server';

import { createClient } from '@/utils/supabase/server';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Deck, DeckItem } from '@/types';

export async function getUserDecks(): Promise<{ decks: Deck[]; error?: string }> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    return { decks: [], error: 'Unauthorized' };
  }

  const { data, error } = await supabase
    .from('user_decks')
    .select('*')
    .eq('user_id', userData.user.id)
    .order('created_at', { ascending: false });

  if (error) return { decks: [], error: error.message };

  return { decks: (data as Deck[]) ?? [] };
}

export async function getDeckById(
  deckId: string
): Promise<{ deck: Deck | null; error?: string }> {
  const publicClient = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data, error } = await publicClient
    .from('user_decks')
    .select('*')
    .eq('id', deckId)
    .single();

  if (error) return { deck: null, error: error.message };

  return { deck: data as Deck };
}

export async function createDeck(
  name: string,
  cards: DeckItem[] = []
): Promise<{ deck: Deck | null; error?: string }> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    return { deck: null, error: 'Unauthorized' };
  }

  const sanitizedName = name.trim().slice(0, 100);
  if (!sanitizedName) return { deck: null, error: 'Deck name is required' };

  const { data, error } = await supabase
    .from('user_decks')
    .insert([{ user_id: userData.user.id, name: sanitizedName, cards }])
    .select()
    .single();

  if (error) return { deck: null, error: error.message };

  return { deck: data as Deck };
}

export async function updateDeck(
  deckId: string,
  name: string,
  cards: DeckItem[]
): Promise<{ deck: Deck | null; error?: string }> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    return { deck: null, error: 'Unauthorized' };
  }

  const sanitizedName = name.trim().slice(0, 100);
  if (!sanitizedName) return { deck: null, error: 'Deck name is required' };

  const { data, error } = await supabase
    .from('user_decks')
    .update({ name: sanitizedName, cards })
    .eq('id', deckId)
    .eq('user_id', userData.user.id)
    .select()
    .single();

  if (error) return { deck: null, error: error.message };

  return { deck: data as Deck };
}

export async function deleteDeck(
  deckId: string
): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    return { success: false, error: 'Unauthorized' };
  }

  const { error } = await supabase
    .from('user_decks')
    .delete()
    .eq('id', deckId)
    .eq('user_id', userData.user.id);

  if (error) return { success: false, error: error.message };

  return { success: true };
}
