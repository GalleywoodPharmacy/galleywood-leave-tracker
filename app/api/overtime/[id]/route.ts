import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  hours: z.number().positive().max(24).optional(),
  notes: z.string().max(2000).optional(),
});

async function checkAccess(id: string) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.organizationId) {
    return { error: NextResponse.json({ error: "Not signed in" }, { status: 401 }) } as const;
  }
  const organizationId = session.user.organizationId;

  const existing = await prisma.overtimeEntry.findFirst({ where: { id, organizationId } });
  if (!existing) {
    return { error: NextResponse.json({ error: "Entry not found" }, { status: 404 }) } as const;
  }
  if (existing.userId !== session.user.id && !session.user.isManager) {
    return { error: NextResponse.json({ error: "Not allowed" }, { status: 403 }) } as const;
  }

  return { existing } as const;
}

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const check = await checkAccess(params.id);
  if ("error" in check) return check.error;

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid update" }, { status: 400 });
  }

  const entry = await prisma.overtimeEntry.update({
    where: { id: params.id },
    data: {
      ...(parsed.data.hours !== undefined ? { hours: parsed.data.hours } : {}),
      ...(parsed.data.notes !== undefined ? { notes: parsed.data.notes || null } : {}),
    },
  });
  return NextResponse.json({ entry });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const check = await checkAccess(params.id);
  if ("error" in check) return check.error;

  await prisma.overtimeEntry.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}