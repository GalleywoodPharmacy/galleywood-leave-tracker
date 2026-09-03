import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getNeedsCoverage } from "@/lib/coverage";
import { sendWeeklyDigestEmail } from "@/lib/email";

/**
 * Triggered by Vercel Cron (see vercel.json) — Mondays 07:00 UTC.
 * Protected with CRON_SECRET so it can't be hit by anyone who finds the URL;
 * Vercel Cron sends this automatically as a Bearer token when configured.
 */
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

  const organizations = await prisma.organization.findMany({ select: { id: true } });

  let totalManagersNotified = 0;

  for (const org of organizations) {
    const [managers, upcomingApproved, needsCoverage] = await Promise.all([
      prisma.user.findMany({ where: { isManager: true, organizationId: org.id }, select: { email: true } }),
      prisma.leaveRequest.findMany({
        where: { organizationId: org.id, status: "approved", startDate: { lte: in14Days }, endDate: { gte: now } },
        include: { user: { select: { name: true } } },
        orderBy: { startDate: "asc" },
      }),
      getNeedsCoverage(org.id, 14),
    ]);

    if (managers.length === 0) continue;

    await sendWeeklyDigestEmail({
      managerEmails: managers.map((m) => m.email),
      upcomingApproved: upcomingApproved.map((r) => ({
        name: r.user.name,
        startDate: r.startDate,
        endDate: r.endDate,
      })),
      coverageGapDates: needsCoverage.map((d) => d.date),
    });

    totalManagersNotified += managers.length;
  }

  return NextResponse.json({ ok: true, organizationsProcessed: organizations.length, managersNotified: totalManagersNotified });
}