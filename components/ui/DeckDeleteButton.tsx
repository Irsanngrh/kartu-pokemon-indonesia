'use client';

import { useState } from 'react';
import { Trash2, Loader2 } from 'lucide-react';
import { deleteDeck } from '@/app/actions/decks';
import { useRouter } from 'next/navigation';

export default function DeckDeleteButton({ deckId }: { deckId: string }) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsDeleting(true);
    const { success } = await deleteDeck(deckId);
    if (success) {
      router.push('/decks');
    } else {
      setIsDeleting(false);
      setConfirmDelete(false);
      alert('Gagal menghapus deck.');
    }
  };

  return (
    <>
      <button
        onClick={() => setConfirmDelete(true)}
        className="flex items-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500/20 h-[42px] px-5 rounded-xl text-sm transition-all shadow-sm hover:scale-105 active:scale-95 duration-200"
        title="Hapus Deck"
      >
        <Trash2 size={16} />
        <span>Hapus</span>
      </button>

      {confirmDelete && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
          <div className="bg-background w-full max-w-sm rounded-2xl shadow-2xl border border-border p-6 flex flex-col gap-5 animate-in fade-in zoom-in-95">
            <div className="flex flex-col gap-2 text-left">
              <h3 className="text-lg font-semibold text-foreground">Hapus Deck</h3>
              <p className="text-sm text-foreground/60">Apakah Anda yakin ingin menghapus deck ini? Tindakan ini tidak bisa dibatalkan.</p>
            </div>
            <div className="flex items-center justify-end gap-3">
              <button 
                onClick={() => setConfirmDelete(false)} 
                disabled={isDeleting}
                className="px-4 py-2 text-sm text-foreground/60 hover:text-foreground transition-colors"
              >
                Batal
              </button>
              <button 
                onClick={handleDelete} 
                disabled={isDeleting}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-red-500 text-white rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {isDeleting ? <Loader2 size={14} className="animate-spin" /> : "Hapus"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
