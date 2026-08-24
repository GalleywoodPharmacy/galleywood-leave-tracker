import { NextResponse } from "next/server";
import { requireSession } from "@/lib/require-manager";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const check = await requireSession();
  if (check instanceof NextResponse) return check;
  const session = check;

  const existing = await prisma.coverageAssignment.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const allowed =
    session.user.isManager || existing.userId === session.user.id || existing.createdById === session.user.id;
  if (!allowed) return NextResponse.json({ error: "Not allowed" }, { status: 403 });

  await prisma.coverageAssignment.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
