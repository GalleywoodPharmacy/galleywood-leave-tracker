import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getNeedsCoverage } from "@/lib/coverage";
import { getOrgBranding } from "@/lib/leave";
import AppNav from "@/components/app-nav";
import NeedsCoverageList from "@/components/coverage/needs-coverage-list";

export default async function CoveragePage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.organizationId) redirect("/login");
  const organizationId = session.user.organizationId;

  const [needsCoverage, branding, staffList] = await Promise.all([
    getNeedsCoverage(organizationId, undefined, session.user.id),
    getOrgBranding(organizationId),
    prisma.user.findMany({
      where: { isDemo: false, organizationId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <div className="min-h-screen bg-page">
      <AppNav isManager={session.user.isManager} organizationName={branding.name} organizationLogoUrl={branding.logoUrl} />

      <main className="p-6 max-w-2xl mx-auto space-y-6">
        <h1 className="text-xl text-header">Coverage</h1>

        <section>
          <h2 className="text-header text-lg mb-3">Needs coverage</h2>
          <p className="text-xs text-ink-soft mb-3">
            Every open day with pending or approved leave and no one covering yet — not including your own leave,
            which you can still set cover for any time on the Calendar. A day only drops off this list once cover
            is actually assigned to it; there's no cut-off for how far in the future it is.
          </p>
          <NeedsCoverageList
            items={needsCoverage.map((d) => ({ requestId: d.requestId, dateKey: d.dateKey, name: d.name }))}
            isManager={session.user.isManager}
            staffList={staffList}
          />
        </section>
      </main>
    </div>
  );
}