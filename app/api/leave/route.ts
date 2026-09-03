import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { computeHoursForRangeForUser, getBalance } from "@/lib/leave";
import { sendLeaveSubmittedEmail } from "@/lib/email";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.organizationId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const requests = await prisma.leaveRequest.findMany({
    where: { userId: session.user.id, organizationId: session.user.organizationId },
    orderBy: { submittedAt: "desc" },
  });

  return NextResponse.json({ requests });
}

const createSchema = z
  .object({
    startDate: z.string(),
    endDate: z.string(),
    hours: z.number().positive().optional(),
    notes: z.string().max(2000).optional(),
  })
  .refine((data) => new Date(data.startDate) <= new Date(data.endDate), {
    message: "Start date must be on or before end date",
    path: ["endDate"],
  });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.organizationId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const organizationId = session.user.organizationId;

  const body = await req.json();
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const { startDate, endDate, notes } = parsed.data;
  const start = new Date(startDate);
  const end = new Date(endDate);

  const autoHours = await computeHoursForRangeForUser(session.user.id, start, end, organizationId);
  const hours = parsed.data.hours ?? autoHours;

  if (hours <= 0) {
    return NextResponse.json(
      { error: "That date range has no open hours to request (all closed days)." },
      { status: 400 }
    );
  }

  const balance = await getBalance(session.user.id, start.getUTCFullYear(), organizationId);
  if (hours > balance.remainingHours) {
    return NextResponse.json(
      { error: `That request needs ${hours}h but only ${balance.remainingHours}h remain for ${start.getUTCFullYear()}.` },
      { status: 400 }
    );
  }

  const request = await prisma.leaveRequest.create({
    data: {
      userId: session.user.id,
      organizationId,
      startDate: start,
      endDate: end,
      hours,
      notes: notes || null,
      status: "pending",
    },
  });

  const managers = await prisma.user.findMany({ where: { isManager: true, organizationId }, select: { email: true } });
  await sendLeaveSubmittedEmail({
    managerEmails: managers.map((m) => m.email),
    requesterName: session.user.name ?? "A staff member",
    startDate: start,
    endDate: end,
    hours,
    requestId: request.id,
  });

  return NextResponse.json({ request }, { status: 201 });
}