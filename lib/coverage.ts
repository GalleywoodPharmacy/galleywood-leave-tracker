import { prisma } from "./prisma";
import { loadExtraClosedDates } from "./leave";
import { getClosedReason } from "./business-rules";
import type { CoverInfo } from "./cover";

function todayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}
function addDays(d: Date, n: number) {
  const copy = new Date(d);
  copy.setUTCDate(copy.getUTCDate() + n);
  return copy;
}
function dayKey(d: Date) {
  return d.toISOString().slice(0, 10);
}

export type NeedsCoverageDay = { requestId: string; dateKey: string; date: Date; name: string };

/**
 * Open days in the next `daysAhead` with approved leave and no cover set —
 * one entry per person per day, since cover now lives on the leave request
 * itself rather than a separate table.
 *
 * excludeUserId, if given, leaves that person's own leave out of the list
 * entirely — they still see it (and can add cover) on the Calendar as
 * normal; this just keeps their own gaps out of this flagged list.
 */
export async function getNeedsCoverage(daysAhead = 60, excludeUserId?: string): Promise<NeedsCoverageDay[]> {
  const start = todayUTC();
  const end = addDays(start, daysAhead);

  const [approvedLeave, extraClosedDates] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: {
        status: "approved",
        startDate: { lte: end },
        endDate: { gte: start },
        ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
      },
      include: { user: { select: { name: true } } },
    }),
    loadExtraClosedDates(),
  ]);

  const result: NeedsCoverageDay[] = [];
  for (const r of approvedLeave) {
    const periodCover = (r.coverName as CoverInfo | null) ?? null;
    const overrides = (r.coverNameByDate as Record<string, CoverInfo> | null) ?? {};

    const rangeStart = r.startDate.getTime() > start.getTime() ? r.startDate : start;
    const rangeEnd = r.endDate.getTime() < end.getTime() ? r.endDate : end;
    let cursor = new Date(rangeStart);
    while (cursor.getTime() <= rangeEnd.getTime()) {
      if (!getClosedReason(cursor, extraClosedDates).closed) {
        const dk = dayKey(cursor);
        const cover = overrides[dk] ?? periodCover;
        if (!cover) {
          result.push({ requestId: r.id, dateKey: dk, date: new Date(cursor), name: r.user.name });
        }
      }
      cursor = addDays(cursor, 1);
    }
  }

  result.sort((a, b) => a.date.getTime() - b.date.getTime());
  return result;
}