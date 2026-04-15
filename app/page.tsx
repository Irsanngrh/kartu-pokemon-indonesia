import LibraryView from "@/components/views/LibraryView";
import { fetchCardsBasedOnFilters, fetchFilterOptions } from "@/app/actions/cards.fetch";

export const revalidate = 3600;

export default async function HomePage({ searchParams }: { searchParams: Promise<{ expansion?: string }> }) {
  const resolvedParams = await searchParams;

  const filterOptions = await fetchFilterOptions({});

  let targetExpansion = "Semua";
  if (resolvedParams.expansion) {
    const found = filterOptions.expansions?.find((e: string) => e.includes(`(${resolvedParams.expansion})`));
    if (found) targetExpansion = found;
  }

  const initialData = await fetchCardsBasedOnFilters(
    { expansionFilter: targetExpansion !== "Semua" ? targetExpansion : undefined },
    0,
    30,
    true
  );

  if (initialData.error) return <div className="p-10 text-center text-red-500">Gagal memuat database: {initialData.error}</div>;

  const firstImageUrl = initialData.cards[0]?.image_url;

  return (
    <>
      {firstImageUrl && (
        <link
          rel="preload"
          as="image"
          href={firstImageUrl}
        />
      )}
      <LibraryView
        initialCards={initialData.cards}
        initialTotalCount={initialData.totalCount}
        initialFilterOptions={filterOptions}
        initialExpansionFilter={targetExpansion}
      />
    </>
  );
}
