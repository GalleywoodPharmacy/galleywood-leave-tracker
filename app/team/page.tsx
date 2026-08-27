import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAllStaffBalances } from "@/lib/leave";
import AppNav from "@/components/app-nav";
import PendingQueue from "@/components/team/pending-queue";
import TeamBalanceTable from "@/components/team/team-balance-table";
import ActivityLog from "@/components/team/activity-log";

function serialize(r: {
  id: string;
  startDate: Date;
  endDate: Date;
  hours: number;
  notes: string | null;
  status: string;
  submittedAt: Date;
  decidedAt: Date | null;
  user: { name: string; email: string };
  decidedBy: { name: string } | null;
}) {
  return {
    id: r.id,
    startDate: r.startDate.toISOString(),
    endDate: r.endDate.toISOString(),
    hours: r.hours,
    notes: r.notes,
    status: r.status as "pending" | "approved" | "denied" | "cancelled",
    submittedAt: r.submittedAt.toISOString(),
    decidedAt: r.decidedAt ? r.decidedAt.toISOString() : null,
    userName: r.user.name,
    userEmail: r.user.email,
    decidedByName: r.decidedBy?.name ?? null,
  };
}

export default async function TeamPage({ searchParams }: { searchParams: { year?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!session.user.isManager) redirect("/dashboard");

  const now = new Date();
  const selectedYear = searchParams.year ? parseInt(searchParams.year, 10) : now.getUTCFullYear();

  const [pending, recent, staffBalances] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: { status: "pending" },
      include: { user: { select: { name: true, email: true } }, decidedBy: { select: { name: true } } },
      orderBy: { submittedAt: "asc" },
    }),
    prisma.leaveRequest.findMany({
      include: { user: { select: { name: true, email: true } }, decidedBy: { select: { name: true } } },
      orderBy: { submittedAt: "desc" },
      take: 25,
    }),
    getAllStaffBalances(selectedYear),
  ]);

  return (
    <div className="min-h-screen bg-page">
      <AppNav isManager={session.user.isManager} />

      <main className="p-6 max-w-5xl mx-auto space-y-8">
        <h1 className="text-xl text-header">Team &amp; Approvals</h1>

        <section>
          <h2 className="text-header text-lg mb-3">Pending queue</h2>
          <PendingQueue requests={pending.map(serialize)} />
        </section>

        <section>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <h2 className="text-header text-lg">Team balances</h2>
            <div className="flex items-center gap-2 text-sm">
              <Link
                href={`/team?year=${selectedYear - 1}`}
                className="rounded-lg border border-line px-3 py-1.5 hover:bg-card transition-colors"
              >
                ← {selectedYear - 1}
              </Link>
              <span className="px-3 py-1.5 font-medium text-header font-mono">{selectedYear}</span>
              <Link
                href={`/team?year=${selectedYear + 1}`}
                className="rounded-lg border border-line px-3 py-1.5 hover:bg-card transition-colors"
              >
                {selectedYear + 1} →
              </Link>
            </div>
          </div>
          <TeamBalanceTable staffBalances={staffBalances} />
        </section>

        <section>
          <h2 className="text-header text-lg mb-3">Recent activity</h2>
          <ActivityLog requests={recent.map(serialize)} />
        </section>
      </main>
    </div>
  );
}