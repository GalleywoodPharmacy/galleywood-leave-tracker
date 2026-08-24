import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAllStaffBalances } from "@/lib/leave";
import AppNav from "@/components/app-nav";
import PendingQueue from "@/components/team/pending-queue";
import TeamBalanceTable from "@/components/team/team-balance-table";
import ActivityLog from "@/components/team/activity-log";

function serialize(r: {
  id: string;
  type: string;
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
    type: r.type as "annual" | "sick" | "other",
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

export default async function TeamPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (!session.user.isManager) redirect("/dashboard");

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
    getAllStaffBalances(),
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
          <h2 className="text-header text-lg mb-3">Team balances</h2>
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
