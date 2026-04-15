'use server';

import { auth } from '@/auth';
import { createClient } from '@/utils/supabase/server';
import { Deck, DeckItem } from '@/types';

export async function getUserDecks(): Promise<{ decks: Deck[]; error?: string }> {
  const session = await auth();
  if (!session?.user) return { decks: [], error: 'Unauthorized' };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_decks')
    .select('*')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) return { decks: [], error: error.message };

  return { decks: (data as Deck[]) ?? [] };
}

export async function getDeckById(
  deckId: string
): Promise<{ deck: Deck | null; error?: string }> {
  const supabase = createClient();

  const { data, error } = await supabase
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
  const session = await auth();
  if (!session?.user) return { deck: null, error: 'Unauthorized' };

  const sanitizedName = name.trim().slice(0, 100);
  if (!sanitizedName) return { deck: null, error: 'Deck name is required' };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_decks')
    .insert([{ user_id: session.user.id, name: sanitizedName, cards }])
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
  const session = await auth();
  if (!session?.user) return { deck: null, error: 'Unauthorized' };

  const sanitizedName = name.trim().slice(0, 100);
  if (!sanitizedName) return { deck: null, error: 'Deck name is required' };

  const supabase = createClient();
  const { data, error } = await supabase
    .from('user_decks')
    .update({ name: sanitizedName, cards })
    .eq('id', deckId)
    .eq('user_id', session.user.id)
    .select()
    .single();

  if (error) return { deck: null, error: error.message };

  return { deck: data as Deck };
}

export async function deleteDeck(
  deckId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, error: 'Unauthorized' };

  const supabase = createClient();
  const { error } = await supabase
    .from('user_decks')
    .delete()
    .eq('id', deckId)
    .eq('user_id', session.user.id);

  if (error) return { success: false, error: error.message };

  return { success: true };
}
