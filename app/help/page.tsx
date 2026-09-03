import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { getOrgBranding } from "@/lib/leave";
import AppNav from "@/components/app-nav";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-line rounded-xl p-5 space-y-2">
      <h2 className="text-header text-lg">{title}</h2>
      <div className="text-sm text-ink space-y-2">{children}</div>
    </section>
  );
}

export default async function HelpPage() {
  const session = await getServerSession(authOptions);
  if (!session || !session.user.organizationId) redirect("/login");

  const branding = await getOrgBranding(session.user.organizationId);

  return (
    <div className="min-h-screen bg-page">
      <AppNav isManager={session.user.isManager} organizationName={branding.name} organizationLogoUrl={branding.logoUrl} />

      <main className="p-6 max-w-2xl mx-auto space-y-6">
        <h1 className="text-xl text-header">How this works</h1>

        <Section title="Requesting leave">
          <p>
            Go to <strong>Dashboard</strong> and use the Request leave form. Pick your start and end dates — the
            hours are worked out automatically from your rota, so you usually won't need to change that field.
          </p>
        </Section>

        <Section title="Your balance">
          <p>
            The Annual leave card on your Dashboard shows what's left for the year you're viewing. Each year's
            allowance is worked out automatically from your rota and that year's bank holidays, so it can look
            slightly different from one year to the next.
          </p>
        </Section>

        <Section title="Who's covering">
          <p>
            Once leave is approved, go to the <strong>Calendar</strong> and click on the day to say who's covering
            — either a colleague from a dropdown, or type a name for anyone outside the team (a locum, for
            example). For a leave that spans several days, you can set cover for just one day or the whole period.
          </p>
          <p>A red dashed box means no cover has been set yet; a solid blue box means it has.</p>
        </Section>

        <Section title="The Coverage page">
          <p>
            This lists open days that still need cover, so it's a quick way to spot gaps without scanning the
            whole Calendar. It won't show your own leave — you'll always find that on the Calendar instead.
          </p>
        </Section>

        <Section title="Calendar colours">
          <p>Amber = requested, teal = approved, red = declined, and a diagonal pattern marks a day the pharmacy is closed.</p>
        </Section>
      </main>
    </div>
  );
}