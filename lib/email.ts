import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM || "Galleywood Pharmacy <leave@example.com>";
const resend = apiKey ? new Resend(apiKey) : null;

const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

async function send(to: string | string[], subject: string, html: string) {
  if (!resend) {
    // No RESEND_API_KEY set — don't crash local dev, just log what would've sent.
    console.log(`[email:skipped, no RESEND_API_KEY] to=${to} subject="${subject}"`);
    return;
  }
  try {
    await resend.emails.send({ from, to, subject, html });
  } catch (err) {
    // Email failures should never break the underlying action (submit/approve/etc).
    console.error("Failed to send email:", err);
  }
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export async function sendLeaveSubmittedEmail(params: {
  managerEmails: string[];
  requesterName: string;
  type: string;
  startDate: Date;
  endDate: Date;
  hours: number;
  requestId: string;
}) {
  if (params.managerEmails.length === 0) return;
  const link = `${APP_URL}/team`;
  await send(
    params.managerEmails,
    `New leave request from ${params.requesterName}`,
    `<p><strong>${params.requesterName}</strong> requested <strong>${params.type}</strong> leave:
     ${fmtDate(params.startDate)} – ${fmtDate(params.endDate)} (${params.hours}h).</p>
     <p><a href="${link}">Review in Team &amp; Approvals</a></p>`
  );
}

export async function sendLeaveDecisionEmail(params: {
  requesterEmail: string;
  requesterName: string;
  status: "approved" | "denied";
  type: string;
  startDate: Date;
  endDate: Date;
}) {
  const verb = params.status === "approved" ? "approved" : "declined";
  await send(
    params.requesterEmail,
    `Your ${params.type} leave request was ${verb}`,
    `<p>Hi ${params.requesterName},</p>
     <p>Your <strong>${params.type}</strong> leave request for ${fmtDate(params.startDate)} – ${fmtDate(params.endDate)}
     has been <strong>${verb}</strong>.</p>
     <p><a href="${APP_URL}/leave">View My Leave</a></p>`
  );
}

export async function sendWeeklyDigestEmail(params: {
  managerEmails: string[];
  upcomingApproved: { name: string; type: string; startDate: Date; endDate: Date }[];
  coverageGapDates: Date[];
}) {
  if (params.managerEmails.length === 0) return;
  const leaveRows = params.upcomingApproved
    .map((r) => `<li>${r.name} — ${r.type} — ${fmtDate(r.startDate)} to ${fmtDate(r.endDate)}</li>`)
    .join("");
  const gapRows = params.coverageGapDates.map((d) => `<li>${fmtDate(d)}</li>`).join("");

  await send(
    params.managerEmails,
    "Weekly leave & coverage digest — Galleywood Pharmacy",
    `<h3>Upcoming approved leave</h3><ul>${leaveRows || "<li>None</li>"}</ul>
     <h3>Coverage gaps</h3><ul>${gapRows || "<li>None</li>"}</ul>
     <p><a href="${APP_URL}/coverage">View Coverage</a></p>`
  );
}
