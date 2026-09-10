import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getOrgBranding } from "@/lib/leave";
import { getOpenShiftForUser, getRecentShiftsForUser, getRecentShiftsForOrg, getWorkplaceLocation } from "@/lib/timeclock";
import AppNav from "@/components/app-nav";
import ClockButton from "@/components/timeclock/clock-button";
import ShiftHistory from "@/components/timeclock/shift-history";
import TeamShiftsTable from "@/components/timeclock/team-shifts-table";

export default async function TimeClockPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.organizationId) redirect("/login");
  const organizationId = session.user.organizationId;

  const [branding, organization, workplaceLocation, openShift, myShifts, teamShifts] = await Promise.all([
    getOrgBranding(organizationId),
    prisma.organization.findUniqueOrThrow({ where: { id: organizationId }, select: { timeClockEnabled: true } }),
    getWorkplaceLocation(organizationId),
    getOpenShiftForUser(session.user.id, organizationId),
    getRecentShiftsForUser(session.user.id, organizationId),
    session.user.isManager ? getRecentShiftsForOrg(organizationId) : Promise.resolve([]),
  ]);

  return (
    <div className="min-h-screen bg-page">
      <AppNav isManager={session.user.isManager} organizationName={branding.name} organizationLogoUrl={branding.logoUrl} />

      <main className="p-6 max-w-3xl mx-auto space-y-6">
        <h1 className="text-xl text-header">Time Clock</h1>

        {!organization.timeClockEnabled ? (
          <div className="bg-pending/10 border border-pending/30 rounded-xl p-4 text-sm text-ink">
            {session.user.isManager
              ? "Time Clock isn't turned on for this business yet — go to Settings to enable it and set a workplace location."
              : "Time Clock isn't turned on for this business yet — check with a manager."}
          </div>
        ) : !workplaceLocation ? (
          <div className="bg-pending/10 border border-pending/30 rounded-xl p-4 text-sm text-ink">
            {session.user.isManager
              ? "No workplace location is set up yet — go to Settings to set one before staff can clock in/out."
              : "Your workplace hasn't set up a location for clocking in/out yet — check with a manager."}
          </div>
        ) : (
          <ClockButton openShift={openShift ? { id: openShift.id, clockInAt: openShift.clockInAt.toISOString() } : null} />
        )}

        <section>
          <h2 className="text-header text-lg mb-3">My recent shifts</h2>
          <ShiftHistory shifts={myShifts} />
        </section>

        {session.user.isManager && (
          <section>
            <h2 className="text-header text-lg mb-3">Team shifts</h2>
            <TeamShiftsTable shifts={teamShifts} />
          </section>
        )}
      </main>
    </div>
  );
}