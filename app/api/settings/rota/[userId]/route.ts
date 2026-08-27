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
