import { NextResponse } from "next/server";
import { z } from "zod";
import { requireSession } from "@/lib/require-manager";
import { prisma } from "@/lib/prisma";

const schema = z.object({
  date: z.string(), // YYYY-MM-DD
  userId: z.string().optional(), // if omitted, self-assign
});

export async function POST(req: Request) {
  const check = await requireSession();
  if (check instanceof NextResponse) return check;
  const session = check;

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const targetUserId = parsed.data.userId ?? session.user.id;
  if (targetUserId !== session.user.id && !session.user.isManager) {
    return NextResponse.json({ error: "Only managers can assign someone else" }, { status: 403 });
  }

  try {
    const assignment = await prisma.coverageAssignment.create({
      data: {
        date: new Date(parsed.data.date),
        userId: targetUserId,
        createdById: session.user.id,
      },
      include: { user: { select: { name: true } } },
    });
    return NextResponse.json({ assignment }, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === "object" && "code" in err && err.code === "P2002") {
      return NextResponse.json({ error: "That person is already covering this date." }, { status: 409 });
    }
    throw err;
  }
}
