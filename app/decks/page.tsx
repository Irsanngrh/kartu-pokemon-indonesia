import { auth } from "@/auth";
import DeckDashboardView from "@/components/views/DeckDashboardView";

export const revalidate = 0;

export default async function DeckDashboardPage() {
  const session = await auth();
  const user = session?.user ?? null;
  const userName = user?.name || null;

  return (
    <DeckDashboardView userName={userName} isLoggedIn={!!user} />
  );
}
