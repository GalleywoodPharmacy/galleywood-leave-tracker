"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DateInput from "@/components/date-input";
import { useToast } from "@/components/toast-provider";
import type { CoverInfo } from "@/lib/cover";

function fmtShort(dateKey: string) {
  return new Date(dateKey + "T00:00:00.000Z").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

type View = "menu" | "cover-scope" | "cover-pick" | "edit" | "confirm-decline" | "confirm-cancel" | "confirm-withdraw";

export default function LeaveChip({
  requestId,
  userId,
  currentUserId,
  isManager,
  name,
  status,
  type,
  cover,
  canEdit,
  statusClass,
  dateLabel,
  dayKey,
  periodStart,
  periodEnd,
  hours,
  notes,
  staffList,
}: {
  requestId: string;
  userId: string;
  currentUserId: string;
  isManager: boolean;
  name: string;
  status: "pending" | "approved" | "denied";
  type: "annual" | "sick";
  cover: CoverInfo | null;
  canEdit: boolean;
  statusClass: string;
  dateLabel: string;
  dayKey: string;
  periodStart: string;
  periodEnd: string;
  hours: number;
  notes: string | null;
  staffList: { id: string; name: string }[];
}) {
  const router = useRouter();
  const showToast = useToast();
  const isMultiDay = periodStart !== periodEnd;
  const isApproved = status === "approved";
  const isPending = status === "pending";
  const isSick = type === "sick";
  const isOwner = userId === currentUserId;
  const canAct = isPending || isApproved;

  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>("menu");
  const [scopeChoice, setScopeChoice] = useState<"day" | "period" | null>(null);
  const [mode, setMode] = useState<"staff" | "external">(cover?.type === "external" ? "external" : "staff");
  const [staffUserId, setStaffUserId] = useState(cover?.type === "staff" ? cover.userId : "");
  const [externalName, setExternalName] = useState(cover?.type === "external" ? cover.name : "");
  const [editStart, setEditStart] = useState(periodStart);
  const [editEnd, setEditEnd] = useState(periodEnd);
  const [editHours, setEditHours] = useState(String(hours));
  const [editNotes, setEditNotes] = useState(notes ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openModal(e: React.MouseEvent) {
    e.stopPropagation();
    if (!canEdit) return;
    setMode(cover?.type === "external" ? "external" : "staff");
    setStaffUserId(cover?.type === "staff" ? cover.userId : "");
    setExternalName(cover?.type === "external" ? cover.name : "");
    setEditStart(periodStart);
    setEditEnd(periodEnd);
    setEditHours(String(hours));
    setEditNotes(notes ?? "");
    setError(null);
    setView("menu");
    setOpen(true);
  }

  async function submitCover(coverPayload: { type: "staff"; userId: string } | { type: "external"; name: string } | null) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/leave/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set-cover", scope: isMultiDay ? scopeChoice : "period", date: dayKey, cover: coverPayload }),
    });
    setBusy(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't save.");
      return;
    }
    setOpen(false);
    showToast(coverPayload ? "Cover updated" : "Cover removed");
    router.refresh();
  }

  function saveCover() {
    if (mode === "staff") {
      if (!staffUserId) {
        setError("Pick a colleague.");
        return;
      }
      submitCover({ type: "staff", userId: staffUserId });
    } else {
      if (!externalName.trim()) {
        setError("Enter a name.");
        return;
      }
      submitCover({ type: "external", name: externalName.trim() });
    }
  }

  async function callTeamAction(body: Record<string, unknown>, successMessage: string) {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/team/requests/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "That didn't work.");
      return;
    }
    setOpen(false);
    showToast(successMessage);
    router.refresh();
  }

  async function saveEdit() {
    const h = parseFloat(editHours);
    if (!editStart || !editEnd || isNaN(h) || h <= 0) {
      setError("Fill in valid dates and hours.");
      return;
    }
    await callTeamAction(
      { action: "edit", startDate: editStart, endDate: editEnd, hours: h, notes: editNotes },
      "Changes saved"
    );
  }

  async function withdraw() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/leave/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "withdraw" }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "That didn't work.");
      return;
    }
    setOpen(false);
    showToast("Leave withdrawn");
    router.refresh();
  }

  const coverBoxClass = !cover
    ? "bg-red-50 text-red-700 border border-dashed border-red-400"
    : "bg-coverage/20 text-coverage";
  const nameClass = isSick ? "bg-purple-100 text-purple-700" : statusClass;

  return (
    <>
      <div
        onClick={openModal}
        className={`rounded overflow-hidden ${canEdit ? "cursor-pointer hover:ring-1 hover:ring-primary/50" : ""}`}
      >
        <div className={`truncate px-1 py-0.5 ${nameClass}`} title={canEdit ? "Click to manage" : `${name} (${isSick ? "sick" : status})`}>
          {name.split(" ")[0]} {isSick && <span className="opacity-75">· sick</span>}
        </div>
        {isApproved && (
          <div className={`truncate px-1 py-0.5 text-[9px] leading-tight ${coverBoxClass}`} title={cover ? `Covered by ${cover.name}` : "No cover yet"}>
            {cover ? cover.name.split(" ")[0] : "No cover yet"}
          </div>
        )}
      </div>

      {open && (
        <div className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4" onClick={() => setOpen(false)}>
          <div className="bg-white rounded-xl p-5 w-full max-w-sm shadow-lg" onClick={(e) => e.stopPropagation()}>
            {view === "menu" && (
              <>
                <h3 className="text-sm font-medium text-ink mb-0.5">
                  {name}'s {isSick ? "sick leave" : "leave"}
                </h3>
                <p className="text-xs text-ink-soft mb-3">
                  {fmtShort(periodStart)} – {fmtShort(periodEnd)} · {hours}h
                  {!isSick && <span className="capitalize"> · {status}</span>}
                </p>

                <div className="flex flex-col gap-2">
                  {isApproved && (isOwner || isManager) && (
                    <button
                      onClick={() => setView(isMultiDay ? "cover-scope" : "cover-pick")}
                      className="rounded-lg border border-line text-sm py-2 hover:bg-card text-left px-3"
                    >
                      Manage cover
                    </button>
                  )}
                  {isManager && (
                    <button
                      onClick={() => setView("edit")}
                      className="rounded-lg border border-line text-sm py-2 hover:bg-card text-left px-3"
                    >
                      Edit details
                    </button>
                  )}
                  {isManager && isPending && (
                    <button
                      disabled={busy}
                      onClick={() => callTeamAction({ action: "decide", decision: "approved" }, "Request approved")}
                      className="rounded-lg bg-primary text-white text-sm py-2 hover:bg-header disabled:opacity-60"
                    >
                      Approve
                    </button>
                  )}
                  {isManager && isPending && (
                    <button
                      onClick={() => setView("confirm-decline")}
                      className="rounded-lg border border-declined text-declined text-sm py-2 hover:bg-declined/5"
                    >
                      Decline
                    </button>
                  )}
                  {isManager && canAct && (
                    <button
                      onClick={() => setView("confirm-cancel")}
                      className="text-xs text-ink-soft hover:underline mt-1"
                    >
                      Cancel this leave
                    </button>
                  )}
                  {!isManager && isOwner && canAct && (
                    <button
                      onClick={() => setView("confirm-withdraw")}
                      className="text-xs text-ink-soft hover:underline mt-1"
                    >
                      Withdraw
                    </button>
                  )}
                </div>
                <button onClick={() => setOpen(false)} className="w-full text-xs text-ink-soft mt-3 hover:underline">
                  Close
                </button>
                {error && <p className="text-xs text-declined mt-2">{error}</p>}
              </>
            )}

            {view === "cover-scope" && (
              <>
                <h3 className="text-sm font-medium text-ink mb-1">Cover for {name.split(" ")[0]}'s leave</h3>
                <p className="text-xs text-ink-soft mb-3">
                  Just {dateLabel}, or the whole period ({fmtShort(periodStart)} – {fmtShort(periodEnd)})?
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => {
                      setScopeChoice("day");
                      setView("cover-pick");
                    }}
                    className="rounded-lg border border-line text-sm py-2 hover:bg-card"
                  >
                    Just this day
                  </button>
                  <button
                    onClick={() => {
                      setScopeChoice("period");
                      setView("cover-pick");
                    }}
                    className="rounded-lg border border-line text-sm py-2 hover:bg-card"
                  >
                    Whole period
                  </button>
                </div>
                <button onClick={() => setView("menu")} className="w-full text-xs text-ink-soft mt-3 hover:underline">
                  Back
                </button>
              </>
            )}

            {view === "cover-pick" && (
              <>
                <h3 className="text-sm font-medium text-ink mb-0.5">Who's covering {name.split(" ")[0]}?</h3>
                <p className="text-xs text-ink-soft mb-3">
                  {scopeChoice === "day" ? dateLabel : `Whole period: ${fmtShort(periodStart)} – ${fmtShort(periodEnd)}`}
                </p>

                <div className="flex gap-1 mb-3 text-xs">
                  <button
                    onClick={() => setMode("staff")}
                    className={`flex-1 rounded-lg py-1.5 border ${mode === "staff" ? "bg-primary text-white border-primary" : "border-line hover:bg-card"}`}
                  >
                    Colleague
                  </button>
                  <button
                    onClick={() => setMode("external")}
                    className={`flex-1 rounded-lg py-1.5 border ${mode === "external" ? "bg-primary text-white border-primary" : "border-line hover:bg-card"}`}
                  >
                    Someone else
                  </button>
                </div>

                {mode === "staff" ? (
                  <select
                    autoFocus
                    value={staffUserId}
                    onChange={(e) => setStaffUserId(e.target.value)}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-accent"
                  >
                    <option value="">Choose…</option>
                    {staffList.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    autoFocus
                    value={externalName}
                    onChange={(e) => setExternalName(e.target.value)}
                    placeholder="Name"
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-accent"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveCover();
                      if (e.key === "Escape") setOpen(false);
                    }}
                  />
                )}

                {error && <p className="text-xs text-declined mb-2">{error}</p>}

                <div className="flex gap-2">
                  <button
                    disabled={busy}
                    onClick={saveCover}
                    className="flex-1 rounded-lg bg-primary text-white text-sm py-1.5 hover:bg-header disabled:opacity-60"
                  >
                    {busy ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => (isMultiDay ? setView("cover-scope") : setView("menu"))}
                    className="flex-1 rounded-lg border border-line text-sm py-1.5 hover:bg-card"
                  >
                    Back
                  </button>
                </div>
                {cover && (
                  <button
                    disabled={busy}
                    onClick={() => submitCover(null)}
                    className="w-full text-xs text-declined mt-2 hover:underline disabled:opacity-60"
                  >
                    Remove cover
                  </button>
                )}
              </>
            )}

            {view === "edit" && (
              <>
                <h3 className="text-sm font-medium text-ink mb-3">Edit {name.split(" ")[0]}'s leave</h3>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <label className="block text-xs text-ink-soft mb-1">Start</label>
                    <DateInput value={editStart} onChange={setEditStart} />
                  </div>
                  <div>
                    <label className="block text-xs text-ink-soft mb-1">End</label>
                    <DateInput value={editEnd} onChange={setEditEnd} />
                  </div>
                </div>
                <div className="mb-2">
                  <label className="block text-xs text-ink-soft mb-1">Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    value={editHours}
                    onChange={(e) => setEditHours(e.target.value)}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm font-mono"
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-xs text-ink-soft mb-1">Notes</label>
                  <input
                    value={editNotes}
                    onChange={(e) => setEditNotes(e.target.value)}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm"
                  />
                </div>
                {error && <p className="text-xs text-declined mb-2">{error}</p>}
                <div className="flex gap-2">
                  <button
                    disabled={busy}
                    onClick={saveEdit}
                    className="flex-1 rounded-lg bg-primary text-white text-sm py-1.5 hover:bg-header disabled:opacity-60"
                  >
                    {busy ? "Saving…" : "Save"}
                  </button>
                  <button onClick={() => setView("menu")} className="flex-1 rounded-lg border border-line text-sm py-1.5 hover:bg-card">
                    Back
                  </button>
                </div>
              </>
            )}

            {view === "confirm-decline" && (
              <>
                <p className="text-sm text-ink mb-4">Decline this leave request?</p>
                {error && <p className="text-xs text-declined mb-2">{error}</p>}
                <div className="flex gap-2">
                  <button
                    disabled={busy}
                    onClick={() => callTeamAction({ action: "decide", decision: "denied" }, "Request declined")}
                    className="flex-1 rounded-lg bg-declined text-white text-sm py-1.5 hover:opacity-90 disabled:opacity-60"
                  >
                    {busy ? "…" : "Yes, decline"}
                  </button>
                  <button onClick={() => setView("menu")} className="flex-1 rounded-lg border border-line text-sm py-1.5 hover:bg-card">
                    Back
                  </button>
                </div>
              </>
            )}

            {view === "confirm-cancel" && (
              <>
                <p className="text-sm text-ink mb-4">Cancel this leave? This can't be undone.</p>
                {error && <p className="text-xs text-declined mb-2">{error}</p>}
                <div className="flex gap-2">
                  <button
                    disabled={busy}
                    onClick={() => callTeamAction({ action: "cancel" }, "Request cancelled")}
                    className="flex-1 rounded-lg bg-declined text-white text-sm py-1.5 hover:opacity-90 disabled:opacity-60"
                  >
                    {busy ? "…" : "Yes, cancel"}
                  </button>
                  <button onClick={() => setView("menu")} className="flex-1 rounded-lg border border-line text-sm py-1.5 hover:bg-card">
                    Back
                  </button>
                </div>
              </>
            )}

            {view === "confirm-withdraw" && (
              <>
                <p className="text-sm text-ink mb-4">Withdraw this leave request?</p>
                {error && <p className="text-xs text-declined mb-2">{error}</p>}
                <div className="flex gap-2">
                  <button
                    disabled={busy}
                    onClick={withdraw}
                    className="flex-1 rounded-lg bg-declined text-white text-sm py-1.5 hover:opacity-90 disabled:opacity-60"
                  >
                    {busy ? "…" : "Yes, withdraw"}
                  </button>
                  <button onClick={() => setView("menu")} className="flex-1 rounded-lg border border-line text-sm py-1.5 hover:bg-card">
                    Back
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}