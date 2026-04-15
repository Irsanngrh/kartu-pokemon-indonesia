'use client';

import { useState } from 'react';
import { Share2, Check } from 'lucide-react';

export default function DeckShareButton({ deckId, deckName }: { deckId: string; deckName: string }) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const url = `${window.location.origin}/decks/${deckId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers that don't support clipboard API
      window.prompt('Salin link deck berikut:', url);
    }
  };

  return (
    <button
      onClick={handleShare}
      className="flex items-center gap-2 bg-background dark:bg-muted/30 border border-border/50 text-foreground h-[42px] px-5 rounded-xl text-sm hover:bg-muted/50 active:scale-95 transition-all shadow-sm cursor-pointer"
      title={`Bagikan deck "${deckName}"`}
    >
      {copied ? (
        <>
          <Check size={16} />
          Tersalin!
        </>
      ) : (
        <>
          <Share2 size={16} />
          Bagikan
        </>
      )}
    </button>
  );
}
