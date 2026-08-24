import { NextResponse } from "next/server";
import { z } from "zod";
import { requireManager } from "@/lib/require-manager";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const check = await requireManager();
  if (check instanceof NextResponse) return check;

  const dates = await prisma.extraClosedDate.findMany({ orderBy: { date: "asc" } });
  return NextResponse.json({ dates });
}

const schema = z.object({ date: z.string(), label: z.string().min(1) });

export async function POST(req: Request) {
  const check = await requireManager();
  if (check instanceof NextResponse) return check;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid closed date" }, { status: 400 });

  const created = await prisma.extraClosedDate.upsert({
    where: { date: new Date(parsed.data.date) },
    update: { label: parsed.data.label },
    create: { date: new Date(parsed.data.date), label: parsed.data.label },
  });

  return NextResponse.json({ date: created }, { status: 201 });
}
