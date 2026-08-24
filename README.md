# Galleywood Pharmacy — Staff Leave & Rota

A complete rebuild of `galleywood-leave-tracker-spec.md` as a real hosted app: real Postgres database, real per-person auth with a server-enforced `is_manager` role, and real transactional email — replacing the Claude.ai prototype's dropdown-identity, manager-PIN, and `window.storage` model.

## What's built

**Data model & business rules**
- `prisma/schema.prisma` — `User`, `LeaveRequest`, `CoverageAssignment`, `ExtraClosedDate` (spec section 3), plus a `LoginToken` table reserved for a future invite/magic-link flow.
- `lib/business-rules.ts` — opening hours, algorithmic England bank holidays (any year, Meeus/Jones/Butcher Easter calc, gov.uk's Christmas/Boxing Day substitute-day logic), and the `ExtraClosedDate` > bank holiday > Sunday closed-day priority (spec section 4). Pure functions, no I/O.
- `lib/leave.ts`, `lib/calendar.ts`, `lib/coverage.ts` — DB-aware wrappers on top of the above: balance math, month-grid data, and the "needs coverage" auto-flagging.

**Auth**
- NextAuth (Credentials provider, email/password, bcrypt-hashed) with `id` and `isManager` on the session/JWT.
- `middleware.ts` enforces sign-in on every app route and gates `/team` + `/settings` on `isManager` **server-side**; every API route re-checks the same server-side via `lib/require-manager.ts` rather than trusting the client.

**Views**
- **My Leave** (`/leave`) — balance cards (hours + ≈days per type), a request form that auto-computes hours from the date range but stays editable for partial days, and a history table with Withdraw on pending/approved requests.
- **Team & Approvals** (`/team`, manager only) — pending queue with Approve/Decline, team-wide balance table, a recent-activity log, and inline Edit/Cancel on any pending or approved request. Amending an approved request re-checks the balance *excluding that request's own current hours*, so shrinking a request never false-positives as over-allowance (spec section 4).
- **Calendar** (`/calendar`) — month grid, colour-coded leave chips (amber/teal/red for requested/approved/declined), blue coverage chips, and hatched closed days (Sundays, bank holidays, extra closures) with the reason on hover.
- **Coverage** (`/coverage`) — a "Needs coverage" list that auto-flags upcoming open days with approved leave and no cover yet, with one-click "I'll cover this"; anyone can add themselves to any date, managers can assign anyone; upcoming assignments are removable.
- **Settings** (`/settings`, manager only) — edit staff allowances and role inline, add/remove staff (manager sets a temporary password directly — see note below), manage one-off extra closed dates.

**Email (Resend)**
- `lib/email.ts` — on submit, all managers get an email with the request details and a link to Team & Approvals; on approve/decline, the requester gets an email. Both fail silently (logged, not thrown) if `RESEND_API_KEY` isn't set, so local dev never breaks on a missing key.
- Optional weekly digest: `app/api/cron/weekly-digest/route.ts` + `vercel.json` wire up a Monday 07:00 UTC Vercel Cron job (upcoming approved leave + coverage gaps, next 14 days), protected by `CRON_SECRET`.

**Brand**
- Colors/fonts from spec section 2 in `tailwind.config.ts` / `app/globals.css`. `public/logo.jpg` is the real, statically hosted logo (no base64).

## Setup

1. **Database.** Create a free Postgres database on [Supabase](https://supabase.com) or [Neon](https://neon.tech). Copy the connection string into `.env` (start from `.env.example`).
2. **Install and migrate:**
   ```bash
   npm install
   npx prisma migrate dev --name init
   ```
3. **Create the first manager account** — everyone else gets added via Settings:
   ```bash
   # set SEED_MANAGER_NAME / _EMAIL / _PASSWORD in .env, then:
   npm run db:seed
   ```
4. **Generate `NEXTAUTH_SECRET`:** `openssl rand -base64 32`
5. **Resend (optional but recommended):** create a free account at [resend.com](https://resend.com), verify a sending domain (or use their test domain while developing), and set `RESEND_API_KEY` + `EMAIL_FROM`. Without it, the app still works — emails just get logged to the console instead of sent.
6. **Run it:** `npm run dev`, then sign in at `http://localhost:3000/login` with the manager account you seeded.

## Deploying

- **Vercel** for the app — connect the repo, add every var from `.env` in the Vercel project settings (including `CRON_SECRET` if you want the weekly digest protected).
- Database stays on Supabase/Neon; run `npx prisma migrate deploy` against production before first deploy.
- The `vercel.json` cron job activates automatically once deployed on a plan that supports Vercel Cron.

## Known simplifications (fair to revisit later)

- **Staff invites:** Settings creates an account with a temporary password the manager sets and shares directly, rather than a magic-link/email invite. The `LoginToken` table is already in the schema if you want to add that flow later — no migration needed.
- **Calendar chip overflow:** a day shows up to 3 leave chips + 2 coverage chips before collapsing to "+N more"; there's no click-through to a full day view yet.
- **No password reset flow yet** — a manager can re-create a staff account's password only by removing and re-adding them for now.
