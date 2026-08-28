"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

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
  coverName,
  canEdit,
  statusClass,
  dateLabel,
  dayKey,
  periodStart,
  periodEnd,
}: {
  requestId: string;
  name: string;
  status: "pending" | "approved" | "denied";
  coverName: string | null;
  canEdit: boolean;
  statusClass: string;
  dateLabel: string;
  dayKey: string;
  periodStart: string;
  periodEnd: string;
}) {
  const router = useRouter();
  const isMultiDay = periodStart !== periodEnd;

  const [open, setOpen] = useState(false);
  const [scope, setScope] = useState<"day" | "period" | null>(null);
  const [value, setValue] = useState(coverName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openModal() {
    if (!canEdit) return;
    setValue(coverName ?? "");
    setScope(isMultiDay ? null : "period");
    setError(null);
    setOpen(true);
  }

  async function save() {
    if (!scope) return;
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/leave/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set-cover-name", coverName: value, scope, date: dayKey }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't save.");
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <>
      <div
        onClick={openModal}
        className={`truncate rounded px-1 py-0.5 ${statusClass} ${
          canEdit ? "cursor-pointer hover:ring-1 hover:ring-primary/50" : ""
        }`}
        title={canEdit ? "Click to add who's covering" : `${name} (${status})`}
      >
        {name.split(" ")[0]}
      </div>
      {coverName && (
        <div className="ml-1 pl-1.5 border-l-2 border-coverage/40 mt-0.5">
          <div className="text-[9px] text-coverage truncate leading-tight" title={`Covered by ${coverName}`}>
            {coverName}
          </div>
        </div>
      )}

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
                <input
                  autoFocus
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  placeholder="Name"
                  className="w-full rounded-lg border border-line px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-accent"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") save();
                    if (e.key === "Escape") setOpen(false);
                  }}
                />
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
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}