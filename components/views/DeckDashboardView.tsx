'use client';

import { useEffect, useState } from 'react';
import { Deck } from '@/types';
import { getUserDecks } from '@/app/actions/decks';
import { getCardsByIds } from '@/app/actions/cards.fetch';
import { PokemonCard } from '@/types';
import Link from 'next/link';
import { Layers, Plus, Trash2, CalendarDays, Loader2, Info } from 'lucide-react';

// Simple preview: show first card image as thumbnail
function DeckThumbnail({ deck }: { deck: Deck }) {
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!deck.cards?.length) return;
    const firstId = deck.cards[0].cardId;
    getCardsByIds([firstId]).then((map) => {
      const card = map[firstId];
      if (card?.image_url) setImageUrl(card.image_url);
    });
  }, [deck.id]);

  if (!imageUrl) {
    return (
      <div className="w-full aspect-[63/88] rounded-xl bg-muted/50 border border-border/50 flex items-center justify-center">
        <Layers size={28} className="text-foreground/15" />
      </div>
    );
  }

  return (
    <img
      src={imageUrl}
      alt={deck.name}
      loading="lazy"
      className="w-full aspect-[63/88] object-cover rounded-xl border border-border/50"
    />
  );
}

export default function DeckDashboardView({ userName, isLoggedIn }: { userName: string | null, isLoggedIn: boolean }) {
  const [decks, setDecks] = useState<Deck[]>([]);
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    if (isLoggedIn) fetchDecks();
    else setLoading(false);
  }, [isLoggedIn]);

  const fetchDecks = async () => {
    setLoading(true);
    const { decks: fetchedDecks } = await getUserDecks();
    setDecks(fetchedDecks);
    setLoading(false);
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  return (
    <main className="flex flex-col text-foreground py-8">
      {/* Toast */}
      {toastMessage && (
        <div className="fixed top-20 sm:top-24 left-1/2 -translate-x-1/2 z-[100] w-[90%] sm:w-fit max-w-[360px] sm:max-w-none bg-foreground text-background px-4 sm:px-6 py-3 sm:py-3.5 rounded-2xl sm:rounded-full shadow-2xl text-[13px] sm:text-sm flex items-center justify-center sm:justify-start gap-3 animate-in fade-in slide-in-from-top-4">
          <Info size={18} className="text-background shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      <div className="w-full">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-border/40">
          <div>
            <h1 className="text-2xl font-semibold mb-1 flex items-center gap-2.5">
              <Layers size={26} />
              Deck {userName || 'Saya'}
            </h1>
            <p className="text-foreground/50 text-sm">Kelola dan rancang deck dengan 60 kartu terbaikmu.</p>
          </div>
          {isLoggedIn && (
            <Link
              href="/decks/build"
              className="flex items-center gap-2 bg-foreground text-background h-[42px] px-5 rounded-xl text-sm transition-all duration-200 shadow-sm hover:scale-105 active:scale-95"
            >
              <Plus size={18} />
              Buat Deck Baru
            </Link>
          )}
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-foreground/40 mb-4" />
            <p className="text-foreground/40 text-sm">Memuat daftar deck…</p>
          </div>
        ) : decks.length === 0 ? (
          <div className="col-span-full py-20 flex flex-col items-center justify-center gap-3">
            <Layers size={36} className="text-foreground/30" />
            <p className="text-foreground/50 text-sm uppercase tracking-widest">{isLoggedIn ? 'Belum ada deck' : 'Login untuk menambahkan deck'}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-5">
            {decks.map((deck) => {
              const totalCards = deck.cards?.reduce((acc, c) => acc + c.quantity, 0) ?? 0;
              const isComplete = totalCards === 60;
              const formattedDate = new Date(deck.created_at).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              });

              return (
                <Link
                  key={deck.id}
                  href={`/decks/${deck.id}`}
                  className="group relative flex flex-col h-full bg-muted/40 rounded-[20px] border border-border/40 backdrop-blur-sm p-2 sm:p-2.5 gap-3 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-md"
                >
                  {/* Thumbnail */}
                  <DeckThumbnail deck={deck} />

                  {/* Info */}
                  <div className="flex flex-col gap-1 px-1 pb-1">
                    <h3 className="text-xs sm:text-sm font-semibold line-clamp-1 leading-tight">{deck.name}</h3>
                    <div className="flex items-center justify-between text-[10px] text-foreground/40">
                      <span className={`font-medium ${isComplete ? 'text-green-500' : ''}`}>
                        {totalCards}/60
                      </span>
                      <span className="flex items-center gap-1">
                        <CalendarDays size={10} />
                        {formattedDate}
                      </span>
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
