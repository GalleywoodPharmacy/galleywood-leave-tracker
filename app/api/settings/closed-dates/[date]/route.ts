import { NextResponse } from "next/server";
import { requireManager } from "@/lib/require-manager";
import { prisma } from "@/lib/prisma";

export async function DELETE(_req: Request, { params }: { params: { date: string } }) {
  const check = await requireManager();
  if (check instanceof NextResponse) return check;

  const date = decodeURIComponent(params.date);
  await prisma.extraClosedDate.delete({ where: { date: new Date(date) } }).catch(() => null);
  return NextResponse.json({ ok: true });
}
