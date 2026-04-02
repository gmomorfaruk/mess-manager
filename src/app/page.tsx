import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export default async function HomePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  // Check if user has a mess membership
  const { data: member } = await supabase
    .from("mess_members")
    .select("role, mess_id")
    .eq("user_id", user.id)
    .eq("is_active", true)
    .maybeSingle();

  if (!member) {
    // New user - go to onboarding/setup
    redirect("/setup");
  }

  redirect("/dashboard");
}
