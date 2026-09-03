import { NextResponse } from "next/server";
import { z } from "zod";
import { requireManager } from "@/lib/require-manager";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const check = await requireManager();
  if (check instanceof NextResponse) return check;
  const session = check;
  if (!session.user.organizationId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const periods = await prisma.extraBlackoutPeriod.findMany({
    where: { organizationId: session.user.organizationId },
    orderBy: { startDate: "asc" },
  });
  return NextResponse.json({ periods });
}

const schema = z
  .object({ label: z.string().min(1), startDate: z.string(), endDate: z.string() })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: "Start date must be on or before end date",
    path: ["endDate"],
  });

export async function POST(req: Request) {
  const check = await requireManager();
  if (check instanceof NextResponse) return check;
  const session = check;
  if (!session.user.organizationId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid blackout period" }, { status: 400 });
  }

  const period = await prisma.extraBlackoutPeriod.create({
    data: {
      label: parsed.data.label,
      startDate: new Date(parsed.data.startDate),
      endDate: new Date(parsed.data.endDate),
      organizationId: session.user.organizationId,
    },
  });

  return NextResponse.json({ period }, { status: 201 });
}