"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";
import type { CoverInfo } from "@/lib/cover";

function fmtShort(dateKey: string) {
  return new Date(dateKey + "T00:00:00.000Z").toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function LeaveChip({
  requestId,
  name,
  status,
  cover,
  canEdit,
  statusClass,
  dateLabel,
  dayKey,
  periodStart,
  periodEnd,
  staffList,
}: {
  requestId: string;
  name: string;
  status: "pending" | "approved" | "denied";
  cover: CoverInfo | null;
  canEdit: boolean;
  statusClass: string;
  dateLabel: string;
  dayKey: string;
  periodStart: string;
  periodEnd: string;
  staffList: { id: string; name: string }[];
}) {
  const router = useRouter();
  const showToast = useToast();
  const isMultiDay = periodStart !== periodEnd;
  const isApproved = status === "approved";

  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<"day" | "period" | null>(null);
  const [mode, setMode] = useState<"staff" | "external">(cover?.type === "external" ? "external" : "staff");
  const [staffUserId, setStaffUserId] = useState(cover?.type === "staff" ? cover.userId : "");
  const [externalName, setExternalName] = useState(cover?.type === "external" ? cover.name : "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openModal(e: React.MouseEvent) {
    e.stopPropagation();
    if (!canEdit) return;
    setMode(cover?.type === "external" ? "external" : "staff");
    setStaffUserId(cover?.type === "staff" ? cover.userId : "");
    setExternalName(cover?.type === "external" ? cover.name : "");
    setScope(isMultiDay ? null : "period");
    setError(null);
    setOpen(true);
  }

  async function submit(coverPayload: { type: "staff"; userId: string } | { type: "external"; name: string } | null) {
    if (!scope) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/leave/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set-cover", scope, date: dayKey, cover: coverPayload }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't save.");
      return;
    }
    setOpen(false);
    showToast(coverPayload ? "Cover updated" : "Cover removed");
    router.refresh();
  }

  function save() {
    if (mode === "staff") {
      if (!staffUserId) {
        setError("Pick a colleague.");
        return;
      }
      submit({ type: "staff", userId: staffUserId });
    } else {
      if (!externalName.trim()) {
        setError("Enter a name.");
        return;
      }
      submit({ type: "external", name: externalName.trim() });
    }
  }

  const coverBoxClass = !cover
    ? "bg-red-50 text-red-700 border border-dashed border-red-400"
    : "bg-coverage/20 text-coverage";

  return (
    <>
      <div
        onClick={openModal}
        className={`rounded overflow-hidden ${canEdit ? "cursor-pointer hover:ring-1 hover:ring-primary/50" : ""}`}
      >
        <div className={`truncate px-1 py-0.5 ${statusClass}`} title={canEdit ? "Click to manage cover" : `${name} (${status})`}>
          {name.split(" ")[0]}
        </div>
        {isApproved && (
          <div className={`truncate px-1 py-0.5 text-[9px] leading-tight ${coverBoxClass}`} title={cover ? `Covered by ${cover.name}` : "No cover yet"}>
            {cover ? cover.name.split(" ")[0] : "No cover yet"}
          </div>
        )}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div className="bg-white rounded-xl p-5 w-full max-w-xs shadow-lg" onClick={(e) => e.stopPropagation()}>
            {scope === null ? (
              <>
                <h3 className="text-sm font-medium text-ink mb-1">Cover for {name.split(" ")[0]}'s leave</h3>
                <p className="text-xs text-ink-soft mb-3">
                  Just {dateLabel}, or the whole period ({fmtShort(periodStart)} – {fmtShort(periodEnd)})?
                </p>
                <div className="flex flex-col gap-2">
                  <button
                    onClick={() => setScope("day")}
                    className="rounded-lg border border-line text-sm py-2 hover:bg-card"
                  >
                    Just this day
                  </button>
                  <button
                    onClick={() => setScope("period")}
                    className="rounded-lg border border-line text-sm py-2 hover:bg-card"
                  >
                    Whole period
                  </button>
                </div>
                <button onClick={() => setOpen(false)} className="w-full text-xs text-ink-soft mt-3 hover:underline">
                  Cancel
                </button>
              </>
            ) : (
              <>
                <h3 className="text-sm font-medium text-ink mb-0.5">Who's covering {name.split(" ")[0]}?</h3>
                <p className="text-xs text-ink-soft mb-3">
                  {scope === "day" ? dateLabel : `Whole period: ${fmtShort(periodStart)} – ${fmtShort(periodEnd)}`}
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
                      if (e.key === "Enter") save();
                      if (e.key === "Escape") setOpen(false);
                    }}
                  />
                )}

                {error && <p className="text-xs text-declined mb-2">{error}</p>}

                <div className="flex gap-2">
                  <button
                    disabled={saving}
                    onClick={save}
                    className="flex-1 rounded-lg bg-primary text-white text-sm py-1.5 hover:bg-header disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => (isMultiDay ? setScope(null) : setOpen(false))}
                    className="flex-1 rounded-lg border border-line text-sm py-1.5 hover:bg-card"
                  >
                    {isMultiDay ? "Back" : "Cancel"}
                  </button>
                </div>
                {cover && (
                  <button
                    disabled={saving}
                    onClick={() => submit(null)}
                    className="w-full text-xs text-declined mt-2 hover:underline disabled:opacity-60"
                  >
                    Remove cover
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}