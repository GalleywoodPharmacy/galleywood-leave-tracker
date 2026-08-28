import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendLeaveWithdrawnEmail } from "@/lib/email";
import { Prisma } from "@prisma/client";
import type { CoverInfo } from "@/lib/cover";

const withdrawSchema = z.object({ action: z.literal("withdraw") });

const coverInputSchema = z
  .union([
    z.object({ type: z.literal("staff"), userId: z.string() }),
    z.object({ type: z.literal("external"), name: z.string().min(1).max(200) }),
  ])
  .nullable();

const setCoverSchema = z.object({
  action: z.literal("set-cover"),
  scope: z.enum(["day", "period"]),
  date: z.string().optional(),
  cover: coverInputSchema,
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const existing = await prisma.leaveRequest.findUnique({ where: { id: params.id } });
  if (!existing) return NextResponse.json({ error: "Request not found" }, { status: 404 });

  const setCover = setCoverSchema.safeParse(body);
  if (setCover.success) {
    if (existing.userId !== session.user.id && !session.user.isManager) {
      return NextResponse.json({ error: "Not allowed" }, { status: 403 });
    }

    let resolvedCover: CoverInfo | null = null;
    if (setCover.data.cover) {
      if (setCover.data.cover.type === "staff") {
        const userId = setCover.data.cover.userId === "self" ? session.user.id : setCover.data.cover.userId;
        const staffUser = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, name: true } });
        if (!staffUser) {
          return NextResponse.json({ error: "That staff member wasn't found." }, { status: 400 });
        }
        resolvedCover = { type: "staff", userId: staffUser.id, name: staffUser.name };
      } else {
        resolvedCover = { type: "external", name: setCover.data.cover.name };
      }
    }

    if (setCover.data.scope === "day") {
      if (!setCover.data.date) {
        return NextResponse.json({ error: "Missing date for a single-day cover change" }, { status: 400 });
      }
      const currentOverrides = (existing.coverNameByDate as Record<string, CoverInfo> | null) ?? {};
      const newOverrides = { ...currentOverrides };
      if (resolvedCover) {
        newOverrides[setCover.data.date] = resolvedCover;
      } else {
        delete newOverrides[setCover.data.date];
      }
      const updated = await prisma.leaveRequest.update({
        where: { id: params.id },
        data: { coverNameByDate: newOverrides },
      });
      return NextResponse.json({ request: updated });
    }

    const updated = await prisma.leaveRequest.update({
      where: { id: params.id },
      data: { coverName: resolvedCover === null ? Prisma.DbNull : resolvedCover },
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