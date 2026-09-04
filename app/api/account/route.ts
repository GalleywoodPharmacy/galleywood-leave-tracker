import { NextResponse } from "next/server";
import { z } from "zod";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/password";

const schema = z.object({
  email: z.string().email(),
  currentPassword: z.string().min(1, "Enter your current password"),
  newPassword: z.string().min(8, "New password must be at least 8 characters").optional(),
});

export async function PATCH(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (!user.passwordHash) {
    return NextResponse.json({ error: "This account has no password set yet — ask a manager for help." }, { status: 400 });
  }

  const valid = await verifyPassword(parsed.data.currentPassword, user.passwordHash);
  if (!valid) {
    return NextResponse.json({ error: "Current password is incorrect." }, { status: 400 });
  }

  const normalizedEmail = parsed.data.email.toLowerCase().trim();
  if (normalizedEmail !== user.email) {
    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) {
      return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
    }
  }

  const updateData: { email: string; passwordHash?: string } = { email: normalizedEmail };
  if (parsed.data.newPassword) {
    updateData.passwordHash = await hashPassword(parsed.data.newPassword);
  }

  await prisma.user.update({ where: { id: session.user.id }, data: updateData });

  return NextResponse.json({ ok: true });
}