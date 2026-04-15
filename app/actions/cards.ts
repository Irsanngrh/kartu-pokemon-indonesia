"use server";

import { auth } from "@/auth";
import { createClient } from "@/utils/supabase/server";
import { CardPayload } from "@/types";

async function verifyAdmin(): Promise<{ authorized: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { authorized: false, error: "Unauthorized access" };
  if (!session.user.isAdmin) return { authorized: false, error: "Unauthorized access" };
  return { authorized: true };
}

export async function addCardAction(payload: CardPayload) {
  const authCheck = await verifyAdmin();
  if (!authCheck.authorized) return { error: authCheck.error };

  const supabase = createClient();
  const { data, error } = await supabase.from("cards").insert(payload).select("*, sets(name, code, set_order)").single();
  if (error) return { error: error.message };
  return { data };
}

export async function updateCardAction(id: number, payload: CardPayload) {
  const authCheck = await verifyAdmin();
  if (!authCheck.authorized) return { error: authCheck.error };

  const supabase = createClient();
  const { data, error } = await supabase.from("cards").update(payload).eq("id", id).select("*, sets(name, code, set_order)").single();
  if (error) return { error: error.message };
  return { data };
}

export async function deleteCardAction(id: number) {
  const authCheck = await verifyAdmin();
  if (!authCheck.authorized) return { error: authCheck.error };

  const supabase = createClient();
  const { error } = await supabase.from("cards").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}
