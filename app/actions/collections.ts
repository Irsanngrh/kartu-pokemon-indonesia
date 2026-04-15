"use server";

import { auth } from "@/auth";
import { createClient } from "@/utils/supabase/server";

export async function updateCollectionAction(cardId: string | number, quantity: number, isWishlist: boolean) {
  const session = await auth();
  const user = session?.user;

  if (!user) return { error: "Unauthorized access" };

  const supabase = createClient();

  const { data: existing } = await supabase
    .from("user_collections")
    .select("id")
    .eq("user_id", user.id)
    .eq("card_id", cardId)
    .maybeSingle();

  if (quantity === 0 && !isWishlist) {
    if (existing) {
      const { error } = await supabase.from("user_collections").delete().eq("id", existing.id);
      if (error) return { error: error.message };
    }
  } else {
    if (existing) {
      const { error } = await supabase.from("user_collections").update({
        quantity,
        is_wishlist: isWishlist,
      }).eq("id", existing.id);
      if (error) return { error: error.message };
    } else {
      const { error } = await supabase.from("user_collections").insert({
        user_id: user.id,
        card_id: cardId,
        quantity,
        is_wishlist: isWishlist,
      });
      if (error) return { error: error.message };
    }
  }
  return { success: true };
}
