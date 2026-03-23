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
    <div className="pb-20 pt-8">
      {children}
    </div>
  );
}
