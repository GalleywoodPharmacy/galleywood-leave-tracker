import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getAllStaffRotas, getAllStaffAnnualAllowances } from "@/lib/leave";
import AppNav from "@/components/app-nav";
import StaffTable from "@/components/settings/staff-table";
import ClosedDatesManager from "@/components/settings/closed-dates-manager";
import RotaManager from "@/components/settings/rota-manager";
import BusinessSettings from "@/components/settings/business-settings";
import BlackoutPeriodsManager from "@/components/settings/blackout-periods-manager";
import RecurringBlackoutSettings from "@/components/settings/recurring-blackout-settings";
import SaturdayTeamsSettings from "@/components/settings/saturday-teams-settings";

export default async function SettingsPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.organizationId) redirect("/login");
  if (!session.user.isManager) redirect("/dashboard");
  const organizationId = session.user.organizationId;

  const currentYear = new Date().getUTCFullYear();
  const years = [currentYear, currentYear + 1, currentYear + 2];

  const [staff, closedDates, staffRotas, organization, blackoutPeriods] = await Promise.all([
    getAllStaffAnnualAllowances(years, organizationId),
    prisma.extraClosedDate.findMany({ where: { organizationId }, orderBy: { date: "asc" } }),
    getAllStaffRotas(organizationId),
    prisma.organization.findUniqueOrThrow({ where: { id: organizationId } }),
    prisma.extraBlackoutPeriod.findMany({ where: { organizationId }, orderBy: { startDate: "asc" } }),
  ]);

  return (
    <div className="min-h-screen bg-page">
      <AppNav isManager={session.user.isManager} organizationName={organization.name} organizationLogoUrl={organization.logoUrl} />

      <main className="p-6 max-w-4xl mx-auto space-y-8">
        <h1 className="text-xl text-header">Settings</h1>

        <section>
          <h2 className="text-header text-lg mb-3">Business settings</h2>
          <BusinessSettings
            organization={{
              name: organization.name,
              logoUrl: organization.logoUrl,
              themeColor: organization.themeColor,
              openSunday: organization.openSunday,
              openMonday: organization.openMonday,
              openTuesday: organization.openTuesday,
              openWednesday: organization.openWednesday,
              openThursday: organization.openThursday,
              openFriday: organization.openFriday,
              openSaturday: organization.openSaturday,
              statutoryLeaveWeeks: organization.statutoryLeaveWeeks,
              bankHolidaysIncludedInAllowance: organization.bankHolidaysIncludedInAllowance,
            }}
          />
        </section>

        <section>
          <h2 className="text-header text-lg mb-3">Staff &amp; allowances</h2>
          <StaffTable staff={staff} years={years} />
        </section>

        <section>
          <h2 className="text-header text-lg mb-3">Staff rotas</h2>
          <RotaManager staffRotas={staffRotas} />
        </section>

        <section>
          <h2 className="text-header text-lg mb-3">Extra closed dates</h2>
          <ClosedDatesManager dates={closedDates.map((d) => ({ dateKey: d.date.toISOString().slice(0, 10), label: d.label }))} />
        </section>

        <section>
          <h2 className="text-header text-lg mb-3">Blackout periods</h2>
          <p className="text-xs text-ink-soft mb-3">
            Date ranges shown greyed-out on the Calendar as a hint not to request leave — the business stays open,
            this doesn't block requests, just flags them.
          </p>
          <div className="space-y-4">
            <RecurringBlackoutSettings
              config={{
                preChristmasBlackoutEnabled: organization.preChristmasBlackoutEnabled,
                preChristmasBlackoutWeeks: organization.preChristmasBlackoutWeeks,
                preEasterBlackoutEnabled: organization.preEasterBlackoutEnabled,
                preEasterBlackoutWeeks: organization.preEasterBlackoutWeeks,
              }}
            />
            <BlackoutPeriodsManager
              periods={blackoutPeriods.map((p) => ({
                id: p.id,
                label: p.label,
                startDateKey: p.startDate.toISOString().slice(0, 10),
                endDateKeyInclusive: p.endDate.toISOString().slice(0, 10),
              }))}
            />
          </div>
        </section>

        <section>
          <h2 className="text-header text-lg mb-3">Saturday teams</h2>
          <SaturdayTeamsSettings
            config={{
              enabled: organization.saturdayTeamsEnabled,
              anchorDateKey: organization.saturdayTeamAnchorDate
                ? organization.saturdayTeamAnchorDate.toISOString().slice(0, 10)
                : null,
              teamANames: organization.saturdayTeamANames
                ? organization.saturdayTeamANames.split(",").map((n) => n.trim()).filter(Boolean)
                : [],
              teamBNames: organization.saturdayTeamBNames
                ? organization.saturdayTeamBNames.split(",").map((n) => n.trim()).filter(Boolean)
                : [],
            }}
          />
        </section>
      </main>
    </div>
  );
}