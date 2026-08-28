import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendLeaveWithdrawnEmail } from "@/lib/email";

const withdrawSchema = z.object({ action: z.literal("withdraw") });
const setCoverNameSchema = z.object({ action: z.literal("set-cover-name"), coverName: z.string().max(200) });

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const existing = await prisma.leaveRequest.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  // Set/change who's covering — the request's own owner, or any manager, at
  // any point (not just when the request was first submitted).
  const setCover = setCoverNameSchema.safeParse(body);
  if (setCover.success) {
    if (existing.userId !== session.user.id && !session.user.isManager) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }
    const updated = await prisma.leaveRequest.update({
      where: { id: params.id },
      data: { coverName: setCover.data.coverName || null },
    });
    return NextResponse.json({ request: updated });
  }

  const withdraw = withdrawSchema.safeParse(body);
  if (withdraw.success) {
    if (existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Request not found" }, { status: 404 });
    }
    if (existing.status !== "pending" && existing.status !== "approved") {
      return NextResponse.json({ error: "Only pending or approved requests can be withdrawn" }, { status: 400 });
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: params.id },
      data: { status: "cancelled" },
    });

    const managers = await prisma.user.findMany({ where: { isManager: true }, select: { email: true } });
    await sendLeaveWithdrawnEmail({
      managerEmails: managers.map((m) => m.email),
      requesterName: session.user.name ?? "A staff member",
      startDate: existing.startDate,
      endDate: existing.endDate,
    });

    return NextResponse.json({ request: updated });
  }

  return NextResponse.json({ error: "Unrecognised action" }, { status: 400 });
}