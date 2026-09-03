import { NextResponse } from "next/server";
import { requireManager } from "@/lib/require-manager";
import { prisma } from "@/lib/prisma";
import type { LeaveStatus } from "@prisma/client";

export async function GET(req: Request) {
  const check = await requireManager();
  if (check instanceof NextResponse) return check;
  const session = check;
  if (!session.user.organizationId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status") as LeaveStatus | null; // "pending" | null (= recent activity, any status)
  const limit = status ? undefined : 25;

  const requests = await prisma.leaveRequest.findMany({
    where: { organizationId: session.user.organizationId, ...(status ? { status } : {}) },
    include: { user: { select: { name: true, email: true } }, decidedBy: { select: { name: true } } },
    orderBy: status === "pending" ? { submittedAt: "asc" } : { submittedAt: "desc" },
    take: limit,
  });

  return NextResponse.json({ requests });
}