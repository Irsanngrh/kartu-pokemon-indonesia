import { createClient } from "@/utils/supabase/server";
import LibraryView from "@/components/views/LibraryView";

export const revalidate = 0;

export default async function HomePage() {
  const supabase = await createClient();
  const { data: cards, error } = await supabase.from("cards").select("*, sets(name, code)");

  if (error) return <div className="p-10 text-center text-red-500">Gagal memuat database.</div>;

  return <LibraryView initialCards={cards || []} />;
}