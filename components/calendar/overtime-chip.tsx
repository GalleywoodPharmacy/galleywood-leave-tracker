"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

export default function OvertimeChip({
  entryId,
  name,
  hours,
  notes,
  canEdit,
}: {
  entryId: string;
  name: string;
  hours: number;
  notes: string | null;
  canEdit: boolean;
}) {
  const router = useRouter();
  const showToast = useToast();
  const [open, setOpen] = useState(false);
  const [editHours, setEditHours] = useState(String(hours));
  const [editNotes, setEditNotes] = useState(notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function openModal(e: React.MouseEvent) {
    e.stopPropagation();
    if (!canEdit) return;
    setEditHours(String(hours));
    setEditNotes(notes ?? "");
    setError(null);
    setOpen(true);
  }

  async function save() {
    const h = parseFloat(editHours);
    if (!h || h <= 0) {
      setError("Enter a valid number of hours.");
      return;
    }
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/overtime/${entryId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hours: h, notes: editNotes }),
    });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't save.");
      return;
    }
    setOpen(false);
    showToast("Overtime updated");
    router.refresh();
  }

  async function remove() {
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/overtime/${entryId}`, { method: "DELETE" });
    setSaving(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't remove.");
      return;
    }
    setOpen(false);
    showToast("Overtime removed");
    router.refresh();
  }

  return (
    <>
      <div
        onClick={openModal}
        className={`truncate rounded px-1 py-0.5 text-[9px] bg-green-100 text-green-700 ${
          canEdit ? "cursor-pointer hover:ring-1 hover:ring-primary/50" : ""
        }`}
        title={canEdit ? "Click to edit overtime" : `${name} — +${hours}h overtime${notes ? ` — ${notes}` : ""}`}
      >
        +{hours}h {name.split(" ")[0]}
      </div>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-ink/40 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div className="bg-white rounded-xl p-5 w-full max-w-xs shadow-lg" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-sm font-medium text-ink mb-3">Edit overtime — {name.split(" ")[0]}</h3>

            <label className="block text-xs text-ink-soft mb-1">Hours</label>
            <input
              type="number"
              step="0.5"
              min="0"
              value={editHours}
              onChange={(e) => setEditHours(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-accent"
            />

            <label className="block text-xs text-ink-soft mb-1">Notes (optional)</label>
            <input
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm mb-2 focus:outline-none focus:ring-2 focus:ring-accent"
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
              <button onClick={() => setOpen(false)} className="flex-1 rounded-lg border border-line text-sm py-1.5 hover:bg-card">
                Cancel
              </button>
            </div>
            <button
              disabled={saving}
              onClick={remove}
              className="w-full text-xs text-declined mt-2 hover:underline disabled:opacity-60"
            >
              Remove entry
            </button>
          </div>
        </div>
      )}
    </>
  );
}