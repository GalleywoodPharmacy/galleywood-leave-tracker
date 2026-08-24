import { NextResponse } from "next/server";
import { z } from "zod";
import { requireManager } from "@/lib/require-manager";
import { prisma } from "@/lib/prisma";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  isManager: z.boolean().optional(),
  allowanceAnnualHours: z.number().nonnegative().optional(),
  allowanceSickHours: z.number().nonnegative().optional(),
  allowanceOtherHours: z.number().nonnegative().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const check = await requireManager();
  if (check instanceof NextResponse) return check;

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid update" }, { status: 400 });

  // Don't let the last manager demote themselves (or anyone) to zero managers.
  if (parsed.data.isManager === false) {
    const managerCount = await prisma.user.count({ where: { isManager: true } });
    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (target?.isManager && managerCount <= 1) {
      return NextResponse.json({ error: "There must be at least one manager." }, { status: 400 });
    }
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: parsed.data,
    select: {
      id: true,
      name: true,
      email: true,
      isManager: true,
      allowanceAnnualHours: true,
      allowanceSickHours: true,
      allowanceOtherHours: true,
    },
  });
  return NextResponse.json({ user });
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const check = await requireManager();
  if (check instanceof NextResponse) return check;
  const session = check;

  if (params.id === session.user.id) {
    return NextResponse.json({ error: "You can't remove your own account." }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { id: params.id } });
  if (target?.isManager) {
    const managerCount = await prisma.user.count({ where: { isManager: true } });
    if (managerCount <= 1) {
      return NextResponse.json({ error: "There must be at least one manager." }, { status: 400 });
    }
  }

  await prisma.user.delete({ where: { id: params.id } });
  return NextResponse.json({ ok: true });
}
