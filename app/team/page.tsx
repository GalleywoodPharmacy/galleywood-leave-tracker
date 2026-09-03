import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAllStaffBalances, getOrgBranding } from "@/lib/leave";
import { getOpenSickLeave } from "@/lib/reports";
import AppNav from "@/components/app-nav";
import YearSelect from "@/components/year-select";
import PendingQueue from "@/components/team/pending-queue";
import TeamBalanceTable from "@/components/team/team-balance-table";
import ActivityLog from "@/components/team/activity-log";
import OpenSickLeaveBanner from "@/components/team/open-sick-leave-banner";

function serialize(r: {
  id: string;
  startDate: Date;
  endDate: Date;
  hours: number;
  notes: string | null;
  status: string;
  type: string;
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
    type: r.type as "annual" | "sick",
    submittedAt: r.submittedAt.toISOString(),
    decidedAt: r.decidedAt ? r.decidedAt.toISOString() : null,
    userName: r.user.name,
    userEmail: r.user.email,
    decidedByName: r.decidedBy?.name ?? null,
  };
}

export default async function TeamPage({ searchParams }: { searchParams: { year?: string } }) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.organizationId) redirect("/login");
  if (!session.user.isManager) redirect("/dashboard");
  const organizationId = session.user.organizationId;

  const now = new Date();
  const currentYear = now.getUTCFullYear();
  const selectedYear = searchParams.year ? parseInt(searchParams.year, 10) : currentYear;

  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - 1 + i);
  if (!yearOptions.includes(selectedYear)) {
    yearOptions.push(selectedYear);
    yearOptions.sort((a, b) => a - b);
  }

  const [pending, allRequests, staffBalances, openSickLeave, branding] = await Promise.all([
    prisma.leaveRequest.findMany({
      where: { status: "pending", organizationId },
      include: { user: { select: { name: true, email: true } }, decidedBy: { select: { name: true } } },
      orderBy: { submittedAt: "asc" },
    }),
    prisma.leaveRequest.findMany({
      where: { organizationId },
      include: { user: { select: { name: true, email: true } }, decidedBy: { select: { name: true } } },
      orderBy: { submittedAt: "desc" },
    }),
    getAllStaffBalances(selectedYear, organizationId),
    getOpenSickLeave(organizationId),
    getOrgBranding(organizationId),
  ]);

  return (
    <div className="min-h-screen bg-page">
      <AppNav isManager={session.user.isManager} organizationName={branding.name} organizationLogoUrl={branding.logoUrl} />

      <main className="p-6 max-w-5xl mx-auto space-y-8">
        <h1 className="text-xl text-header">Team &amp; Approvals</h1>

        <OpenSickLeaveBanner items={openSickLeave} />

        <section>
          <h2 className="text-header text-lg mb-3">Pending queue</h2>
          <PendingQueue requests={pending.map(serialize)} />
        </section>

        <section>
          <div className="flex items-center justify-between flex-wrap gap-3 mb-3">
            <h2 className="text-header text-lg">Team balances</h2>
            <div className="flex items-center gap-2">
              <label htmlFor="team-year" className="text-sm text-ink-soft">
                Viewing
              </label>
              <YearSelect years={yearOptions} selectedYear={selectedYear} basePath="/team" />
            </div>
          </div>
          <TeamBalanceTable staffBalances={staffBalances} />
        </section>

        <section>
          <h2 className="text-header text-lg mb-3">History</h2>
          <ActivityLog requests={allRequests.map(serialize)} />
        </section>
      </main>
    </div>
  );
}