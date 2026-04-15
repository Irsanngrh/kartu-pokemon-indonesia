import { auth } from "@/auth";
import { redirect } from "next/navigation";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const isAdmin = session?.user?.isAdmin === true;

  if (!session?.user || !isAdmin) {
    redirect("/");
  }

  return (
    <div className="pb-20 pt-8">
      {children}
    </div>
  );
}
