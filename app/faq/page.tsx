import Link from "next/link";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white border border-line rounded-xl p-5 space-y-4">
      <h2 className="text-header text-lg">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function QA({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-medium text-ink mb-1">{q}</p>
      <div className="text-sm text-ink-soft space-y-1">{children}</div>
    </div>
  );
}

export default function FaqPage() {
  return (
    <div className="min-h-screen bg-page">
      <header className="bg-header text-white">
        <div className="px-6 py-4 flex items-center justify-between max-w-3xl mx-auto">
          <span className="font-medium flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
              <path d="M12 2l2.9 6.26L22 9.27l-5 4.87L18.18 21 12 17.27 5.82 21 7 14.14l-5-4.87 7.1-1.01L12 2z" />
            </svg>
            SmartTeamAndRota (STAR)
          </span>
          <Link href="/login" className="text-sm text-white/85 hover:text-white transition-colors">
            Sign in
          </Link>
        </div>
      </header>

      <main className="p-6 max-w-3xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl text-header mb-2">Frequently asked questions</h1>
          <p className="text-sm text-ink-soft">
            What SmartTeamAndRota (STAR) does and how it works, for staff and managers alike.
          </p>
        </div>

        <Section title="Getting started">
          <QA q="How do I set up an account for my business?">
            <p>
              Go to the <Link href="/signup" className="text-primary hover:underline">sign-up page</Link> and create
              an account with your business name, your name, an email, and a password. You're instantly signed in as
              the manager of your own business — completely separate from every other business using the platform.
            </p>
          </QA>
          <QA q="How do I add my staff?">
            <p>
              As a manager, go to <strong>Settings → Staff &amp; allowances</strong> and add each person's name,
              email, and password. You can set whether they're a manager too, and their start date if relevant.
            </p>
          </QA>
          <QA q="Is there a way to try it out without setting anything up?">
            <p>
              Yes — click <strong>"Fill in the demo login"</strong> on the sign-in page. It logs you into a sample
              account with existing staff and data already in place. Anything you do there resets automatically, so
              feel free to click around freely.
            </p>
          </QA>
        </Section>

        <Section title="Requesting leave (all staff)">
          <QA q="How do I request annual leave?">
            <p>
              Go to the Calendar, click the day you want to start, then click the day you want to end on (or just
              click the same day again for a single day off). Fill in any notes and submit — your manager gets
              notified automatically.
            </p>
          </QA>
          <QA q="How are my hours worked out?">
            <p>
              Automatically, based on your rota — the app knows your normal working hours for each day of the week
              and calculates the total for you. You don't need to work it out yourself.
            </p>
          </QA>
          <QA q="Can I log my own sick leave?">
            <p>
              No — sick leave is logged by a manager on your behalf, since it's approved immediately rather than
              going through a request/approval step. If you're off sick, let your manager know and they'll record it.
            </p>
          </QA>
          <QA q="How do I know if my request has been approved?">
            <p>
              You'll get an email as soon as a manager makes a decision. You can also check anytime on your
              Dashboard, or see the coloured status directly on the Calendar.
            </p>
          </QA>
          <QA q="Can I cancel a request I've already sent in?">
            <p>
              Yes, as long as it's still pending or approved (not already declined). You can withdraw it either from
              the Calendar (click the entry) or from your Dashboard → History.
            </p>
          </QA>
        </Section>

        <Section title="Understanding your leave balance">
          <QA q="How is my annual leave allowance calculated?">
            <p>
              From your weekly contracted hours × your business's statutory leave policy (5.6 weeks by default, the
              UK minimum) — worked out automatically, so you don't need to track it yourself.
            </p>
          </QA>
          <QA q="Do bank holidays come off my allowance?">
            <p>
              Depends on your business's policy — some businesses build bank holidays into the 5.6-week figure (the
              more common approach), others treat them as separate paid days off that don't touch your balance at
              all. Check your Dashboard — it'll show a breakdown either way.
            </p>
          </QA>
          <QA q="What if I started partway through the year?">
            <p>
              Your first year's allowance is automatically pro-rated based on your start date, so you're not shown a
              full year's entitlement you haven't actually accrued yet.
            </p>
          </QA>
        </Section>

        <Section title="The Calendar">
          <QA q="What do the colours mean?">
            <p>
              Amber = requested (pending), blue = approved, red = declined, and a diagonal stripe pattern marks a
              day the business is closed. Purple marks sick leave, green marks overtime.
            </p>
          </QA>
          <QA q="Can I edit something directly from the Calendar?">
            <p>
              Yes — click any leave or overtime entry you're allowed to manage. Depending on your role, you'll see
              options like editing the dates or hours, approving or declining (managers), withdrawing your own
              request, or arranging cover.
            </p>
          </QA>
          <QA q='What is a "blackout period"?'>
            <p>
              A date range your business has flagged as a "please try not to request leave here" hint — usually a
              busy season. It doesn't block requests outright, it just visually flags the days so everyone's aware.
            </p>
          </QA>
          <QA q='What does "No cover yet" mean?'>
            <p>
              It's a reminder that an approved leave period doesn't have anyone lined up to cover it. Click the
              entry to assign someone — a colleague from your team, or type in the name of anyone else covering
              (like a locum or agency worker).
            </p>
          </QA>
        </Section>

        <Section title="Overtime">
          <QA q="How do I log overtime?">
            <p>
              Click the relevant day on the Calendar and choose to log overtime, entering the hours and an optional
              note. It's recorded immediately — there's no approval step.
            </p>
          </QA>
          <QA q="Can I fix a mistake afterward?">
            <p>
              Yes — click the overtime entry on the Calendar to edit the hours/notes or remove it entirely. You can
              also do this from your Dashboard → History.
            </p>
          </QA>
          <QA q="Where can I see all my overtime in one place?">
            <p>
              Your Dashboard → History shows your leave and overtime together, with a filter to show just one or the
              other.
            </p>
          </QA>
        </Section>

        <Section title="Coverage">
          <QA q="How do I arrange cover for my time off?">
            <p>
              Click your approved leave on the Calendar and choose "Manage cover" — pick a colleague from the list,
              or type a name for anyone outside the team. You can set cover for the whole period at once, or just a
              single day within it.
            </p>
          </QA>
          <QA q="What's the Coverage page for?">
            <p>
              It's a quick-glance list of upcoming approved leave that doesn't have cover arranged yet, so gaps
              don't get missed. It won't show your own leave there — you'll always find that on the Calendar
              instead.
            </p>
          </QA>
        </Section>

        <Section title="For managers">
          <QA q="How do I approve or decline a request?">
            <p>
              Go to Team &amp; Approvals — the Pending queue shows everything awaiting a decision. You can also
              approve, decline, edit, or cancel directly from the Calendar by clicking the entry.
            </p>
          </QA>
          <QA q="Can I change the dates or hours on someone's request after they've submitted it?">
            <p>Yes — click "Edit details" on their request, either in Team &amp; Approvals or directly from the Calendar.</p>
          </QA>
          <QA q="How do I see everyone's leave balance at a glance?">
            <p>
              Team &amp; Approvals → Team balances shows every staff member's allowance, hours taken, and remaining
              balance for whichever year you select.
            </p>
          </QA>
          <QA q="Can I filter the history to see just certain types of requests?">
            <p>
              Yes — Team &amp; Approvals → History has filters for staff member, year, request type
              (annual/sick/overtime), and status (pending/approved/declined/cancelled), all combinable.
            </p>
          </QA>
          <QA q="How do I export a report?">
            <p>
              Go to Reports, pick a month, and export as PDF or Excel — includes hours worked, overtime, annual
              leave, bank holidays, and sick leave per staff member.
            </p>
          </QA>
          <QA q="How do I set up staff rotas?">
            <p>
              Settings → Staff rotas lets you set each person's normal working hours for every day of the week —
              this is what powers the automatic hours calculations throughout the app.
            </p>
          </QA>
        </Section>

        <Section title="Customizing your business's settings">
          <QA q="Can we set our own opening days?">
            <p>
              Yes — Settings → Business settings lets you tick which days of the week your business is open at all,
              independent of any individual staff member's rota.
            </p>
          </QA>
          <QA q="Can we change our leave policy?">
            <p>
              Yes — the statutory leave weeks (defaults to 5.6, the UK minimum) and whether bank holidays count
              against the allowance are both configurable in Business settings.
            </p>
          </QA>
          <QA q="What are the recurring blackout periods for pre-Christmas and pre-Easter?">
            <p>
              Two common seasonal "please don't request leave here" periods, computed fresh every year automatically
              — you just choose how many weeks each one runs for, or switch them off if they're not relevant to your
              business. You can also add your own fully custom blackout periods for any other time of year.
            </p>
          </QA>
          <QA q='What are "Saturday teams"?'>
            <p>
              An optional feature for businesses that alternate two rotating groups of staff on Saturdays — set it
              up once with an anchor date and each team's names, and the Calendar shows who's on automatically,
              swapping every other week.
            </p>
          </QA>
        </Section>

        <Section title="Account &amp; privacy">
          <QA q="How do I change my password or email?">
            <p>Go to Account, enter your current password to confirm it's you, then update your details.</p>
          </QA>
          <QA q="Can other businesses using the platform see our data?">
            <p>
              No — every business's staff, leave, settings, and history are completely isolated from every other
              business, even though they all run on the same platform.
            </p>
          </QA>
        </Section>

        <div className="text-center pt-2 pb-6">
          <Link href="/signup" className="text-sm text-primary hover:underline">
            Ready to get started? Create your account →
          </Link>
        </div>
      </main>
    </div>
  );
}