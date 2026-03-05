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
    <div className="min-h-screen bg-muted/20 pb-20 pt-8">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8">
        {children}
      </div>
    </div>
  );
}