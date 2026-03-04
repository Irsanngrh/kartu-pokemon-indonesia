import { createClient } from "@/utils/supabase/server";
import { notFound } from "next/navigation";
import CardDetailView from "@/components/views/CardDetailView";

export default async function CardDetail({ params }: { params: Promise<{ set_code: string; card_number: string }> }) {
  const resolvedParams = await params;
  const { set_code, card_number } = resolvedParams;
  const supabase = await createClient();

  const { data: cards, error } = await supabase
    .from("cards")
    .select("*, sets!inner(name, code)")
    .ilike("sets.code", set_code)
    .like("card_number", `${card_number}%`)
    .order("variant_order", { ascending: true })
    .order("image_url", { ascending: true });

  if (error || !cards || cards.length === 0) notFound();

  return <CardDetailView initialCards={cards} />;
}