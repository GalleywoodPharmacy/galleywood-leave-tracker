import { NextResponse } from "next/server";
import { requirePlatformAdmin } from "@/lib/require-manager";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const check = await requirePlatformAdmin();
  if (check instanceof NextResponse) return check;
  const session = check;

  if (params.id === session.user.organizationId) {
    return NextResponse.json({ error: "You can't delete your own organization." }, { status: 400 });
  }

  // Cascade at the database level (see schema) removes every user, leave
  // request, rota, closed date, blackout period, and overtime entry that
  // belonged to it — this is permanent and can't be undone.
  await prisma.organization.delete({ where: { id: params.id } }).catch(() => null);

  return NextResponse.json({ ok: true });
}