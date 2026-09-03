import { NextResponse } from "next/server";
import { requireManager } from "@/lib/require-manager";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const check = await requireManager();
  if (check instanceof NextResponse) return check;
  const session = check;
  if (!session.user.organizationId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  await prisma.extraBlackoutPeriod
    .deleteMany({ where: { id: params.id, organizationId: session.user.organizationId } })
    .catch(() => null);
  return NextResponse.json({ ok: true });
}