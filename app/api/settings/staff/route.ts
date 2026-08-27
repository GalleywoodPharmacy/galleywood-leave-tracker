import { NextResponse } from "next/server";
import { z } from "zod";
import { requireManager } from "@/lib/require-manager";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";

export async function GET() {
  const check = await requireManager();
  if (check instanceof NextResponse) return check;

  const staff = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: {
      id: true,
      name: true,
      email: true,
      isManager: true,
      allowanceAnnualHours: true,
    },
  });
  return NextResponse.json({ staff });
}

const createSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
  isManager: z.boolean().default(false),
  allowanceAnnualHours: z.number().nonnegative().default(200),
  startDate: z.string().optional(),
});

export async function POST(req: Request) {
  const check = await requireManager();
  if (check instanceof NextResponse) return check;

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid staff details" }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email.toLowerCase().trim() } });
  if (existing) return NextResponse.json({ error: "That email is already in use." }, { status: 409 });

  const passwordHash = await hashPassword(parsed.data.password);

  const user = await prisma.user.create({
    data: {
      name: parsed.data.name,
      email: parsed.data.email.toLowerCase().trim(),
      passwordHash,
      isManager: parsed.data.isManager,
      allowanceAnnualHours: parsed.data.allowanceAnnualHours,
      startDate: parsed.data.startDate ? new Date(parsed.data.startDate) : undefined,
    },
    select: { id: true, name: true, email: true, isManager: true },
  });

  return NextResponse.json({ user }, { status: 201 });
}