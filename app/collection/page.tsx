import { createClient } from "@/utils/supabase/server";
import CollectionView from "@/components/views/CollectionView";

export const revalidate = 0;

export default async function CollectionPage({ searchParams }: { searchParams: Promise<{ uid?: string, n?: string, tab?: string }> }) {
  const params = await searchParams;
  const targetUid = params.uid;
  const targetName = params.n;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const fetchUid = targetUid || user?.id;

  // If no user is logged in and no target uid specified, show empty logged-out state
  if (!fetchUid) {
    const userName = "Kamu";
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

  const { data: collections, error } = await supabase
    .from("user_collections")
    .select(`quantity, is_wishlist, cards (id, name, card_number, image_url, rarity, variant_name, variant_order, stage, hp, types, illustrator, regulation_mark, set_id, sets (name, code, set_order))`)
    .eq("user_id", fetchUid);

  if (error) {
    throw new Error(error.message);
  }

  const isOwner = user?.id === fetchUid;
  const userName = isOwner ? (user?.user_metadata?.full_name || "Anda") : (targetName || "Pengguna Lain");

  return (
    <CollectionView
      initialCollections={collections || []}
      userName={userName}
      isOwner={isOwner}
      userId={fetchUid}
      isLoggedIn={!!user}
      initialTab={params.tab as "collection" | "wishlist" | undefined}
    />
  );
}
