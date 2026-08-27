import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNeedsCoverage } from "@/lib/coverage";
import { sendWeeklyDigestEmail } from "@/lib/email";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (secret) {
    const auth = req.headers.get("authorization");
    if (auth !== `Bearer ${secret}`) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const now = new Date();
  const in14Days = new Date(now);
  in14Days.setUTCDate(in14Days.getUTCDate() + 14);

  const [managers, upcomingApproved, needsCoverage] = await Promise.all([
    prisma.user.findMany({ where: { isManager: true }, select: { email: true } }),
    prisma.leaveRequest.findMany({
      where: { status: "approved", startDate: { lte: in14Days }, endDate: { gte: now } },
      include: { user: { select: { name: true } } },
      orderBy: { startDate: "asc" },
    }),
    getNeedsCoverage(14),
  ]);

  await sendWeeklyDigestEmail({
    managerEmails: managers.map((m) => m.email),
    upcomingApproved: upcomingApproved.map((r) => ({
      name: r.user.name,
      startDate: r.startDate,
      endDate: r.endDate,
    })),
    coverageGapDates: needsCoverage.map((d) => d.date),
  });

  return NextResponse.json({ ok: true, managersNotified: managers.length });
}