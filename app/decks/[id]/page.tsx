import { createClient } from '@/utils/supabase/server';
import { redirect } from 'next/navigation';
import { getDeckById } from '@/app/actions/decks';
import { getCardsByIds } from '@/app/actions/cards.fetch';
import Link from 'next/link';
import { Layers, Edit, ChevronLeft, CalendarDays } from 'lucide-react';
import DeckShareButton from '@/components/ui/DeckShareButton';
import DeckDeleteButton from '@/components/ui/DeckDeleteButton';

export default async function DeckPreviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const supabase = await createClient();
  const { data: authData } = await supabase.auth.getUser();
  const currentUserId = authData?.user?.id ?? null;

  const { id } = await params;
  const { deck, error: deckError } = await getDeckById(id);

  if (deckError || !deck) {
    return (
      <main className="py-32 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="text-2xl font-bold text-red-500">Deck Tidak Dapat Diakses</h1>
        <p className="text-foreground/70 max-w-lg">
          Ada masalah saat mengambil deck. Detail Error: <br/> 
          <code className="bg-red-500/10 text-red-500 px-2 py-1 rounded mt-2 inline-block">
            {deckError || 'Deck null atau tidak ditemukan'}
          </code>
        </p>
      </main>
    );
  }

  // Only the owner can edit
  const isOwner = currentUserId === deck.user_id;

  const cardIds = deck.cards?.map((c) => c.cardId) ?? [];
  const cardMap = await getCardsByIds(cardIds);

  const totalCards = deck.cards?.reduce((acc, c) => acc + c.quantity, 0) ?? 0;
  const formattedDate = new Date(deck.created_at).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <main className="py-8 flex flex-col gap-8">
      {/* Back */}
      <Link
        href="/decks"
        className="inline-flex items-center gap-2 text-sm font-medium text-foreground/60 hover:text-foreground transition-colors w-fit cursor-pointer"
      >
        <ChevronLeft size={18} /> Kembali ke Deck
      </Link>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-semibold flex items-center gap-2.5">
            <Layers size={24} />
            {deck.name}
          </h1>
          <div className="flex items-center gap-4 text-sm text-foreground/50">
            <span className={totalCards === 60 ? 'text-green-500' : ''}>
              {totalCards} / 60 Kartu
            </span>
            <span className="flex items-center gap-1.5">
              <CalendarDays size={13} /> {formattedDate}
            </span>
          </div>
        </div>

        {isOwner && (
          <div className="flex items-center gap-2">
            <DeckShareButton deckId={id} deckName={deck.name} />
            <Link
              href={`/decks/build?id=${deck.id}`}
              className="flex items-center gap-2 bg-foreground text-background h-[42px] px-5 rounded-xl text-sm transition-all shadow-sm hover:scale-105 active:scale-95 duration-200"
            >
              <Edit size={16} /> Edit Deck
            </Link>
            <DeckDeleteButton deckId={id} />
          </div>
        )}
      </div>

      {/* Card grid grouped by category */}
      {(['Pokemon', 'Trainer', 'Energy'] as const).map((category) => {
        const itemsInCategory = deck.cards?.filter((item) => {
          const c = cardMap[item.cardId];
          if (!c) return category === 'Pokemon';
          const isEnergy =
            c.name.toLowerCase().includes('energi') ||
            c.name.toLowerCase().includes('energy');
          const isTrainer = !c.hp && !c.types?.length && !isEnergy;
          if (category === 'Energy') return isEnergy;
          if (category === 'Trainer') return isTrainer;
          return !isTrainer && !isEnergy;
        }) ?? [];

        if (!itemsInCategory.length) return null;

        const catTotal = itemsInCategory.reduce((a, i) => a + i.quantity, 0);

        return (
          <section key={category}>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-foreground/40 border-b border-border/40 pb-2 mb-4">
              {category} <span className="ml-1 text-foreground/60">({catTotal})</span>
            </h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
              {itemsInCategory.map((item) => {
                const card = cardMap[item.cardId];
                return (
                  <div key={item.cardId} className="flex flex-col items-center gap-1">
                    <div className="relative w-full">
                      {card?.image_url ? (
                        <img
                          src={card.image_url}
                          alt={card?.name ?? ''}
                          className="w-full h-auto rounded-lg shadow-sm border border-border/10"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full aspect-[2/3] rounded-lg bg-muted flex items-center justify-center text-foreground/30 text-[10px]">
                          {card?.name ?? '—'}
                        </div>
                      )}
                      {item.quantity > 1 && (
                        <span className="absolute top-1 right-1 bg-foreground text-background text-[10px] w-5 h-5 flex items-center justify-center rounded-full font-semibold shadow">
                          {item.quantity}
                        </span>
                      )}
                    </div>
                    <p className="text-[10px] text-foreground/60 text-center leading-tight line-clamp-2 w-full">
                      {card?.name ?? '—'}
                    </p>
                  </div>
                );
              })}
            </div>
          </section>
        );
      })}
    </main>
  );
}
