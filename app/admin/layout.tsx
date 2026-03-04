import { createClient } from "@/utils/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const adminEmailsString = process.env.ADMIN_EMAILS || "";
  const adminEmailsList = adminEmailsString.split(",").map(email => email.trim());

  if (!user || !adminEmailsList.includes(user.email || "")) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-muted/20 pb-20">
      <header className="bg-foreground text-background py-4 px-6 md:px-8 shadow-sm flex items-center justify-between sticky top-0 z-40 rounded-b-2xl mb-6">
        <h1 className="font-extrabold text-xl tracking-tight flex items-center gap-2"><span>🛠️</span> Admin Workspace</h1>
      </header>
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        {children}
      </div>
    </div>
  );
}