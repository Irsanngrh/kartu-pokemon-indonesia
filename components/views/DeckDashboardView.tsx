"use client";

import { useEffect, useState } from "react";
import { Deck } from "@/types";
import { getUserDecks, deleteDeck } from "@/app/actions/decks";
import Link from "next/link";
import { Layers, Plus, Trash2, CalendarDays, ExternalLink, Loader2 } from "lucide-react";

export default function DeckDashboardView() {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    fetchDecks();
  }, []);

  const fetchDecks = async () => {
    setLoading(true);
    const { decks: fetchedDecks } = await getUserDecks();
    setDecks(fetchedDecks);
    setLoading(false);
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!confirm("Apakah Anda yakin ingin menghapus deck ini permanen?")) return;
    
    setDeletingId(id);
    const { success } = await deleteDeck(id);
    if (success) {
      setDecks((prev) => prev.filter((d) => d.id !== id));
    } else {
      alert("Gagal menghapus deck. Silakan coba lagi.");
    }
    setDeletingId(null);
  };

  return (
    <main className="flex flex-col text-foreground py-8">
      <div className="w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl  font-[inherit] mb-1.5 flex items-center gap-3">
              <Layers className="text-blue-500" size={32} />
              My Decks
            </h1>
            <p className="text-foreground/60 text-sm  font-[inherit]">
              Kelola dan rancang 60 kartu deck jagoan Anda sendiri.
            </p>
          </div>
          <Link
            href="/decks/build"
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-[inherit]  transition-all shadow-lg hover:shadow-blue-500/20 hover:-translate-y-0.5"
          >
            <Plus size={20} />
            Buat Deck Baru
          </Link>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-10 h-10 animate-spin text-blue-500 mb-4" />
            <p className="text-foreground/50 ">Memuat Daftar Deck...</p>
          </div>
        ) : decks.length === 0 ? (
          <div className="bg-muted/30 border-2 border-dashed border-border/60 rounded-3xl p-12 text-center flex flex-col items-center justify-center">
            <div className="w-20 h-20 bg-blue-500/10 text-blue-500 rounded-full flex items-center justify-center mb-5">
              <Layers size={40} />
            </div>
            <h3 className="text-2xl  font-[inherit] mb-3">Belum Ada Deck</h3>
            <p className="text-foreground/60 max-w-md mx-auto font-[inherit]">
              Anda belum menyusun satu buah deck pun. Klik tombol di atas untuk mulai merakit kombinasi 60 kartu terkuat Anda!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {decks.map((deck) => {
              const totalCards = deck.cards?.reduce((acc, card) => acc + card.quantity, 0) || 0;
              const formattedDate = new Date(deck.created_at).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric"
              });

              return (
                <Link
                  key={deck.id}
                  href={`/decks/build?id=${deck.id}`}
                  className="group relative bg-card/60 backdrop-blur-sm border border-border/50 hover:border-blue-500/50 rounded-2xl p-5 overflow-hidden transition-all hover:shadow-xl hover:shadow-blue-500/10 cursor-pointer flex flex-col h-full"
                >
                  <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500 transform origin-left scale-x-0 group-hover:scale-x-100 transition-transform duration-300"></div>
                  
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl  font-[inherit] line-clamp-1 pr-4">{deck.name}</h3>
                    <button 
                      onClick={(e) => handleDelete(e, deck.id)}
                      disabled={deletingId === deck.id}
                      className="text-foreground/40 hover:text-red-500 bg-background/50 hover:bg-red-500/10 p-2 rounded-full transition-colors"
                      title="Hapus Deck"
                    >
                      {deletingId === deck.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                    </button>
                  </div>

                  <div className="flex items-center gap-4 text-sm mt-auto mb-5">
                    <div className="flex items-center gap-1.5 text-foreground/70 bg-muted/50 px-3 py-1.5 rounded-lg ">
                      <Layers size={14} className={totalCards === 60 ? "text-green-500" : "text-amber-500"} />
                      <span className={totalCards === 60 ? "text-green-500 dark:text-green-400 " : ""}>
                        {totalCards}/60 Kartu
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border/50 text-xs  text-foreground/50">
                    <div className="flex items-center gap-1.5">
                      <CalendarDays size={14} />
                      {formattedDate}
                    </div>
                    <div className="flex items-center gap-1 text-blue-500  opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all">
                      Edit Deck <ExternalLink size={14} />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
