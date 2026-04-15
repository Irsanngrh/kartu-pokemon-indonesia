import { createClient } from "@/utils/supabase/server";
import AdminTableView from "@/components/views/AdminTableView";
import AdminSetTableView from "@/components/views/AdminSetTableView";
import { Database, Layers } from "lucide-react";
import Link from "next/link";

export const revalidate = 3600;

export default async function AdminDashboard({ searchParams }: { searchParams: Promise<{ tab?: string }> }) {
  const supabase = createClient();

  const { data: cards, error: cardsError } = await supabase
    .from("cards")
    .select("id, name, card_number, image_url, rarity, variant_name, variant_order, stage, hp, types, illustrator, regulation_mark, set_id, sets(name, code, set_order)")
    .order("id", { ascending: false })
    .limit(10000);

  const { data: sets, error: setsError } = await supabase
    .from("sets")
    .select("*")
    .order("set_order", { ascending: true });

  if (cardsError || setsError) return <div className="p-6 bg-red-500/10 text-red-500 rounded-xl">Error memuat data database.</div>;

  const resolvedParams = await searchParams;
  const currentTab = resolvedParams.tab === 'sets' ? 'sets' : 'cards';

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-semibold mb-1 flex items-center gap-2.5">
            <Database size={26} />
            Admin Panel
          </h1>
          <p className="text-foreground/50 text-sm">Kelola seluruh database kartu dan ekspansi Pokémon.</p>
        </div>
      </div>

      <div className="flex gap-2 border-b border-border/60 -mx-2 px-2 overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:'none'] [scrollbar-width:'none']">
        <Link href="?tab=cards" scroll={false} className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 -mb-[1px] whitespace-nowrap flex items-center gap-2 ${currentTab === 'cards' ? 'border-foreground text-foreground bg-muted/30' : 'border-transparent text-foreground/50 hover:text-foreground hover:bg-muted/10'}`}>
          <Database size={16} /> Data Kartu
        </Link>
        <Link href="?tab=sets" scroll={false} className={`px-4 py-2 text-sm font-medium rounded-t-lg border-b-2 -mb-[1px] whitespace-nowrap flex items-center gap-2 ${currentTab === 'sets' ? 'border-foreground text-foreground bg-muted/30' : 'border-transparent text-foreground/50 hover:text-foreground hover:bg-muted/10'}`}>
          <Layers size={16} /> Data Set / Ekspansi
        </Link>
      </div>

      {currentTab === 'cards' ? (
        <AdminTableView initialCards={cards || []} availableSets={sets || []} />
      ) : (
        <AdminSetTableView initialSets={sets || []} />
      )}
    </div>
  );
}
