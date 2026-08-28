import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getMonthCalendarData } from "@/lib/calendar";
import { getBlackoutPeriods } from "@/lib/business-rules";
import AppNav from "@/components/app-nav";
import MonthGrid from "@/components/calendar/month-grid";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default async function CalendarPage({
  searchParams,
}: {
  searchParams: { year?: string; month?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const now = new Date();
  const year = searchParams.year ? parseInt(searchParams.year, 10) : now.getUTCFullYear();
  const month = searchParams.month ? parseInt(searchParams.month, 10) : now.getUTCMonth() + 1;

  const [{ byDate, extraClosedDates }, staffList] = await Promise.all([
    getMonthCalendarData(year, month),
    prisma.user.findMany({ select: { id: true, name: true }, orderBy: { name: "asc" } }),
  ]);

  const blackoutPeriods = [
    ...getBlackoutPeriods(year - 1),
    ...getBlackoutPeriods(year),
    ...getBlackoutPeriods(year + 1),
  ];

  const prev = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const next = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };

  return (
    <div className="min-h-screen bg-page">
      <AppNav isManager={session.user.isManager} />

      <main className="p-6 max-w-5xl mx-auto space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl text-header">
            {MONTH_NAMES[month - 1]} {year}
          </h1>
          <div className="flex gap-2 text-sm">
            <Link
              href={`/calendar?year=${prev.year}&month=${prev.month}`}
              className="rounded-lg border border-line px-3 py-1.5 hover:bg-card"
            >
              ← Prev
            </Link>
            <Link
              href={`/calendar?year=${now.getUTCFullYear()}&month=${now.getUTCMonth() + 1}`}
              className="rounded-lg border border-line px-3 py-1.5 hover:bg-card"
            >
              Today
            </Link>
            <Link
              href={`/calendar?year=${next.year}&month=${next.month}`}
              className="rounded-lg border border-line px-3 py-1.5 hover:bg-card"
            >
              Next →
            </Link>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 text-xs text-ink-soft">
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-pending/40 inline-block" /> Requested</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-primary/40 inline-block" /> Approved</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-declined/40 inline-block" /> Declined</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-coverage/40 inline-block" /> Covered (colleague)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded bg-accent/40 inline-block" /> Covered (other)</span>
          <span className="flex items-center gap-1"><span className="w-3 h-3 rounded border border-dashed border-pending/50 bg-pending/10 inline-block" /> No cover yet</span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-[repeating-linear-gradient(45deg,rgba(21,37,34,0.15),rgba(21,37,34,0.15)_3px,transparent_3px,transparent_6px)] inline-block" />
            Closed
          </span>
          <span className="flex items-center gap-1">
            <span className="w-3 h-3 rounded bg-ink-soft/25 inline-block" />
            Black out period
          </span>
        </div>

        <p className="text-xs text-ink-soft">
          Click your own leave (or anyone's, if you're a manager) to add or change who's covering it. Approved leave
          shows a small box underneath with the cover status.
        </p>

        <MonthGrid
          year={year}
          month={month}
          byDate={byDate}
          extraClosedDates={extraClosedDates}
          blackoutPeriods={blackoutPeriods}
          currentUserId={session.user.id}
          isManager={session.user.isManager}
          staffList={staffList}
        />
      </main>
    </div>
  );
}