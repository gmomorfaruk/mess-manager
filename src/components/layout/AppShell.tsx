import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Sidebar from "@/components/layout/Sidebar";
import MobileHeader from "@/components/layout/MobileHeader";

export default async function AppShell({
  children,
  requiredRoles,
}: {
  children: React.ReactNode;
  requiredRoles?: string[];
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: member } = await supabase
    .from("mess_members")
    .select("*, messes(name)")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!member) redirect("/setup");

  if (requiredRoles && !requiredRoles.includes(member.role)) {
    redirect("/dashboard");
  }

  const messName = (member as any).messes?.name;

  return (
    <div className="flex min-h-screen bg-surface-50">
      {/* Desktop sidebar */}
      <div className="hidden lg:flex">
        <Sidebar messName={messName} />
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader messName={messName} />
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
