import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import DeckBuilderView from "@/components/views/DeckBuilderView";
import { getDeckById } from "@/app/actions/decks";

export default async function DeckBuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/");
  }

  const { id: deckId } = await searchParams;
  let initialDeck = null;

  if (deckId) {
    const { deck } = await getDeckById(deckId);
    if (!deck) {
      redirect("/decks");
    }
    initialDeck = deck;
  }

  return (
    <div className="h-[calc(100vh-64px)] overflow-hidden">
      <DeckBuilderView initialDeck={initialDeck} />
    </div>
  );
}
