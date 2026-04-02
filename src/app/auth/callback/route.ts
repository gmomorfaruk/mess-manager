import { createClient } from "@/lib/supabase/server";
import { autoLinkMember } from "@/lib/autoLink";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");

  if (code) {
    const supabase = createClient();
    const { error, data } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && data.user) {
      // Auto-link user to mess_members by matching email
      if (data.user.email) {
        await autoLinkMember(data.user.id, data.user.email);
      }
      return NextResponse.redirect(`${origin}/`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
