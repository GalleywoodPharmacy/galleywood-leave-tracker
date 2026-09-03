import { NextResponse } from "next/server";
import { z } from "zod";
import { requireManager } from "@/lib/require-manager";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const check = await requireManager();
  if (check instanceof NextResponse) return check;
  const session = check;
  if (!session.user.organizationId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const dates = await prisma.extraClosedDate.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { date: "asc" },
  });
  return NextResponse.json({ dates });
}

const schema = z.object({ date: z.string(), label: z.string().min(1) });

export async function POST(req: Request) {
  const check = await requireManager();
  if (check instanceof NextResponse) return check;
  const session = check;
  if (!session.user.organizationId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid closed date" }, { status: 400 });

  const created = await prisma.extraClosedDate.upsert({
    where: {
      organizationId_date: { organizationId: session.user.organizationId, date: new Date(parsed.data.date) },
    },
    update: { label: parsed.data.label },
    create: { date: new Date(parsed.data.date), label: parsed.data.label, organizationId: session.user.organizationId },
  });

  return NextResponse.json({ date: created }, { status: 201 });
}