import { NextResponse } from "next/server";
import { z } from "zod";
import { requireManager } from "@/lib/require-manager";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1).optional(),
  logoUrl: z.string().optional(),
  themeColor: z.string().optional(),
  openSunday: z.boolean().optional(),
  openMonday: z.boolean().optional(),
  openTuesday: z.boolean().optional(),
  openWednesday: z.boolean().optional(),
  openThursday: z.boolean().optional(),
  openFriday: z.boolean().optional(),
  openSaturday: z.boolean().optional(),
  statutoryLeaveWeeks: z.number().positive().optional(),
  bankHolidaysIncludedInAllowance: z.boolean().optional(),
  preChristmasBlackoutEnabled: z.boolean().optional(),
  preChristmasBlackoutWeeks: z.number().int().min(0).max(12).optional(),
  preEasterBlackoutEnabled: z.boolean().optional(),
  preEasterBlackoutWeeks: z.number().int().min(0).max(12).optional(),
  saturdayTeamsEnabled: z.boolean().optional(),
  saturdayTeamAnchorDate: z.string().optional(), // "YYYY-MM-DD"
  saturdayTeamANames: z.string().optional(),
  saturdayTeamBNames: z.string().optional(),
});

export async function PATCH(req: Request) {
  const check = await requireManager();
  if (check instanceof NextResponse) return check;
  const session = check;
  if (!session.user.organizationId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid update" }, { status: 400 });
  }

  const { logoUrl, themeColor, saturdayTeamAnchorDate, ...rest } = parsed.data;

  const organization = await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: {
      ...rest,
      // Empty string means "clear it back to unset" rather than literally
      // saving an empty string.
      ...(logoUrl !== undefined ? { logoUrl: logoUrl || null } : {}),
      ...(themeColor !== undefined ? { themeColor: themeColor || null } : {}),
      ...(saturdayTeamAnchorDate !== undefined
        ? { saturdayTeamAnchorDate: saturdayTeamAnchorDate ? new Date(saturdayTeamAnchorDate) : null }
        : {}),
    },
  });

  return NextResponse.json({ organization });
}import { NextResponse } from "next/server";
import { z } from "zod";
import { requireManager } from "@/lib/require-manager";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  name: z.string().min(1).optional(),
  logoUrl: z.string().optional(),
  openSunday: z.boolean().optional(),
  openMonday: z.boolean().optional(),
  openTuesday: z.boolean().optional(),
  openWednesday: z.boolean().optional(),
  openThursday: z.boolean().optional(),
  openFriday: z.boolean().optional(),
  openSaturday: z.boolean().optional(),
  statutoryLeaveWeeks: z.number().positive().optional(),
  bankHolidaysIncludedInAllowance: z.boolean().optional(),
  preChristmasBlackoutEnabled: z.boolean().optional(),
  preChristmasBlackoutWeeks: z.number().int().min(0).max(12).optional(),
  preEasterBlackoutEnabled: z.boolean().optional(),
  preEasterBlackoutWeeks: z.number().int().min(0).max(12).optional(),
  saturdayTeamsEnabled: z.boolean().optional(),
  saturdayTeamAnchorDate: z.string().optional(), // "YYYY-MM-DD"
  saturdayTeamANames: z.string().optional(),
  saturdayTeamBNames: z.string().optional(),
});

export async function PATCH(req: Request) {
  const check = await requireManager();
  if (check instanceof NextResponse) return check;
  const session = check;
  if (!session.user.organizationId) return NextResponse.json({ error: "Not signed in" }, { status: 401 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid update" }, { status: 400 });
  }

  const { logoUrl, saturdayTeamAnchorDate, ...rest } = parsed.data;

  const organization = await prisma.organization.update({
    where: { id: session.user.organizationId },
    data: {
      ...rest,
      // Empty string means "clear it back to unset" rather than literally
      // saving an empty string.
      ...(logoUrl !== undefined ? { logoUrl: logoUrl || null } : {}),
      ...(saturdayTeamAnchorDate !== undefined
        ? { saturdayTeamAnchorDate: saturdayTeamAnchorDate ? new Date(saturdayTeamAnchorDate) : null }
        : {}),
    },
  });

  return NextResponse.json({ organization });
}