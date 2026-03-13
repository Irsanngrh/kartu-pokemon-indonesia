"use server";

import { createClient } from "@/utils/supabase/server";
import { CardPayload } from "@/types";

export async function addCardAction(payload: CardPayload) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmailsList = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim());

  if (!user || !adminEmailsList.includes(user.email || "")) {
    return { error: "Unauthorized access" };
  }

  const { data, error } = await supabase.from("cards").insert(payload).select("*, sets(name, code, set_order)").single();
  if (error) return { error: error.message };
  return { data };
}

export async function updateCardAction(id: number, payload: CardPayload) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmailsList = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim());

  if (!user || !adminEmailsList.includes(user.email || "")) {
    return { error: "Unauthorized access" };
  }

  const { data, error } = await supabase.from("cards").update(payload).eq("id", id).select("*, sets(name, code, set_order)").single();
  if (error) return { error: error.message };
  return { data };
}

export async function deleteCardAction(id: number) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmailsList = (process.env.ADMIN_EMAILS || "").split(",").map(e => e.trim());

  if (!user || !adminEmailsList.includes(user.email || "")) {
    return { error: "Unauthorized access" };
  }

  const { error } = await supabase.from("cards").delete().eq("id", id);
  if (error) return { error: error.message };
  return { success: true };
}
