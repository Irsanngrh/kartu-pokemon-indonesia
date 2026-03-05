import { createClient } from "@/utils/supabase/server";
import AdminTableView from "@/components/views/AdminTableView";

export const revalidate = 0;

export default async function AdminDashboard() {
  const supabase = await createClient();
  
  const { data: cards, error: cardsError } = await supabase
    .from("cards")
    .select("*, sets(name, code, set_order)")
    .order("id", { ascending: false })
    .limit(10000);
    
  const { data: sets, error: setsError } = await supabase
    .from("sets")
    .select("*")
    .order("set_order", { ascending: true });

  if (cardsError || setsError) return <div className="p-6 bg-red-500/10 text-red-500 rounded-xl">Error memuat data database.</div>;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-3xl font-bold tracking-tight">Manajemen Kartu</h2>
        <p className="text-foreground/60 text-sm font-medium">Halaman khusus Admin. Kelola seluruh database kartu, tambah baru, dan edit data secara lengkap.</p>
      </div>
      <AdminTableView initialCards={cards || []} availableSets={sets || []} />
    </div>
  );
}