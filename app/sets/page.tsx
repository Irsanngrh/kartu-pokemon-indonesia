import { createClient } from "@/utils/supabase/server";
import Link from "next/link";
import { Layers } from "lucide-react";

export const revalidate = 3600;

export default async function SetsPage() {
  const supabase = createClient();

  const { data: sets, error } = await supabase
    .from("sets")
    .select("*")
    .order("set_order", { ascending: true });

  if (error || !sets) {
    return (
      <div className="flex flex-col container mx-auto px-4 py-8 items-center justify-center min-h-[50vh]">
        <p className="text-red-500 bg-red-500/10 px-4 py-2 rounded-lg">Gagal memuat data ekspansi.</p>
        <Link href="/" className="mt-4 text-blue-500 hover:underline">Kembali ke Halaman Utama</Link>
      </div>
    );
  }

  // Group by series_name
  const groupedSets: Record<string, any[]> = {};
  sets.forEach((set) => {
    const series = set.series_name || "Lainnya";
    if (!groupedSets[series]) {
      groupedSets[series] = [];
    }
    groupedSets[series].push(set);
  });

  // Preserve the order of series based on the first occurrence of set_order
  const seriesOrder = Object.keys(groupedSets).sort((a, b) => {
    const minOrderA = Math.min(...groupedSets[a].map(s => s.set_order));
    const minOrderB = Math.min(...groupedSets[b].map(s => s.set_order));
    return minOrderA - minOrderB;
  });

  return (
    <div className="flex flex-col w-full min-h-screen bg-background text-foreground pb-20">
      <div className="w-full pt-8">
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-2xl font-semibold mb-1 flex items-center gap-2.5">
              <Layers size={26} />
              Daftar Set & Ekspansi
            </h1>
            <p className="text-foreground/50 text-sm">Temukan seluruh koleksi set dan ekspansi Pokémon Card Game Indonesia.</p>
          </div>
        </header>

        <div className="flex flex-col gap-16">
          {seriesOrder.map((series) => (
            <div key={series} className="flex flex-col gap-6">
              
              <div className="flex flex-col gap-3">
                <h2 className="text-xl font-semibold text-foreground/90">
                  {series}
                </h2>
                <div className="w-full border-b border-border/40 mb-2"></div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6 sm:gap-8 min-[2000px]:grid-cols-8">
                {groupedSets[series].map((set) => (
                  <Link 
                    key={set.id} 
                    href={`/?expansion=${set.code}`}
                    className="group relative flex flex-col h-full bg-muted/40 rounded-[20px] border border-border/40 backdrop-blur-sm p-2 sm:p-2.5 gap-3 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md cursor-pointer"
                  >
                    {/* Image Container */}
                    <div className="relative w-full aspect-[63/88] rounded-xl overflow-hidden bg-muted/50 border border-border/50 flex items-center justify-center p-2">
                      {set.image_url ? (
                        <img 
                          src={set.image_url} 
                          alt={set.name} 
                          className="w-full h-full object-contain drop-shadow-md transition-transform duration-500 group-hover:scale-110"
                        />
                      ) : (
                        <span className="text-[10px] text-foreground/40 uppercase tracking-widest">No Image</span>
                      )}
                    </div>
                    
                    {/* Details */}
                    <div className="flex flex-col gap-1 px-1 pb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-foreground/50 uppercase tracking-widest truncate">
                          {set.code}{set.release_date ? ` (${set.release_date})` : ""}
                        </span>
                      </div>
                      <h3 className="text-sm leading-tight transition-colors line-clamp-2">
                        {set.name}
                      </h3>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-foreground/60 truncate">
                          {series}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
