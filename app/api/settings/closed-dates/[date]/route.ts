import { NextResponse } from "next/server";
import { requireManager } from "@/lib/require-manager";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: { date: string } }) {
  const check = await requireManager();
  if (check instanceof NextResponse) return check;
  const session = check;
  if (!session.user.organizationId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const date = decodeURIComponent(params.date);
  await prisma.extraClosedDate
    .deleteMany({ where: { date: new Date(date), organizationId: session.user.organizationId } })
    .catch(() => null);
  return NextResponse.json({ ok: true });
}