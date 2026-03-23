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
      className="flex items-center gap-2 bg-foreground text-background px-5 py-2.5 rounded-xl text-sm hover:scale-105 transition-transform"
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
