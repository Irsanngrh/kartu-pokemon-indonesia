"use client";

import { useState, useMemo, useEffect } from "react";
import { Search, Edit2, Plus, X, Save, Trash2, ArrowUp, Loader2, Info } from "lucide-react";
import { addSetAction, updateSetAction, deleteSetAction, SetPayload } from "@/app/actions/sets";

export default function AdminSetTableView({ initialSets }: { initialSets: any[] }) {
  const [sets, setSets] = useState(initialSets);
  const [searchQuery, setSearchQuery] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<any>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [page, setPage] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const PAGE_SIZE = 100;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const filteredSets = useMemo(() => {
    let filtered = sets;

    if (searchQuery) {
      const lower = searchQuery.toLowerCase();
      filtered = filtered.filter((s) =>
        s.name?.toLowerCase().includes(lower) || s.code?.toLowerCase().includes(lower) || s.series_name?.toLowerCase().includes(lower)
      );
    }

    return filtered.sort((a, b) => {
      const orderA = a.set_order || 99;
      const orderB = b.set_order || 99;
      return orderA - orderB;
    });
  }, [sets, searchQuery]);

  useEffect(() => { setPage(0); }, [searchQuery]);

  const totalPages = Math.ceil(filteredSets.length / PAGE_SIZE);
  const paginatedSets = filteredSets.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  const openModal = (set?: any) => {
    if (set) {
      setEditingId(set.id);
      setFormData({
        ...set,
      });
    } else {
      setEditingId(null);
      setFormData({
        set_order: 99,
        series_name: "Lainnya",
        name: "",
        code: "",
        image_url: "",
        release_date: ""
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.code) {
      showToast("Nama Set dan Kode wajib diisi.");
      return;
    }

    setIsSaving(true);
    const payload: SetPayload = {
      set_order: Number(formData.set_order) || 99,
      series_name: formData.series_name || "Lainnya",
      name: formData.name,
      code: formData.code,
      image_url: formData.image_url || "",
      release_date: formData.release_date || ""
    };

    try {
      if (editingId) {
        const { success, error } = await updateSetAction(editingId, payload);
        if (success) {
          setSets((prev) => prev.map((s) => (s.id === editingId ? { ...s, ...payload } : s)));
          setIsModalOpen(false);
        } else {
          showToast("Gagal memperbarui ekpansi: " + error);
        }
      } else {
        const { success, error } = await addSetAction(payload);
        if (success) {
          window.location.reload(); // Reload to get fresh ID
        } else {
          showToast("Gagal menambahkan ekspansi: " + error);
        }
      }
    } catch (err: any) {
      showToast("Terjadi kesalahan: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Yakin ingin menghapus set ini? Semua kartu dalam set ini mungkin akan terpengaruh jika tidak ada constraint cascade.")) return;
    setIsSaving(true);
    const { success, error } = await deleteSetAction(id);
    setIsSaving(false);
    
    if (success) {
      setSets((prev) => prev.filter((s) => s.id !== id));
    } else {
      showToast("Gagal menghapus ekspansi: " + error);
    }
  };

  return (
    <>
      {toastMessage && (
        <div className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] sm:w-fit max-w-[360px] sm:max-w-none bg-background border border-border/50 text-foreground px-4 sm:px-6 py-3 sm:py-3.5 rounded-2xl sm:rounded-full shadow-2xl text-[13px] sm:text-sm flex items-center justify-center sm:justify-start gap-3 transition-all animate-in fade-in slide-in-from-top-4 text-center sm:text-left leading-relaxed sm:whitespace-nowrap">
          <Info size={18} className="text-foreground shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
      <div className="flex flex-col lg:flex-row gap-4 items-end justify-between p-5 bg-muted/30 border border-border/50 rounded-[20px] mb-6">
        <div className="flex flex-col lg:flex-row items-end gap-4 w-full flex-1">
          <div className="relative w-full lg:flex-[2] flex flex-col gap-1.5">
            <span className="text-[10px] uppercase tracking-widest text-foreground/50 ml-1">Pencarian</span>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" size={18} />
              <input
                type="text"
                placeholder="Cari berdasarkan nama, kode, atau seri..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-4 h-[42px] bg-background border border-border/60 rounded-xl focus:outline-none focus:border-foreground/30 text-sm shadow-sm"
              />
            </div>
          </div>
        </div>
        <button
          onClick={() => openModal()}
          className="w-full lg:w-auto flex items-center justify-center gap-2 px-5 h-[42px] bg-background border border-border/50 text-foreground text-sm rounded-xl hover:bg-muted/30 transition-all shadow-md whitespace-nowrap cursor-pointer"
        >
          <Plus size={18} /> Tambah Set Baru
        </button>
      </div>

      <div className="bg-background border border-border/60 rounded-2xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-muted/40 text-foreground/50 text-[10px] uppercase tracking-widest border-b border-border/60">
            <tr>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Gambar</th>
              <th className="px-4 py-3">Kode</th>
              <th className="px-4 py-3">Nama Set</th>
              <th className="px-4 py-3">Seri</th>
              <th className="px-4 py-3">Tgl Rilis</th>
              <th className="px-4 py-3 text-center">Aksi</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40">
            {paginatedSets.length > 0 ? (
              paginatedSets.map((s) => (
                <tr key={s.id} className="hover:bg-muted/20 transition-colors">
                  <td className="px-4 py-3 text-foreground/60">{s.set_order}</td>
                  <td className="px-4 py-2">
                    {s.image_url ? (
                      <div className="w-16 h-10 bg-muted/30 rounded overflow-hidden flex items-center justify-center">
                        <img src={s.image_url} alt={s.name} className="max-w-full max-h-full object-contain" />
                      </div>
                    ) : (
                      <div className="w-16 h-10 bg-muted flex items-center justify-center rounded text-[8px] text-foreground/40">N/A</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-foreground/70">{s.code}</td>
                  <td className="px-4 py-3 truncate max-w-[200px]">{s.name}</td>
                  <td className="px-4 py-3">
                    <span className="inline-block px-2.5 py-1 bg-muted rounded-full text-[10px] font-medium">
                      {s.series_name || "Lainnya"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-foreground/70">{s.release_date || "--"}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-3">
                       <button
                        onClick={() => openModal(s)}
                        className="p-2 bg-muted/60 text-foreground/80 hover:text-foreground hover:bg-muted border border-border/50 rounded-lg transition-colors inline-flex disabled:opacity-50 cursor-pointer"
                        title="Edit data"
                      >
                        <Edit2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-foreground/50">
                  Tidak ada set yang ditemukan.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <span className="text-sm text-foreground/60">
            Menampilkan {page * PAGE_SIZE + 1} - {Math.min((page + 1) * PAGE_SIZE, filteredSets.length)} dari {filteredSets.length} set
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => { setPage(p => Math.max(0, p - 1)); scrollToTop(); }}
              disabled={page === 0}
              className="px-3 py-1.5 text-xs rounded-lg border border-border/50 hover:bg-muted disabled:opacity-30 transition-colors bg-background cursor-pointer"
            >
              Sebelumnya
            </button>
            <button
              onClick={() => { setPage(p => Math.min(totalPages - 1, p + 1)); scrollToTop(); }}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 text-xs rounded-lg border border-border/50 hover:bg-muted disabled:opacity-30 transition-colors bg-background cursor-pointer"
            >
              Selanjutnya
            </button>
          </div>
        </div>
      )}

      {showScrollTop && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-6 right-6 p-3.5 bg-background border border-border/50 text-foreground rounded-full shadow-lg hover:bg-muted/30 transition-all z-50 flex items-center justify-center"
        >
          <ArrowUp size={20} />
        </button>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-background w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl border border-border overflow-hidden animate-in fade-in zoom-in-95">
            <div className="px-6 py-4 border-b border-border flex items-center justify-between bg-muted/30">
              <h3 className=" text-xl">{editingId ? "Edit Ekspansi / Set" : "Tambah Ekspansi Baru"}</h3>
              <button onClick={() => !isSaving && setIsModalOpen(false)} className="p-2 hover:bg-muted rounded-full transition-colors cursor-pointer" disabled={isSaving}><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {editingId && (
                  <div className="opacity-60 pointer-events-none mb-1 md:col-span-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-foreground/60 mb-1.5 block">ID / Status</label>
                    <input type="text" value={editingId} disabled className="w-full px-3 py-2 bg-muted rounded-md text-sm border border-border/30" />
                  </div>
                )}

                <div className="md:col-span-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground/60 mb-1.5 block">Kode Set *</label>
                  <input
                    type="text"
                    value={formData.code || ""}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    className="w-full px-3 py-2 bg-background rounded-md text-sm border border-border focus:ring-1 focus:ring-foreground outline-none"
                    placeholder="Contoh: MA3"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground/60 mb-1.5 block">Nama Set (Ekspansi) *</label>
                  <input
                    type="text"
                    value={formData.name || ""}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 bg-background rounded-md text-sm border border-border focus:ring-1 focus:ring-foreground outline-none"
                    placeholder="Contoh: Evolusi Mega Impian ex"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground/60 mb-1.5 block">Nama Seri / Era</label>
                  <input
                    type="text"
                    value={formData.series_name || ""}
                    onChange={(e) => setFormData({ ...formData, series_name: e.target.value })}
                    className="w-full px-3 py-2 bg-background rounded-md text-sm border border-border focus:ring-1 focus:ring-foreground outline-none"
                    placeholder="Contoh: Evolusi Mega"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground/60 mb-1.5 block">Order Urutan Rilis</label>
                  <input
                    type="number"
                    value={formData.set_order || 99}
                    onChange={(e) => setFormData({ ...formData, set_order: parseInt(e.target.value) || 99 })}
                    className="w-full px-3 py-2 bg-background rounded-md text-sm border border-border focus:ring-1 focus:ring-foreground outline-none"
                  />
                  <p className="text-[10px] text-foreground/40 mt-1">Order 1 adalah rilis terbaru, tampil paling atas.</p>
                </div>

                <div className="md:col-span-1">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground/60 mb-1.5 block">Tanggal Rilis (DD/MM/YYYY)</label>
                  <input
                    type="text"
                    value={formData.release_date || ""}
                    onChange={(e) => setFormData({ ...formData, release_date: e.target.value })}
                    className="w-full px-3 py-2 bg-background rounded-md text-sm border border-border focus:ring-1 focus:ring-foreground outline-none"
                    placeholder="Contoh: 30/01/2026"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-foreground/60 mb-1.5 block flex justify-between">
                    Image URL (Gambar Pack)
                  </label>
                  <input
                    type="text"
                    value={formData.image_url || ""}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-3 py-2 bg-background rounded-md text-sm border border-border focus:ring-1 focus:ring-foreground outline-none"
                    placeholder="https://asia.pokemon-card.com/id/card-img/products/..."
                  />
                  {formData.image_url && (
                    <div className="mt-3 p-3 bg-muted/40 rounded-lg flex items-center gap-4">
                      <img src={formData.image_url} alt="Icon Set Preview" className="h-16 w-auto object-contain rounded drop-shadow-sm" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      <span className="text-xs text-foreground/50">Image Preview</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-border flex flex-col sm:flex-row items-stretch sm:items-center justify-between bg-muted/20 gap-3">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="justify-center h-[42px] px-6 bg-background border border-border/50 text-foreground hover:bg-muted/30 text-sm rounded-xl flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-sm disabled:opacity-50 order-1 sm:order-3 cursor-pointer"
              >
                {isSaving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />} 
                {isSaving ? 'Menyimpan...' : 'Simpan Data'}
              </button>

              <button
                onClick={() => setIsModalOpen(false)}
                disabled={isSaving}
                className="justify-center h-[42px] px-4 bg-background border border-border/60 hover:border-foreground/40 text-foreground/70 hover:text-foreground hover:bg-muted/30 text-sm rounded-xl flex items-center gap-2 transition-all shadow-sm active:scale-95 order-2 sm:order-2 cursor-pointer"
              >
                Batal
              </button>

              {editingId ? (
                <button
                  onClick={() => handleDelete(editingId)}
                  disabled={isSaving}
                  className="justify-center h-[42px] px-4 bg-red-500/10 text-red-600 text-sm rounded-xl flex items-center gap-2 hover:bg-red-500/20 active:scale-95 transition-all shadow-sm order-3 sm:order-1 sm:mr-auto cursor-pointer"
                >
                  <Trash2 size={16} /> Hapus
                </button>
              ) : <div className="hidden sm:block order-3 sm:order-1 sm:mr-auto"></div>}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
