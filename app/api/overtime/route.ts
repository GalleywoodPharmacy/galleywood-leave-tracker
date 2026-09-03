import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const createSchema = z.object({
  date: z.string(),
  hours: z.number().positive().max(24),
  notes: z.string().max(2000).optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.organizationId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const entry = await prisma.overtimeEntry.create({
    data: {
      userId: session.user.id,
      organizationId: session.user.organizationId,
      date: new Date(parsed.data.date),
      hours: parsed.data.hours,
      notes: parsed.data.notes || null,
    },
  });

  return NextResponse.json({ entry }, { status: 201 });
}