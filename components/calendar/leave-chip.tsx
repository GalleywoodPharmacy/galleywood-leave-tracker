"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function LeaveChip({
  requestId,
  name,
  status,
  coverName,
  canEdit,
  statusClass,
  dateLabel,
}: {
  requestId: string;
  name: string;
  status: "pending" | "approved" | "denied";
  coverName: string | null;
  canEdit: boolean;
  statusClass: string;
  dateLabel: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState(coverName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function save() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/leave/${requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set-cover-name", coverName: value }),
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
        onClick={() => canEdit && setOpen(true)}
        className={`truncate rounded px-1 py-0.5 ${statusClass} ${
          canEdit ? "cursor-pointer hover:ring-1 hover:ring-primary/50" : ""
        }`}
        title={canEdit ? "Click to add who's covering" : `${name} (${status})`}
      >
        {name.split(" ")[0]}
      </div>
      {coverName && (
        <div className="text-[9px] text-coverage truncate leading-tight" title={`Covered by ${coverName}`}>
          ↳ {coverName}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div className="bg-white rounded-xl p-5 w-full max-w-xs shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-medium text-ink mb-0.5">Who's covering {name.split(" ")[0]}?</h3>
            <p className="text-xs text-ink-soft mb-3">{dateLabel}</p>
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
                onClick={() => setOpen(false)}
                className="flex-1 rounded-lg border border-line text-sm py-1.5 hover:bg-card"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}