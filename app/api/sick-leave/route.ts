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
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: "Start date must be on or before end date",
    path: ["endDate"],
  });

export async function POST(req: Request) {
  const check = await requireManager();
  if (check instanceof NextResponse) return check;
  const session = check;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const { userId, startDate, endDate, notes } = parsed.data;

  const staffMember = await prisma.user.findUnique({ where: { id: userId }, select: { id: true } });
  if (!staffMember) {
    return NextResponse.json({ error: "That staff member wasn't found." }, { status: 400 });
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const hours = await computeHoursForRangeForUser(userId, start, end);

  if (hours <= 0) {
    return NextResponse.json(
      { error: "That date range has no open hours to record (all closed days)." },
      { status: 400 }
    );
  }

  const request = await prisma.leaveRequest.create({
    data: {
      userId,
      type: "sick",
      startDate: start,
      endDate: end,
      hours,
      notes: notes || null,
      status: "approved",
      decidedById: session.user.id,
      decidedAt: new Date(),
    },
  });

  return NextResponse.json({ request }, { status: 201 });
}