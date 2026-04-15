import { auth } from "@/auth";
import { createClient } from "@/utils/supabase/server";
import CollectionView from "@/components/views/CollectionView";

export const revalidate = 0;

export default async function CollectionPage({ searchParams }: { searchParams: Promise<{ uid?: string, n?: string, tab?: string }> }) {
  const params = await searchParams;
  const targetUid = params.uid;
  const targetName = params.n;

  const session = await auth();
  const user = session?.user ?? null;

  const fetchUid = targetUid || user?.id;

  // If no user is logged in and no target uid specified, show empty logged-out state
  if (!fetchUid) {
    const userName = "Saya";
    return (
      <CollectionView
        initialCollections={[]}
        userName={userName}
        isOwner={false}
        userId=""
        isLoggedIn={false}
        initialTab={params.tab as "collection" | "wishlist" | undefined}
      />
    );
  }

  const supabase = createClient();

  const { data: collectionRows, error } = await supabase
    .from("user_collections")
    .select("card_id, quantity, is_wishlist")
    .eq("user_id", fetchUid);

  if (error) {
    throw new Error(error.message);
  }

  const cardIds = (collectionRows ?? []).map((r: { card_id: string }) => r.card_id);
  const collections: { quantity: number; is_wishlist: boolean; cards: unknown }[] = [];

  if (cardIds.length > 0) {
    const { data: cardsData } = await supabase
      .from("cards")
      .select("id, name, card_number, image_url, rarity, variant_name, variant_order, stage, hp, types, illustrator, regulation_mark, set_id, sets(name, code, set_order)")
      .in("id", cardIds);

    const cardMap = new Map((cardsData || []).map((c: { id: string }) => [c.id, c]));

    for (const row of collectionRows || []) {
      const card = cardMap.get(row.card_id);
      if (card) collections.push({ quantity: row.quantity, is_wishlist: row.is_wishlist, cards: card });
    }
  }

  const isOwner = user?.id === fetchUid;
  const userName = isOwner ? (user?.name || "Anda") : (targetName || "Pengguna Lain");

  return (
    <CollectionView
      initialCollections={collections}
      userName={userName}
      isOwner={isOwner}
      userId={fetchUid}
      isLoggedIn={!!user}
      initialTab={params.tab as "collection" | "wishlist" | undefined}
    />
  );
}
