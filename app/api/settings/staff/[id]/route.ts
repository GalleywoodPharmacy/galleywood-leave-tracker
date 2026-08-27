import { NextResponse } from "next/server";
import { z } from "zod";
import { requireManager } from "@/lib/require-manager";
import { prisma } from "@/lib/prisma";
import { computeStatutoryAnnualHoursForUser } from "@/lib/leave";
import { hashPassword } from "@/lib/password";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const check = await requireManager();
  if (check instanceof NextResponse) return check;

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? String(new Date().getFullYear()), 10);

  const suggestedAnnualHours = await computeStatutoryAnnualHoursForUser(params.id, year);
  return NextResponse.json({ suggestedAnnualHours, year });
}

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  isManager: z.boolean().optional(),
  allowanceAnnualHours: z.number().nonnegative().optional(),
  newPassword: z.string().min(8, "Password must be at least 8 characters").optional(),
  // A date string ("YYYY-MM-DD") sets it; an empty string clears it; omitting
  // the key entirely leaves whatever's already saved untouched.
  startDate: z.string().optional(),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const check = await requireManager();
  if (check instanceof NextResponse) return check;

  const parsed = updateSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid update" }, { status: 400 });
  }

  if (parsed.data.isManager === false) {
    const managerCount = await prisma.user.count({ where: { isManager: true } });
    const target = await prisma.user.findUnique({ where: { id: params.id } });
    if (target?.isManager && managerCount <= 1) {
      return NextResponse.json({ error: "There must be at least one manager." }, { status: 400 });
    }
  }

  const { email, newPassword, startDate, ...rest } = parsed.data;

  const updateData: {
    name?: string;
    isManager?: boolean;
    allowanceAnnualHours?: number;
    email?: string;
    passwordHash?: string;
    startDate?: Date | null;
  } = { ...rest };

  if (email) {
    const normalizedEmail = email.toLowerCase().trim();
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing && existing.id !== params.id) {
      return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
    }
    updateData.email = normalizedEmail;
  }

  if (newPassword) {
    updateData.passwordHash = await hashPassword(newPassword);
  }

  if (startDate !== undefined) {
    updateData.startDate = startDate === "" ? null : new Date(startDate);
  }

  const user = await prisma.user.update({
    where: { id: params.id },
    data: updateData,
    select: {
      id: true,
      name: true,
      email: true,
      isManager: true,
      allowanceAnnualHours: true,
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