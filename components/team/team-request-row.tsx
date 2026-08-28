"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DateInput from "@/components/date-input";

export type TeamRequest = {
  id: string;
  startDate: string;
  endDate: string;
  hours: number;
  notes: string | null;
  coverName: string | null;
  status: "pending" | "approved" | "denied" | "cancelled";
  submittedAt: string;
  decidedAt: string | null;
  userName: string;
  userEmail: string;
  decidedByName: string | null;
};

const STATUS_STYLES: Record<TeamRequest["status"], string> = {
  pending: "bg-pending/10 text-pending",
  approved: "bg-primary/10 text-primary",
  denied: "bg-declined/10 text-declined",
  cancelled: "bg-ink-soft/10 text-ink-soft",
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}
function toInputDate(iso: string) {
  return iso.slice(0, 10);
}

export default function TeamRequestRow({ request, zebra }: { request: TeamRequest; zebra: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [startDate, setStartDate] = useState(toInputDate(request.startDate));
  const [endDate, setEndDate] = useState(toInputDate(request.endDate));
  const [hours, setHours] = useState(String(request.hours));
  const [notes, setNotes] = useState(request.notes ?? "");
  const [coverName, setCoverName] = useState(request.coverName ?? "");

  async function call(body: Record<string, unknown>) {
    setError(null);
    setBusy(true);
    const res = await fetch(`/api/team/requests/${request.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "That didn't work.");
      return false;
    }
    router.refresh();
    return true;
  }

  const canAct = request.status === "pending" || request.status === "approved";

  if (editing) {
    return (
      <tr className={zebra ? "bg-card/40" : ""}>
        <td colSpan={5} className="px-5 py-4 border-t border-line">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
            <div>
              <label className="block text-xs text-ink-soft mb-1">Start</label>
              <DateInput value={startDate} onChange={setStartDate} />
            </div>
            <div>
              <label className="block text-xs text-ink-soft mb-1">End</label>
              <DateInput value={endDate} onChange={setEndDate} />
            </div>
            <div>
              <label className="block text-xs text-ink-soft mb-1">Hours</label>
              <input
                type="number"
                step="0.5"
                value={hours}
                onChange={(e) => setHours(e.target.value)}
                className="w-full rounded-lg border border-line px-2 py-1.5 text-sm font-mono"
              />
            </div>
            <div className="flex gap-2">
              <button
                disabled={busy}
                onClick={async () => {
                  const ok = await call({
                    action: "edit",
                    startDate,
                    endDate,
                    hours: parseFloat(hours),
                    notes,
                    coverName,
                  });
                  if (ok) setEditing(false);
                }}
                className="flex-1 rounded-lg bg-primary text-white text-sm py-1.5 hover:bg-header disabled:opacity-60"
              >
                Save
              </button>
              <button
                onClick={() => setEditing(false)}
                className="flex-1 rounded-lg border border-line text-sm py-1.5 hover:bg-card"
              >
                Cancel
              </button>
            </div>
            <div className="col-span-2 sm:col-span-4">
              <label className="block text-xs text-ink-soft mb-1">Notes</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-line px-2 py-1.5 text-sm"
              />
            </div>
            <div className="col-span-2 sm:col-span-4">
              <label className="block text-xs text-ink-soft mb-1">Covered by (if not a staff account)</label>
              <input
                value={coverName}
                onChange={(e) => setCoverName(e.target.value)}
                className="w-full rounded-lg border border-line px-2 py-1.5 text-sm"
              />
            </div>
          </div>
          {error && <p className="text-sm text-declined mt-2">{error}</p>}
        </td>
      </tr>
    );
  }

  return (
    <tr className={zebra ? "bg-card/40" : ""}>
      <td className="px-5 py-3 border-t border-line">
        <div className="font-medium">{request.userName}</div>
      </td>
      <td className="px-5 py-3 border-t border-line font-mono text-xs">
        {fmt(request.startDate)} – {fmt(request.endDate)}
      </td>
      <td className="px-5 py-3 border-t border-line font-mono">{request.hours}h</td>
      <td className="px-5 py-3 border-t border-line text-xs text-ink-soft max-w-[16rem] truncate">
        {request.notes || "—"}
        {request.coverName && <div className="text-ink not-italic">Covered by {request.coverName}</div>}
      </td>
      <td className="px-5 py-3 border-t border-line">
        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[request.status]}`}>
          {request.status}
        </span>
        {request.decidedByName && (
          <div className="text-[11px] text-ink-soft mt-0.5">by {request.decidedByName}</div>
        )}
      </td>
      <td className="px-5 py-3 border-t border-line">
        <div className="flex gap-3 justify-end text-xs flex-wrap">
          {request.status === "pending" && (
            <>
              <button
                disabled={busy}
                onClick={() => call({ action: "decide", decision: "approved" })}
                className="text-primary hover:underline disabled:opacity-60"
              >
                Approve
              </button>
              <button
                disabled={busy}
                onClick={() => call({ action: "decide", decision: "denied" })}
                className="text-declined hover:underline disabled:opacity-60"
              >
                Decline
              </button>
            </>
          )}
          {canAct && (
            <>
              <button onClick={() => setEditing(true)} className="text-coverage hover:underline">
                Edit
              </button>
              <button
                disabled={busy}
                onClick={() => call({ action: "cancel" })}
                className="text-ink-soft hover:underline disabled:opacity-60"
              >
                Cancel
              </button>
            </>
          )}
        </div>
        {error && <p className="text-xs text-declined mt-1 text-right">{error}</p>}
      </td>
    </tr>
  );
}