"use server";

import { auth } from "@/auth";
import { createClient } from "@/utils/supabase/server";

export interface SetPayload {
  set_order: number;
  series_name?: string;
  name: string;
  code: string;
  image_url?: string;
  release_date?: string;
}

async function verifyAdmin(): Promise<{ authorized: boolean; error?: string }> {
  const session = await auth();
  if (!session?.user) return { authorized: false, error: "Unauthorized access" };
  if (!session.user.isAdmin) return { authorized: false, error: "Unauthorized access" };
  return { authorized: true };
}

export async function addSetAction(payload: SetPayload) {
  const authCheck = await verifyAdmin();
  if (!authCheck.authorized) return { success: false, error: authCheck.error };

  const supabase = createClient();
  const { error } = await supabase.from("sets").insert([payload]);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function updateSetAction(id: number | string, payload: SetPayload) {
  const authCheck = await verifyAdmin();
  if (!authCheck.authorized) return { success: false, error: authCheck.error };

  const supabase = createClient();
  const { error } = await supabase.from("sets").update(payload).eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}

export async function deleteSetAction(id: number | string) {
  const authCheck = await verifyAdmin();
  if (!authCheck.authorized) return { success: false, error: authCheck.error };

  const supabase = createClient();
  const { error } = await supabase.from("sets").delete().eq("id", id);

  if (error) return { success: false, error: error.message };
  return { success: true };
}
