import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import CollectionView from "@/components/views/CollectionView";

export const revalidate = 0;

export default async function CollectionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/");

  const { data: collections, error } = await supabase
    .from("user_collections")
    .select(`quantity, is_wishlist, cards (*, sets (name, code))`)
    .eq("user_id", user.id);

  if (error) throw new Error(error.message);

  return <CollectionView initialCollections={collections || []} userName={user.user_metadata?.full_name || "User"} />;
}