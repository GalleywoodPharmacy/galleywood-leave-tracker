import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (body.action !== "withdraw") {
    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  }

  const existing = await prisma.leaveRequest.findUnique({ where: { id: params.id } });
  if (!existing || existing.userId !== session.user.id) {
    return NextResponse.json({ error: "Request not found" }, { status: 404 });
  }

  if (existing.status !== "pending" && existing.status !== "approved") {
    return NextResponse.json({ error: "Only pending or approved requests can be withdrawn" }, { status: 400 });
  }

  const updated = await prisma.leaveRequest.update({
    where: { id: params.id },
    data: { status: "cancelled" },
  });

  return NextResponse.json({ request: updated });
}
