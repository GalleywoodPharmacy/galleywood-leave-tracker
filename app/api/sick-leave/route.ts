import { NextResponse } from "next/server";
import { z } from "zod";
import { requireManager } from "@/lib/require-manager";
import { prisma } from "@/lib/prisma";
import { computeHoursForRangeForUser } from "@/lib/leave";

const createSchema = z
  .object({
    userId: z.string().min(1),
    startDate: z.string(),
    endDate: z.string(),
    notes: z.string().max(2000).optional(),
    openEnded: z.boolean().optional(),
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: "Start date must be on or before end date",
    path: ["endDate"],
  });

export async function POST(req: Request) {
  const check = await requireManager();
  if (check instanceof NextResponse) return check;
  const session = check;
  if (!session.user.organizationId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const organizationId = session.user.organizationId;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const { userId, startDate, endDate, notes, openEnded } = parsed.data;

  const staffMember = await prisma.user.findFirst({ where: { id: userId, organizationId }, select: { id: true } });
  if (!staffMember) {
    return NextResponse.json({ error: "That staff member wasn't found." }, { status: 400 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const hours = await computeHoursForRangeForUser(userId, start, end, organizationId);

  if (hours <= 0) {
    return NextResponse.json(
      { error: "That date range has no open hours to record (all closed days)." },
      { status: 400 }
    );
  }

  const request = await prisma.leaveRequest.create({
    data: {
      userId,
      organizationId,
      type: "sick",
      startDate: start,
      endDate: end,
      hours,
      notes: notes || null,
      openEnded: openEnded ?? false,
      status: "approved",
      decidedById: session.user.id,
      decidedAt: new Date(),
    },
  });

  return NextResponse.json({ request }, { status: 201 });
}