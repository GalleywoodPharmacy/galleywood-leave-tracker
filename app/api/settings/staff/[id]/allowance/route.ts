import { NextResponse } from "next/server";
import { z } from "zod";
import { requireManager } from "@/lib/require-manager";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  year: z.number().int(),
  hours: z.number().min(0).max(2000),
});

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const check = await requireManager();
  if (check instanceof NextResponse) return check;
  const session = check;
  if (!session.user.organizationId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const organizationId = session.user.organizationId;

  const target = await prisma.user.findFirst({ where: { id: params.id, organizationId } });
  if (!target) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid override" }, { status: 400 });
  }

  const override = await prisma.allowanceOverride.upsert({
    where: { userId_year: { userId: params.id, year: parsed.data.year } },
    update: { hours: parsed.data.hours },
    create: { userId: params.id, year: parsed.data.year, hours: parsed.data.hours, organizationId },
  });

  return NextResponse.json({ override });
}

/** Clears an override, reverting that year back to the automatically calculated figure. Year passed as a query param since DELETE bodies aren't reliably supported. */
export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const check = await requireManager();
  if (check instanceof NextResponse) return check;
  const session = check;
  if (!session.user.organizationId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const organizationId = session.user.organizationId;

  const target = await prisma.user.findFirst({ where: { id: params.id, organizationId } });
  if (!target) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

  const { searchParams } = new URL(req.url);
  const year = parseInt(searchParams.get("year") ?? "", 10);
  if (!year) return NextResponse.json({ error: "Missing year" }, { status: 400 });

  await prisma.allowanceOverride.deleteMany({ where: { userId: params.id, year, organizationId } });
  return NextResponse.json({ ok: true });
}