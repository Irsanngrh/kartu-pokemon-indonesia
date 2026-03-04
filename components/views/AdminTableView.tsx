"use client";

import { useState, useMemo } from "react";
import { Search, Edit2, Plus, X, Save, Trash2 } from "lucide-react";
import { createClient } from "@/utils/supabase/client";
import CustomDropdown from "@/components/ui/CustomDropdown";

export default function AdminTableView({ initialCards, availableSets }: { initialCards: any[], availableSets: any[] }) {
  const [cards, setCards] = useState(initialCards);
  const [searchQuery, setSearchQuery] = useState("");
  const [expansionFilter, setExpansionFilter] = useState("Semua");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);

  const supabase = createClient();

  const expansions = useMemo(() => ["Semua", ...Array.from(new Set(availableSets.map(s => `${s.name} (${s.code})`)))], [availableSets]);

  const filteredCards = useMemo(() => {
    let filtered = cards;
    
    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      filtered = filtered.filter((c) => 
        c.name?.toLowerCase().includes(lower) || c.card_number?.toLowerCase().includes(lower)
      );
    }
    
    if (expansionFilter !== "Semua") {
      filtered = filtered.filter(c => c.sets && `${c.sets.name} (${c.sets.code})` === expansionFilter);
    }
    
    return filtered.sort((a, b) => {
      const numA = parseInt((a.card_number || "0").replace(/\D/g, "")) || 0;
      const numB = parseInt((b.card_number || "0").replace(/\D/g, "")) || 0;
      if (numA !== numB) return numA - numB;
      
      const orderA = a.variant_order || 1;
      const orderB = b.variant_order || 1;
      if (orderA !== orderB) return orderA - orderB;

      return (a.image_url || "").localeCompare(b.image_url || "");
    });
  }, [cards, searchQuery, expansionFilter]);

  const openModal = (card?: any) => {
    if (card) {
      setEditingId(card.id);
      setFormData({
        ...card,
        variant_order: card.variant_order || 1,
        attacks: card.attacks ? JSON.stringify(card.attacks, null, 2) : "",
        types: card.types ? JSON.stringify(card.types, null, 2) : "",
        evolution: card.evolution ? JSON.stringify(card.evolution, null, 2) : "",
        weakness: card.weakness ? JSON.stringify(card.weakness, null, 2) : "",
        resistance: card.resistance ? JSON.stringify(card.resistance, null, 2) : "",
      });
    } else {
      setEditingId(null);
      setFormData({
        set_id: availableSets[0]?.id || "",
        name: "", 
        card_number: "", 
        variant_name: "", 
        variant_order: 1, 
        hp: "", 
        stage: "", 
        rarity: "",
        illustrator: "", 
        image_url: "", 
        expansion_symbol_url: "", 
        description: "",
        attacks: "", 
        types: "", 
        evolution: "", 
        weakness: "", 
        resistance: ""
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setFormData({});
    setEditingId(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSave = async () => {
    setIsSaving(true);
    
    const parseJson = (val: string, fieldName: string) => {
      if (!val || val.trim() === "") return null;
      try { 
        return JSON.parse(val); 
      } catch (e) { 
        throw new Error(`Format JSON pada kolom ${fieldName} tidak valid.`); 
      }
    };

    try {
      const payload = {
        set_id: formData.set_id,
        name: formData.name?.trim() || null,
        card_number: formData.card_number?.trim() || null,
        variant_name: formData.variant_name?.trim() || null,
        variant_order: parseInt(formData.variant_order) || 1,
        hp: formData.hp?.trim() || null,
        stage: formData.stage?.trim() || null,
        rarity: formData.rarity?.trim() || null,
        illustrator: formData.illustrator?.trim() || null,
        image_url: formData.image_url?.trim() || null,
        expansion_symbol_url: formData.expansion_symbol_url?.trim() || null,
        description: formData.description?.trim() || null,
        attacks: parseJson(formData.attacks, "Serangan"),
        types: parseJson(formData.types, "Tipe/Elemen"),
        evolution: parseJson(formData.evolution, "Evolusi"),
        weakness: parseJson(formData.weakness, "Kelemahan"),
        resistance: parseJson(formData.resistance, "Resistansi"),
      };

      if (editingId) {
        const { error } = await supabase.from("cards").update(payload).eq("id", editingId);
        if (error) throw error;
        
        setCards(cards.map(c => 
          c.id === editingId 
            ? { ...c, ...payload, sets: availableSets.find(s => s.id === payload.set_id) } 
            : c
        ));
      } else {
        const { data, error } = await supabase.from("cards").insert(payload).select("*, sets(name, code)").single();
        if (error) throw error;
        
        setCards([...cards, data]);
      }
      closeModal();
    } catch (err: any) {
      alert("Gagal menyimpan: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingId || !confirm("Yakin ingin menghapus kartu ini selamanya?")) return;
    
    setIsSaving(true);
    const { error } = await supabase.from("cards").delete().eq("id", editingId);
    
    if (!error) {
      setCards(cards.filter(c => c.id !== editingId));
      closeModal();
    } else {
      alert("Gagal menghapus: " + error.message);
    }
    setIsSaving(false);
  };

  return (
    <div className="flex flex-col gap-6">
      
      <div className="flex flex-col md:flex-row gap-4 items-end justify-between p-5 bg-muted/30 border border-border/50 rounded-[20px]">
        <div className="flex flex-col sm:flex-row items-end gap-4 w-full md:w-auto flex-1">
          <div className="relative w-full sm:max-w-xs flex flex-col gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/50 ml-1">Pencarian</span>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
              <input 
                type="text" placeholder="Cari nama atau nomor..." 
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-background border border-border/60 rounded-xl focus:outline-none focus:border-foreground/30 text-sm font-semibold shadow-sm"
              />
            </div>
          </div>
          <div className="w-full sm:w-56">
            <CustomDropdown label="Filter Ekspansi" options={expansions} value={expansionFilter} onChange={setExpansionFilter} />
          </div>
        </div>
        <button onClick={() => openModal()} className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-foreground text-background font-bold text-sm rounded-xl hover:scale-105 transition-transform shadow-md whitespace-nowrap">
          <Plus size={18} /> Tambah Kartu
        </button>
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
                <th className="px-4 py-3">Varian</th>
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
                      <div className="w-8 h-12 bg-muted rounded-md border flex items-center justify-center text-[8px] text-foreground/40">N/A</div>
                    )}
                  </td>
                  <td className="px-4 py-3 font-semibold text-foreground/60">{card.card_number || "--"}</td>
                  <td className="px-4 py-3 font-bold truncate max-w-[200px]">{card.name}</td>
                  <td className="px-4 py-3 font-semibold text-foreground/70">{card.sets?.code || "--"}</td>
                  <td className="px-4 py-3 font-bold">{card.rarity || "--"}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${card.variant_name ? 'text-foreground' : 'text-foreground/30 italic'}`}>
                      {card.variant_name || "Normal"} <span className="text-foreground/40 text-xs ml-1">({card.variant_order || 1})</span>
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button onClick={() => openModal(card)} className="p-2 bg-muted/60 text-foreground/80 hover:text-foreground hover:bg-muted border border-border/50 rounded-lg transition-colors inline-flex">
                      <Edit2 size={14} />
                    </button>
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

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-background w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95">
            
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
              <h3 className="font-extrabold text-xl">{editingId ? "Edit Detail Kartu" : "Tambah Kartu Baru"}</h3>
              <button onClick={closeModal} className="p-2 hover:bg-muted rounded-full transition-colors"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                <div className="space-y-4">
                  <div><label className="text-xs font-bold text-foreground/60">Ekspansi (Set)</label>
                    <select name="set_id" value={formData.set_id} onChange={handleChange} className="w-full mt-1 p-2.5 bg-background border rounded-lg text-sm">
                      {availableSets.map(s => <option key={s.id} value={s.id}>{s.name} ({s.code})</option>)}
                    </select>
                  </div>
                  <div><label className="text-xs font-bold text-foreground/60">Nomor Kartu</label>
                    <input type="text" name="card_number" value={formData.card_number || ""} onChange={handleChange} className="w-full mt-1 p-2.5 bg-background border rounded-lg text-sm" placeholder="Contoh: 001/190" />
                  </div>
                  <div><label className="text-xs font-bold text-foreground/60">Nama Kartu</label>
                    <input type="text" name="name" value={formData.name || ""} onChange={handleChange} className="w-full mt-1 p-2.5 bg-background border rounded-lg text-sm" placeholder="Nama Pokémon / Item" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold text-foreground/60">Nama Varian</label>
                      <input type="text" name="variant_name" value={formData.variant_name || ""} onChange={handleChange} className="w-full mt-1 p-2.5 bg-background border rounded-lg text-sm" placeholder="Kosongkan untuk Normal" />
                    </div>
                    <div><label className="text-xs font-bold text-foreground/60">Urutan (1, 2, 3..)</label>
                      <input type="number" name="variant_order" value={formData.variant_order || 1} onChange={handleChange} className="w-full mt-1 p-2.5 bg-background border rounded-lg text-sm" />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div><label className="text-xs font-bold text-foreground/60">Rarity</label>
                      <input type="text" name="rarity" value={formData.rarity || ""} onChange={handleChange} className="w-full mt-1 p-2.5 bg-background border rounded-lg text-sm" placeholder="Contoh: MA, SR, RRR" />
                    </div>
                    <div><label className="text-xs font-bold text-foreground/60">HP</label>
                      <input type="text" name="hp" value={formData.hp || ""} onChange={handleChange} className="w-full mt-1 p-2.5 bg-background border rounded-lg text-sm" />
                    </div>
                  </div>
                  <div><label className="text-xs font-bold text-foreground/60">URL Gambar Kartu</label>
                    <input type="text" name="image_url" value={formData.image_url || ""} onChange={handleChange} className="w-full mt-1 p-2.5 bg-background border rounded-lg text-sm" />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <span className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-2 block">Mode Developer (Format JSON)</span>
                    <p className="text-[11px] text-foreground/70 leading-relaxed mb-3">Kolom di bawah ini wajib diisi menggunakan struktur array/objek JSON murni untuk mendukung elemen visual di website.</p>
                    
                    <div className="space-y-3">
                      <div><label className="text-xs font-bold">Data Serangan (Attacks)</label>
                        <textarea name="attacks" value={formData.attacks || ""} onChange={handleChange} rows={5} className="w-full mt-1 p-2 font-mono text-[10px] bg-background border border-border/60 rounded-lg custom-scrollbar" placeholder='[{"name": "Scratch", "damage": "20", "cost": ["url1"], "effect": ""}]'></textarea>
                      </div>
                      <div><label className="text-xs font-bold">Elemen / Tipe (Types)</label>
                        <textarea name="types" value={formData.types || ""} onChange={handleChange} rows={2} className="w-full mt-1 p-2 font-mono text-[10px] bg-background border border-border/60 rounded-lg" placeholder='["url_gambar_elemen"]'></textarea>
                      </div>
                      <div><label className="text-xs font-bold">Kelemahan (Weakness)</label>
                        <textarea name="weakness" value={formData.weakness || ""} onChange={handleChange} rows={2} className="w-full mt-1 p-2 font-mono text-[10px] bg-background border border-border/60 rounded-lg" placeholder='{"type": "url_gambar", "value": "x2"}'></textarea>
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex items-center justify-between bg-muted/20">
              {editingId ? (
                <button onClick={handleDelete} disabled={isSaving} className="px-4 py-2 bg-red-500/10 text-red-600 font-bold text-sm rounded-xl flex items-center gap-2 hover:bg-red-500/20 transition-colors">
                  <Trash2 size={16} /> Hapus
                </button>
              ) : <div></div>}
              
              <div className="flex items-center gap-3">
                <button onClick={closeModal} disabled={isSaving} className="px-4 py-2 font-bold text-sm text-foreground/60 hover:text-foreground">Batal</button>
                <button onClick={handleSave} disabled={isSaving} className="px-6 py-2.5 bg-foreground text-background font-bold text-sm rounded-xl flex items-center gap-2 hover:scale-105 transition-transform disabled:opacity-50">
                  <Save size={16} /> {isSaving ? "Menyimpan..." : "Simpan Data"}
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}