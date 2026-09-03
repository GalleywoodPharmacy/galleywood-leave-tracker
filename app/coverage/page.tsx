import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getNeedsCoverage } from "@/lib/coverage";
import { getOrgBranding } from "@/lib/leave";
import AppNav from "@/components/app-nav";
import NeedsCoverageList from "@/components/coverage/needs-coverage-list";

export default async function CoveragePage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.organizationId) redirect("/login");

  const [needsCoverage, branding] = await Promise.all([
    getNeedsCoverage(session.user.organizationId, 60, session.user.id),
    getOrgBranding(session.user.organizationId),
  ]);

  return (
    <div className="min-h-screen bg-page">
      <AppNav isManager={session.user.isManager} organizationName={branding.name} organizationLogoUrl={branding.logoUrl} />

      <main className="p-6 max-w-2xl mx-auto space-y-6">
        <h1 className="text-xl text-header">Coverage</h1>

        <section>
          <h2 className="text-header text-lg mb-3">Needs coverage</h2>
          <p className="text-xs text-ink-soft mb-3">
            Open days with approved leave and no one covering yet — not including your own leave, which you can
            still set cover for any time on the Calendar. To assign a specific colleague, name someone outside the
            team, or set cover in advance for pending leave, use the Calendar instead — click any day.
          </p>
          <NeedsCoverageList
            items={needsCoverage.map((d) => ({ requestId: d.requestId, dateKey: d.dateKey, name: d.name }))}
          />
        </section>
      </main>
    </div>
  );
}