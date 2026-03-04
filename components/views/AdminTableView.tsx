"use client";

import { useState, useMemo } from "react";
import { Search, Edit2, Check, X } from "lucide-react";
import { createClient } from "@/utils/supabase/client";

export default function AdminTableView({ initialCards }: { initialCards: any[] }) {
  const [cards, setCards] = useState(initialCards);
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClient();

  const filteredCards = useMemo(() => {
    if (!searchQuery) return cards;
    const lowerQuery = searchQuery.toLowerCase();
    return cards.filter((card) => 
      card.name?.toLowerCase().includes(lowerQuery) ||
      card.card_number?.toLowerCase().includes(lowerQuery) ||
      card.sets?.code?.toLowerCase().includes(lowerQuery) ||
      card.variant_name?.toLowerCase().includes(lowerQuery)
    );
  }, [cards, searchQuery]);

  const startEditing = (card: any) => {
    setEditingId(card.id);
    setEditValue(card.variant_name || "");
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEditValue("");
  };

  const saveVariantName = async (id: string) => {
    setIsSaving(true);
    const { error } = await supabase.from("cards").update({ variant_name: editValue }).eq("id", id);

    if (error) {
      alert("Gagal menyimpan data: " + error.message);
      setIsSaving(false);
      return;
    }

    setCards((prevCards) => prevCards.map((c) => (c.id === id ? { ...c, variant_name: editValue } : c)));
    setEditingId(null);
    setEditValue("");
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="relative w-full max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
        <input 
          type="text" 
          placeholder="Cari nama, nomor, atau varian..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-11 pr-4 py-2.5 bg-background border border-border/60 rounded-xl focus:outline-none focus:border-foreground/30 focus:ring-1 focus:ring-foreground/30 text-sm font-semibold shadow-sm"
        />
      </div>

      <div className="bg-background border border-border/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/40 text-foreground/50 text-[10px] uppercase tracking-widest font-bold border-b border-border/60">
              <tr>
                <th className="px-4 py-3">Gambar</th>
                <th className="px-4 py-3">No</th>
                <th className="px-4 py-3">Nama Kartu</th>
                <th className="px-4 py-3">Ekspansi</th>
                <th className="px-4 py-3">Rarity</th>
                <th className="px-4 py-3">Nama Varian</th>
                <th className="px-4 py-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40">
              {filteredCards.map((card) => (
                <tr key={card.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-2">
                    {card.image_url ? (
                      <img src={card.image_url} alt={card.name} className="w-8 h-12 object-cover rounded-md border border-border/50" />
                    ) : (
                      <div className="w-8 h-12 bg-muted rounded-md border border-border/50 flex items-center justify-center text-[8px] text-foreground/40">N/A</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground/60">{card.card_number || "--"}</td>
                  <td className="px-4 py-3 font-bold truncate max-w-[200px]">{card.name}</td>
                  <td className="px-4 py-3 font-semibold text-foreground/70">{card.sets?.code || "--"}</td>
                  <td className="px-4 py-3 font-bold">{card.rarity || "--"}</td>
                  <td className="px-4 py-3">
                    {editingId === card.id ? (
                      <input 
                        type="text" 
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        placeholder="Contoh: Holo..."
                        className="px-3 py-1.5 w-full min-w-[150px] bg-background border border-foreground/30 rounded-lg focus:outline-none focus:ring-1 focus:ring-foreground/50 text-sm font-semibold"
                        autoFocus
                      />
                    ) : (
                      <span className={`font-semibold ${card.variant_name ? 'text-foreground' : 'text-foreground/30 italic'}`}>
                        {card.variant_name || "Belum ada varian"}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    {editingId === card.id ? (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => saveVariantName(card.id)} disabled={isSaving} className="p-1.5 bg-green-500/10 text-green-600 rounded-md transition-colors disabled:opacity-50"><Check size={16} /></button>
                        <button onClick={cancelEditing} disabled={isSaving} className="p-1.5 bg-red-500/10 text-red-600 rounded-md transition-colors disabled:opacity-50"><X size={16} /></button>
                      </div>
                    ) : (
                      <button onClick={() => startEditing(card)} className="p-1.5 bg-muted text-foreground/60 hover:text-foreground border border-border/50 rounded-md transition-colors inline-flex"><Edit2 size={14} /></button>
                    )}
                  </td>
                </tr>
              ))}
              {filteredCards.length === 0 && (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-foreground/50 font-medium">Tidak ada kartu yang ditemukan.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}