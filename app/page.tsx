import LibraryView from "@/components/views/LibraryView";
import { fetchCardsBasedOnFilters, fetchFilterOptions } from "@/app/actions/cards.fetch";

export const revalidate = 3600;

export default async function HomePage() {
  const initialData = await fetchCardsBasedOnFilters({}, 0, 30);
  const filterOptions = await fetchFilterOptions("Semua");

  if (initialData.error) return <div className="p-10 text-center text-red-500">Gagal memuat database: {initialData.error}</div>;

  return (
    <LibraryView 
      initialCards={initialData.cards} 
      initialTotalCount={initialData.totalCount} 
      initialFilterOptions={filterOptions} 
    />
  );
}
