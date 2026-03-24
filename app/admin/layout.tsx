import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const isAdmin = user?.app_metadata?.role === 'admin';
  if (!user || !isAdmin) {
    redirect("/");
  }

  return (
    <div className="pb-20 pt-8">
      {children}
    </div>
  );
}
