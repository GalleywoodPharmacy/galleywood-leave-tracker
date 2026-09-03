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

  // NOTE: `date` is still this table's primary key (a deliberate, documented
  // gap left for Phase 2c — see the schema comment), so this upsert is only
  // safe while there's a single organization in production: once there's
  // more than one, two organizations picking the same custom closed date
  // would collide and overwrite each other's label.
  const created = await prisma.extraClosedDate.upsert({
    where: { date: new Date(parsed.data.date) },
    update: { label: parsed.data.label },
    create: { date: new Date(parsed.data.date), label: parsed.data.label, organizationId: session.user.organizationId },
  });

  return NextResponse.json({ date: created }, { status: 201 });
}