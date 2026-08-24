import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { computeHoursForRange } from "@/lib/leave";

const schema = z.object({
  startDate: z.string(),
  endDate: z.string(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid dates" }, { status: 400 });
  }

  const { startDate, endDate } = parsed.data;
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (start > end) {
    return NextResponse.json({ hours: 0 });
  }

  const hours = await computeHoursForRange(start, end);
  return NextResponse.json({ hours });
}
