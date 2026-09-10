import { NextResponse } from "next/server";
import { z } from "zod";
import { requireManager } from "@/lib/require-manager";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const check = await requireManager();
  if (check instanceof NextResponse) return check;
  const session = check;
  if (!session.user.organizationId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const [location, organization] = await Promise.all([
    prisma.workplaceLocation.findUnique({ where: { organizationId: session.user.organizationId } }),
    prisma.organization.findUniqueOrThrow({
      where: { id: session.user.organizationId },
      select: { timeClockEnabled: true },
    }),
  ]);

  return NextResponse.json({ location, timeClockEnabled: organization.timeClockEnabled });
}

const schema = z.object({
  timeClockEnabled: z.boolean(),
  name: z.string().min(1).optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  radiusMeters: z.number().int().min(10).max(5000),
});

export async function PATCH(req: Request) {
  const check = await requireManager();
  if (check instanceof NextResponse) return check;
  const session = check;
  if (!session.user.organizationId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const organizationId = session.user.organizationId;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid location" }, { status: 400 });
  }

  const [location] = await prisma.$transaction([
    prisma.workplaceLocation.upsert({
      where: { organizationId },
      update: {
        name: parsed.data.name ?? undefined,
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        radiusMeters: parsed.data.radiusMeters,
      },
      create: {
        organizationId,
        name: parsed.data.name ?? "Workplace",
        latitude: parsed.data.latitude,
        longitude: parsed.data.longitude,
        radiusMeters: parsed.data.radiusMeters,
      },
    }),
    prisma.organization.update({
      where: { id: organizationId },
      data: { timeClockEnabled: parsed.data.timeClockEnabled },
    }),
  ]);

  return NextResponse.json({ location, timeClockEnabled: parsed.data.timeClockEnabled });
}