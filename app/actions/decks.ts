'use server';

import { createClient } from '@/utils/supabase/server';
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
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[decks] getUserDecks error:', error.message);
    return { decks: [], error: error.message };
  }

  return { decks: (data as Deck[]) ?? [] };
}

export async function getDeckById(
  deckId: string
): Promise<{ deck: Deck | null; error?: string }> {
  const supabase = await createClient();
  const { data: userData, error: userError } = await supabase.auth.getUser();

  if (userError || !userData?.user) {
    return { deck: null, error: 'Unauthorized' };
  }

  const { data, error } = await supabase
    .from('user_decks')
    .select('*')
    .eq('id', deckId)
    .eq('user_id', userData.user.id) // Ensure ownership
    .single();

  if (error) {
    console.error('[decks] getDeckById error:', error.message);
    return { deck: null, error: error.message };
  }

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

  const { data, error } = await supabase
    .from('user_decks')
    .insert([{ user_id: userData.user.id, name, cards }])
    .select()
    .single();

  if (error) {
    console.error('[decks] createDeck error:', error.message);
    return { deck: null, error: error.message };
  }

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

  // Verify ownership before updating
  const { data, error } = await supabase
    .from('user_decks')
    .update({ name, cards })
    .eq('id', deckId)
    .eq('user_id', userData.user.id) // Prevents cross-user deck mutations
    .select()
    .single();

  if (error) {
    console.error('[decks] updateDeck error:', error.message);
    return { deck: null, error: error.message };
  }

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
    .eq('user_id', userData.user.id); // Verify ownership before delete

  if (error) {
    console.error('[decks] deleteDeck error:', error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}
