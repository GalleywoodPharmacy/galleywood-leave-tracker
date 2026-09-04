"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

export type TeamOvertime = {
  id: string;
  date: string;
  hours: number;
  notes: string | null;
  userName: string;
};

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function TeamOvertimeRow({ entry, zebra }: { entry: TeamOvertime; zebra: boolean }) {
  const router = useRouter();
  const showToast = useToast();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hours, setHours] = useState(String(entry.hours));
  const [notes, setNotes] = useState(entry.notes ?? "");

  async function save() {
    const h = parseFloat(hours);
    if (!h || h <= 0) {
      setError("Enter a valid number of hours.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/overtime/${entry.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hours: h, notes }),
    });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "That didn't work.");
      return;
    }
    showToast("Overtime updated");
    setEditing(false);
    router.refresh();
  }

  async function remove() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/overtime/${entry.id}`, { method: "DELETE" });
    setBusy(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "That didn't work.");
      return;
    }
    showToast("Overtime removed");
    router.refresh();
  }

  if (editing) {
    return (
      <tr className={zebra ? "bg-card/40" : ""}>
        <td colSpan={6} className="px-5 py-4 border-t border-line">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
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
            <div className="col-span-2">
              <label className="block text-xs text-ink-soft mb-1">Notes</label>
              <input
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full rounded-lg border border-line px-2 py-1.5 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                disabled={busy}
                onClick={save}
                className="flex-1 rounded-lg bg-primary text-white text-sm py-1.5 hover:bg-header disabled:opacity-60"
              >
                Save
              </button>
              <button onClick={() => setEditing(false)} className="flex-1 rounded-lg border border-line text-sm py-1.5 hover:bg-card">
                Cancel
              </button>
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
        <div className="font-medium">{entry.userName}</div>
      </td>
      <td className="px-5 py-3 border-t border-line font-mono text-xs">{fmt(entry.date)}</td>
      <td className="px-5 py-3 border-t border-line font-mono">+{entry.hours}h</td>
      <td className="px-5 py-3 border-t border-line text-xs text-ink-soft max-w-[16rem] truncate">
        {entry.notes || "—"}
      </td>
      <td className="px-5 py-3 border-t border-line">
        <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
          Overtime
        </span>
      </td>
      <td className="px-5 py-3 border-t border-line">
        <div className="flex gap-3 justify-end text-xs">
          <button onClick={() => setEditing(true)} className="text-coverage hover:underline">
            Edit
          </button>
          <button disabled={busy} onClick={remove} className="text-declined hover:underline disabled:opacity-60">
            Remove
          </button>
        </div>
        {error && <p className="text-xs text-declined mt-1 text-right">{error}</p>}
      </td>
    </tr>
  );
}