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
  // Fail closed, not open: if CRON_SECRET isn't configured at all, this
  // must refuse to run rather than silently becoming a wide-open,
  // unauthenticated endpoint that anyone (a bot, a scanner, anything) could
  // hit and trigger an email blast to every business on the platform.
  if (!secret) {
    console.error("CRON_SECRET is not set - refusing to run the weekly digest.");
    return NextResponse.json({ error: "Not configured" }, { status: 500 });
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Self-defence guard, independent of the schedule/secret being correct:
  // if this genuinely ran within the last 20 hours, don't run again —
  // stops a misfiring or duplicate trigger from actually sending twice,
  // regardless of what caused the extra request.
  const JOB_ID = "weekly-digest";
  const GUARD_HOURS = 20;
  const state = await prisma.cronState.findUnique({ where: { id: JOB_ID } });
  if (state?.lastRanAt) {
    const hoursSinceLastRun = (Date.now() - state.lastRanAt.getTime()) / (1000 * 60 * 60);
    if (hoursSinceLastRun < GUARD_HOURS) {
      return NextResponse.json({ ok: true, skipped: true, reason: "Ran too recently" });
    }
  }
  // Claim the run immediately, before doing any of the actual work, so a
  // near-simultaneous second request sees this and skips too.
  await prisma.cronState.upsert({
    where: { id: JOB_ID },
    update: { lastRanAt: new Date() },
    create: { id: JOB_ID, lastRanAt: new Date() },
  });

  const now = new Date();
  const in14Days = new Date(now);
  in14Days.setUTCDate(in14Days.getUTCDate() + 14);

  const organizations = await prisma.organization.findMany({ select: { id: true, name: true } });

  let totalRecipientsNotified = 0;

  for (const org of organizations) {
    // Every staff member gets this now, not just managers — so anyone can
    // spot and volunteer for an uncovered day, not just whoever reviews
    // requests.
    const [recipients, upcomingApproved, needsCoverage] = await Promise.all([
      prisma.user.findMany({ where: { organizationId: org.id, isDemo: false }, select: { email: true } }),
      prisma.leaveRequest.findMany({
        where: { organizationId: org.id, status: "approved", startDate: { lte: in14Days }, endDate: { gte: now } },
        include: { user: { select: { name: true } } },
        orderBy: { startDate: "asc" },
      }),
      getNeedsCoverage(org.id, 14),
    ]);

    if (recipients.length === 0) continue;

    await sendWeeklyDigestEmail({
      recipientEmails: recipients.map((r) => r.email),
      organizationName: org.name,
      upcomingApproved: upcomingApproved.map((r) => ({
        name: r.user.name,
        startDate: r.startDate,
        endDate: r.endDate,
      })),
      coverageGapDates: needsCoverage.map((d) => d.date),
    });

    totalRecipientsNotified += recipients.length;
  }

  return NextResponse.json({ ok: true, organizationsProcessed: organizations.length, recipientsNotified: totalRecipientsNotified });
}