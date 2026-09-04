import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { sendWelcomeEmail } from "@/lib/email";

const schema = z.object({
  businessName: z.string().min(1),
  managerName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid details" }, { status: 400 });
  }

  const email = parsed.data.email.toLowerCase().trim();

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "That email is already in use." }, { status: 409 });
  }

  const passwordHash = await hashPassword(parsed.data.password);

  // Organization and its first manager are created together, or not at all
  // — an orphaned organization with no user would be unreachable.
  await prisma.$transaction(async (tx) => {
    const organization = await tx.organization.create({ data: { name: parsed.data.businessName } });
    await tx.user.create({
      data: {
        name: parsed.data.managerName,
        email,
        passwordHash,
        isManager: true,
        organizationId: organization.id,
      },
    });
  });

  await sendWelcomeEmail({
    email,
    managerName: parsed.data.managerName,
    organizationName: parsed.data.businessName,
  });

  return NextResponse.json({ ok: true }, { status: 201 });
}