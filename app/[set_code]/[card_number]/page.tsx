import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import CardDetailView from "@/components/views/CardDetailView";

export const revalidate = 3600;

export default async function CardDetail({ params }: { params: Promise<{ set_code: string; card_number: string }> }) {
  const resolvedParams = await params;
  const { set_code, card_number } = resolvedParams;
  const supabase = createClient();

  // Step 1: Resolve the set by code (case-insensitive).
  const { data: setData } = await supabase
    .from("sets")
    .select("id")
    .ilike("code", set_code)
    .single();

  if (!setData) notFound();

  // Step 2: Fetch all variants for this (set_id, card_number) pair directly.
  // Filtering by set_id avoids PostgREST join-filter ambiguity that caused duplicate rows.
  const { data: cards, error } = await supabase
    .from("cards")
    .select("*, sets(name, code, set_order)")
    .eq("set_id", setData.id)
    .or(`card_number.eq.${card_number},card_number.like.${card_number}/%`)
    .order("variant_order", { ascending: true })
    .order("image_url", { ascending: true });

  if (error || !cards || cards.length === 0) notFound();

  // Deduplicate by (card_number, variant_order) — protects against duplicate DB
  // records that can result from repeated data imports or migration artifacts.
  const seen = new Set<string>();
  const uniqueCards = cards.filter((card) => {
    const key = `${card.card_number}__${card.variant_order ?? 0}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  if (uniqueCards.length === 0) notFound();

  return <CardDetailView initialCards={uniqueCards} />;
}