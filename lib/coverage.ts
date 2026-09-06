import { prisma } from "./prisma";
import { loadExtraClosedDates, getOrgOpenWeekdays } from "./leave";
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

export type NeedsCoverageDay = {
  requestId: string;
  dateKey: string;
  date: Date;
  name: string;
  status: "pending" | "approved";
};

/**
 * Leave with no cover set, from today onward — one entry per person per
 * day, since cover now lives on the leave request itself rather than a
 * separate table.
 *
 * Includes both pending and approved leave (and sick leave, which is
 * always created as "approved" immediately) — a gap is worth flagging and
 * arranging cover for as soon as it's logged, not only once a manager has
 * gotten around to approving it. `status` on each entry lets the UI show
 * which is which if it wants to. An entry only disappears once cover is
 * actually assigned for that day — it isn't time-limited otherwise, so a
 * gap booked years out still shows up today.
 *
 * daysAhead, if given, caps how far into the future to look (used by the
 * weekly digest, which only wants what's coming up soon); omit it for no
 * upper bound at all — e.g. the Coverage page, which should show every
 * outstanding gap regardless of how far away it is.
 *
 * excludeUserId, if given, leaves that person's own leave out of the list
 * entirely — they still see it (and can add cover) on the Calendar as
 * normal; this just keeps their own gaps out of this flagged list.
 */
export async function getNeedsCoverage(
  organizationId: string,
  daysAhead?: number,
  excludeUserId?: string
): Promise<NeedsCoverageDay[]> {
  const start = todayUTC();
  const end = daysAhead !== undefined ? addDays(start, daysAhead) : null;

  const [leave, extraClosedDates, openWeekdays] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: {
        organizationId,
        status: { in: ["pending", "approved"] },
        ...(end ? { startDate: { lte: end } } : {}),
        endDate: { gte: start },
        ...(excludeUserId ? { userId: { not: excludeUserId } } : {}),
      },
      include: { user: { select: { name: true } } },
    }),
    loadExtraClosedDates(organizationId),
    getOrgOpenWeekdays(organizationId),
  ]);

  const result: NeedsCoverageDay[] = [];
  for (const r of leave) {
    const periodCover = (r.coverName as CoverInfo | null) ?? null;
    const overrides = (r.coverNameByDate as Record<string, CoverInfo> | null) ?? {};

    const rangeStart = r.startDate.getTime() > start.getTime() ? r.startDate : start;
    const rangeEnd = end && r.endDate.getTime() > end.getTime() ? end : r.endDate;
    let cursor = new Date(rangeStart);
    while (cursor.getTime() <= rangeEnd.getTime()) {
      if (!getClosedReason(cursor, extraClosedDates, openWeekdays).closed) {
        const dk = dayKey(cursor);
        const cover = overrides[dk] ?? periodCover;
        if (!cover) {
          result.push({
            requestId: r.id,
            dateKey: dk,
            date: new Date(cursor),
            name: r.user.name,
            status: r.status as "pending" | "approved",
          });
        }
      }
      cursor = addDays(cursor, 1);
    }
  }

  result.sort((a, b) => a.date.getTime() - b.date.getTime());
  return result;
}