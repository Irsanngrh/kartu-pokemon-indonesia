import { createClient } from "@/utils/supabase/server";
import DeckDashboardView from "@/components/views/DeckDashboardView";

export const revalidate = 0;

export default async function DeckDashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();

  const user = !error && data?.user ? data.user : null;
  const userName = user?.user_metadata?.full_name || null;

  return (
    <DeckDashboardView userName={userName} isLoggedIn={!!user} />
  );
}
