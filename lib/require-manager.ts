import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "./auth";
import type { Session } from "next-auth";

/**
 * Returns the session if signed in AND is_manager, otherwise returns a
 * NextResponse to send straight back (401/403) — callers do:
 *
 *   const check = await requireManager();
 *   if (check instanceof NextResponse) return check;
 *   const session = check;
 */
export async function requireManager(): Promise<Session | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  if (!session.user.isManager) return NextResponse.json({ error: "Managers only" }, { status: 403 });
  return session;
}

export async function requireSession(): Promise<Session | NextResponse> {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  return session;
}
