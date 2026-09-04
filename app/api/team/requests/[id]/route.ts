import { NextResponse } from "next/server";
import { z } from "zod";
import { requireManager } from "@/lib/require-manager";
import { prisma } from "@/lib/prisma";
import { getBalance, computeHoursForRangeForUser, getOrgBranding } from "@/lib/leave";
import { sendLeaveDecisionEmail, sendLeaveCancelledByManagerEmail, sendLeaveAmendedEmail } from "@/lib/email";

const decideSchema = z.object({ action: z.literal("decide"), decision: z.enum(["approved", "denied"]) });
const cancelSchema = z.object({ action: z.literal("cancel") });
const editSchema = z.object({
  action: z.literal("edit"),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  hours: z.number().positive().optional(),
  notes: z.string().max(2000).optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const check = await requireManager();
  if (check instanceof NextResponse) return check;
  const session = check;
  if (!session.user.organizationId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const organizationId = session.user.organizationId;

  const existing = await prisma.leaveRequest.findFirst({
    where: { id: params.id, organizationId },
    include: { user: true },
  });
  if (!existing) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  const branding = await getOrgBranding(organizationId);

  const body = await req.json().catch(() => ({}));

  const decide = decideSchema.safeParse(body);
  if (decide.success) {
    if (existing.status !== "pending") {
      return NextResponse.json({ error: "Only pending requests can be approved or declined" }, { status: 400 });
    }
    const updated = await prisma.leaveRequest.update({
      where: { id: params.id },
      data: { status: decide.data.decision, decidedAt: new Date(), decidedById: session.user.id },
    });
    await sendLeaveDecisionEmail({
      requesterEmail: existing.user.email,
      organizationName: branding.name,
      requesterName: existing.user.name,
      status: decide.data.decision,
      startDate: existing.startDate,
      endDate: existing.endDate,
    });
    return NextResponse.json({ request: updated });
  }

  const cancel = cancelSchema.safeParse(body);
  if (cancel.success) {
    if (existing.status !== "pending" && existing.status !== "approved") {
      return NextResponse.json({ error: "Only pending or approved requests can be cancelled" }, { status: 400 });
    }
    const updated = await prisma.leaveRequest.update({ where: { id: params.id }, data: { status: "cancelled" } });
    await sendLeaveCancelledByManagerEmail({
      requesterEmail: existing.user.email,
      organizationName: branding.name,
      requesterName: existing.user.name,
      startDate: existing.startDate,
      endDate: existing.endDate,
    });
    return NextResponse.json({ request: updated });
  }

  const edit = editSchema.safeParse(body);
  if (edit.success) {
    const startDate = edit.data.startDate ? new Date(edit.data.startDate) : existing.startDate;
    const endDate = edit.data.endDate ? new Date(edit.data.endDate) : existing.endDate;

    if (startDate > endDate) {
      return NextResponse.json({ error: "Start date must be on or before end date" }, { status: 400 });
    }

    const hours =
      edit.data.hours ??
      (edit.data.startDate || edit.data.endDate
        ? await computeHoursForRangeForUser(existing.userId, startDate, endDate, organizationId)
        : existing.hours);

    if (existing.type === "annual" && (existing.status === "pending" || existing.status === "approved")) {
      const balance = await getBalance(existing.userId, startDate.getUTCFullYear(), organizationId, existing.id);
      if (hours > balance.remainingHours) {
        return NextResponse.json(
          { error: `That change needs ${hours}h but only ${balance.remainingHours}h remain for ${startDate.getUTCFullYear()}.` },
          { status: 400 }
        );
      }
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: params.id },
      data: {
        startDate,
        endDate,
        hours,
        notes: edit.data.notes !== undefined ? edit.data.notes || null : existing.notes,
        // Editing and saving a sick leave entry is how a manager confirms
        // its real end date, so it's no longer "unconfirmed" once saved.
        ...(existing.type === "sick" ? { openEnded: false } : {}),
      },
    });
    await sendLeaveAmendedEmail({
      requesterEmail: existing.user.email,
      organizationName: branding.name,
      requesterName: existing.user.name,
      startDate,
      endDate,
      hours,
    });
    return NextResponse.json({ request: updated });
  }

  return NextResponse.json({ error: "Unrecognised action" }, { status: 400 });
}