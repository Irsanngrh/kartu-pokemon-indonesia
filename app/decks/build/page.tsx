import { auth } from "@/auth";
import { redirect } from "next/navigation";
import DeckBuilderView from "@/components/views/DeckBuilderView";
import { getDeckById } from "@/app/actions/decks";

export default async function DeckBuilderPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const session = await auth();

  if (!session?.user) {
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

  return <DeckBuilderView initialDeck={initialDeck} />;
}
