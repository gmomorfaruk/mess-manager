import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // No-auth mode: allow all routes and keep middleware lightweight.
  return NextResponse.next({ request });
}
