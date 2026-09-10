import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { distanceMeters } from "@/lib/geo";
import { getWorkplaceLocation, getOpenShiftForUser } from "@/lib/timeclock";

const schema = z.object({
  action: z.enum(["in", "out"]),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
});

function todayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.organizationId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const openShift = await getOpenShiftForUser(session.user.id, session.user.organizationId);
  return NextResponse.json({ openShift });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.organizationId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  const organizationId = session.user.organizationId;
  const userId = session.user.id;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid request" }, { status: 400 });
  }

  const organization = await prisma.organization.findUniqueOrThrow({
    where: { id: organizationId },
    select: { timeClockEnabled: true },
  });
  if (!organization.timeClockEnabled) {
    return NextResponse.json({ error: "Time Clock isn't turned on for this business." }, { status: 400 });
  }

  const location = await getWorkplaceLocation(organizationId);
  if (!location) {
    return NextResponse.json(
      { error: "Your workplace location hasn't been set up yet — ask a manager to set it in Settings." },
      { status: 400 }
    );
  }

  const distance = distanceMeters(parsed.data.latitude, parsed.data.longitude, location.latitude, location.longitude);
  if (distance > location.radiusMeters) {
    return NextResponse.json(
      {
        error: `You're about ${Math.round(distance)}m from ${location.name} — you need to be within ${location.radiusMeters}m to clock ${parsed.data.action}.`,
      },
      { status: 400 }
    );
  }

  const openShift = await getOpenShiftForUser(userId, organizationId);

  if (parsed.data.action === "in") {
    if (openShift) {
      return NextResponse.json({ error: "You're already clocked in." }, { status: 400 });
    }
    const shift = await prisma.clockShift.create({
      data: {
        userId,
        organizationId,
        date: todayUTC(),
        clockInAt: new Date(),
        clockInLat: parsed.data.latitude,
        clockInLng: parsed.data.longitude,
      },
    });
    return NextResponse.json({ shift, ok: true });
  }

  // action === "out"
  if (!openShift) {
    return NextResponse.json({ error: "You're not currently clocked in." }, { status: 400 });
  }
  const shift = await prisma.clockShift.update({
    where: { id: openShift.id },
    data: {
      clockOutAt: new Date(),
      clockOutLat: parsed.data.latitude,
      clockOutLng: parsed.data.longitude,
    },
  });
  return NextResponse.json({ shift, ok: true });
}