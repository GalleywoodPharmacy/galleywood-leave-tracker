import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
const from = process.env.EMAIL_FROM || "Galleywood Pharmacy <leave@example.com>";
const resend = apiKey ? new Resend(apiKey) : null;

const APP_URL = process.env.NEXTAUTH_URL || "http://localhost:3000";

async function send(to: string | string[], subject: string, html: string) {
  if (!resend) {
    console.log(`[email:skipped, no RESEND_API_KEY] to=${to} subject="${subject}"`);
    return;
  }
  try {
    await resend.emails.send({ from, to, subject, html });
  } catch (err) {
    console.error("Failed to send email:", err);
  }
}

function fmtDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export async function sendLeaveSubmittedEmail(params: {
  managerEmails: string[];
  requesterName: string;
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
    `<p><strong>${params.requesterName}</strong> requested leave:
     ${fmtDate(params.startDate)} – ${fmtDate(params.endDate)} (${params.hours}h).</p>
     <p><a href="${link}">Review in Team &amp; Approvals</a></p>`
  );
}

export async function sendLeaveDecisionEmail(params: {
  requesterEmail: string;
  requesterName: string;
  status: "approved" | "denied";
  startDate: Date;
  endDate: Date;
}) {
  const verb = params.status === "approved" ? "approved" : "declined";
  await send(
    params.requesterEmail,
    `Your leave request was ${verb}`,
    `<p>Hi ${params.requesterName},</p>
     <p>Your leave request for ${fmtDate(params.startDate)} – ${fmtDate(params.endDate)}
     has been <strong>${verb}</strong>.</p>
     <p><a href="${APP_URL}/dashboard">View My Leave</a></p>`
  );
}

export async function sendWeeklyDigestEmail(params: {
  managerEmails: string[];
  organizationName: string;
  upcomingApproved: { name: string; startDate: Date; endDate: Date }[];
  coverageGapDates: Date[];
}) {
  if (params.managerEmails.length === 0) return;
  const leaveRows = params.upcomingApproved
    .map((r) => `<li>${r.name} — ${fmtDate(r.startDate)} to ${fmtDate(r.endDate)}</li>`)
    .join("");
  const gapRows = params.coverageGapDates.map((d) => `<li>${fmtDate(d)}</li>`).join("");

  await send(
    params.managerEmails,
    `Weekly leave & coverage digest — ${params.organizationName}`,
    `<h3>Upcoming approved leave</h3><ul>${leaveRows || "<li>None</li>"}</ul>
     <h3>Coverage gaps</h3><ul>${gapRows || "<li>None</li>"}</ul>
     <p><a href="${APP_URL}/coverage">View Coverage</a></p>`
  );
}

export async function sendCoverageAddedEmail(params: {
  managerEmails: string[];
  covererName: string;
  date: Date;
  assignedBySomeoneElse: boolean;
}) {
  if (params.managerEmails.length === 0) return;
  await send(
    params.managerEmails,
    `Coverage confirmed: ${fmtDate(params.date)}`,
    `<p><strong>${params.covererName}</strong> is now covering <strong>${fmtDate(params.date)}</strong>.</p>
     <p><a href="${APP_URL}/coverage">View Coverage</a></p>`
  );
}

export async function sendLeaveWithdrawnEmail(params: {
  managerEmails: string[];
  requesterName: string;
  startDate: Date;
  endDate: Date;
}) {
  if (params.managerEmails.length === 0) return;
  await send(
    params.managerEmails,
    `${params.requesterName} withdrew a leave request`,
    `<p><strong>${params.requesterName}</strong> withdrew their leave request
     for ${fmtDate(params.startDate)} – ${fmtDate(params.endDate)}.</p>
     <p><a href="${APP_URL}/team">View Team &amp; Approvals</a></p>`
  );
}

export async function sendLeaveAmendedEmail(params: {
  requesterEmail: string;
  requesterName: string;
  startDate: Date;
  endDate: Date;
  hours: number;
}) {
  await send(
    params.requesterEmail,
    `Your leave request was updated`,
    `<p>Hi ${params.requesterName},</p>
     <p>A manager updated your leave request. It now reads:
     ${fmtDate(params.startDate)} – ${fmtDate(params.endDate)} (${params.hours}h).</p>
     <p><a href="${APP_URL}/dashboard">View My Leave</a></p>`
  );
}

export async function sendLeaveCancelledByManagerEmail(params: {
  requesterEmail: string;
  requesterName: string;
  startDate: Date;
  endDate: Date;
}) {
  await send(
    params.requesterEmail,
    `Your leave request was cancelled`,
    `<p>Hi ${params.requesterName},</p>
     <p>A manager cancelled your leave request
     for ${fmtDate(params.startDate)} – ${fmtDate(params.endDate)}.</p>
     <p><a href="${APP_URL}/dashboard">View My Leave</a></p>`
  );
}