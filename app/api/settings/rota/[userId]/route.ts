import { NextResponse } from "next/server";
import { z } from "zod";
import { requireManager } from "@/lib/require-manager";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  sun: z.number().nonnegative(),
  mon: z.number().nonnegative(),
  tue: z.number().nonnegative(),
  wed: z.number().nonnegative(),
  thu: z.number().nonnegative(),
  fri: z.number().nonnegative(),
  sat: z.number().nonnegative(),
});

export async function PUT(req: Request, { params }: { params: { userId: string } }) {
  const check = await requireManager();
  if (check instanceof NextResponse) return check;
  const session = check;
  if (!session.user.organizationId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const organizationId = session.user.organizationId;

  const target = await prisma.user.findFirst({ where: { id: params.userId, organizationId }, select: { id: true } });
  if (!target) return NextResponse.json({ error: "Staff member not found" }, { status: 404 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid rota — hours must be 0 or more" }, { status: 400 });

  const { sun, mon, tue, wed, thu, fri, sat } = parsed.data;

  const rota = await prisma.staffRota.upsert({
    where: { userId: params.userId },
    update: {
      sundayHours: sun,
      mondayHours: mon,
      tuesdayHours: tue,
      wednesdayHours: wed,
      thursdayHours: thu,
      fridayHours: fri,
      saturdayHours: sat,
    },
    create: {
      userId: params.userId,
      organizationId,
      sundayHours: sun,
      mondayHours: mon,
      tuesdayHours: tue,
      wednesdayHours: wed,
      thursdayHours: thu,
      fridayHours: fri,
      saturdayHours: sat,
    },
  });

  return NextResponse.json({ rota });
}