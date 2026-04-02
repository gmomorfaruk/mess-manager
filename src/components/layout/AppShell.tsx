"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import Sidebar from "@/components/layout/Sidebar";
import MobileHeader from "@/components/layout/MobileHeader";
import { PageLoader } from "@/components/ui/Spinner";

export default function AppShell({
  children,
  requiredRoles,
}: {
  children: React.ReactNode;
  requiredRoles?: string[];
}) {
  const router = useRouter();
  const { user, member, loading } = useAuth();
  const [messName, setMessName] = useState<string | undefined>(undefined);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/login");
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!member?.mess_id) {
      setMessName(undefined);
      return;
    }

    supabase
      .from("messes")
      .select("name")
      .eq("id", member.mess_id)
      .maybeSingle()
      .then(({ data }) => {
        setMessName(data?.name);
      });
  }, [member?.mess_id]);

  useEffect(() => {
    if (!loading && user && requiredRoles && member && !requiredRoles.includes(member.role)) {
      router.replace("/dashboard");
    }
  }, [loading, user, member, requiredRoles, router]);

  if (loading) return <PageLoader />;
  if (!user) return <PageLoader />;

  return (
    <div className="flex min-h-screen bg-surface-50">
      <div className="hidden lg:flex">
        <Sidebar messName={messName} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <MobileHeader messName={messName} />
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {children}
        </main>
      </div>
    </div>
  );
}
