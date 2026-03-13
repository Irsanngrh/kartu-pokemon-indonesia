import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";
import DeckDashboardView from "@/components/views/DeckDashboardView";
import { getDeckById } from "@/app/actions/decks";

export default async function DeckDashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data?.user) {
    redirect("/");
  }

  return (
    <DeckDashboardView />
  );
}
