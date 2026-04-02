import { createClient } from "@/lib/supabase/server";

/**
 * Auto-links a signed-in user to a mess_members record
 * if the member was pre-added by admin with matching email.
 */
export async function autoLinkMember(userId: string, email: string) {
  const supabase = createClient();

  // Check if already linked
  const { data: existing } = await supabase
    .from("mess_members")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();

  if (existing) return; // Already linked

  // Find unlinked member with matching email
  const { data: unlinked } = await supabase
    .from("mess_members")
    .select("id")
    .eq("email", email)
    .is("user_id", null)
    .maybeSingle();

  if (unlinked) {
    await supabase
      .from("mess_members")
      .update({ user_id: userId })
      .eq("id", unlinked.id);
  }
}
