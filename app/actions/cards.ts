"use server";

import { createClient } from "@/utils/supabase/server";
import { CardPayload } from "@/types";

async function verifyAdmin(): Promise<{ authorized: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { authorized: false, error: "Unauthorized access" };

  const isAdmin = user.app_metadata?.role === 'admin';
  if (!isAdmin) return { authorized: false, error: "Unauthorized access" };

  return { authorized: true };
}

export async function addCardAction(payload: CardPayload) {
  const auth = await verifyAdmin();
  if (!auth.authorized) return { error: auth.error };

  const supabase = await createClient();
  const { data, error } = await supabase.from("cards").insert(payload).select("*, sets(name, code, set_order)").single();
  if (error) return { error: error.message };
  return { data };
}

export async function updateCardAction(id: number, payload: CardPayload) {
  const auth = await verifyAdmin();
  if (!auth.authorized) return { error: auth.error };

  const supabase = await createClient();
  const { data, error } = await supabase.from("cards").update(payload).eq("id", id).select("*, sets(name, code, set_order)").single();
  if (error) return { error: error.message };
  return { data };
}

export async function deleteCardAction(id: number) {
  const auth = await verifyAdmin();
  if (!auth.authorized) return { error: auth.error };

  const supabase = await createClient();
  const { error } = await supabase.from("cards").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}
