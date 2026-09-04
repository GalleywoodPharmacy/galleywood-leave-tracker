"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

type LeaveRequestRow = {
  id: string;
  startDate: string;
  endDate: string;
  hours: number;
  notes: string | null;
  status: "pending" | "approved" | "denied" | "cancelled";
  type: "annual" | "sick";
  submittedAt: string;
};

type OvertimeRow = {
  id: string;
  date: string;
  hours: number;
  notes: string | null;
};

const STATUS_STYLES: Record<LeaveRequestRow["status"], string> = {
  pending: "bg-pending/10 text-pending",
  approved: "bg-primary/10 text-primary",
  denied: "bg-declined/10 text-declined",
  cancelled: "bg-ink-soft/10 text-ink-soft",
};

const STATUS_OPTIONS = ["all", "pending", "approved", "denied", "cancelled"] as const;
const TYPE_OPTIONS = ["all", "annual", "sick", "overtime"] as const;

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

type CombinedRow =
  | { kind: "leave"; sortDate: number; data: LeaveRequestRow }
  | { kind: "overtime"; sortDate: number; data: OvertimeRow };

export default function HistoryTable({
  requests,
  overtimeEntries,
}: {
  requests: LeaveRequestRow[];
  overtimeEntries: OvertimeRow[];
}) {
  const router = useRouter();
  const showToast = useToast();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingOvertimeId, setEditingOvertimeId] = useState<string | null>(null);
  const [editHours, setEditHours] = useState("");
  const [editNotes, setEditNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<(typeof STATUS_OPTIONS)[number]>("all");
  const [typeFilter, setTypeFilter] = useState<(typeof TYPE_OPTIONS)[number]>("all");

  async function handleWithdraw(id: string) {
    setError(null);
    setBusyId(id);
    const res = await fetch(`/api/leave/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "withdraw" }),
    });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't withdraw that request.");
      return;
    }
    showToast("Request withdrawn");
    router.refresh();
  }

  function startEditOvertime(entry: OvertimeRow) {
    setEditingOvertimeId(entry.id);
    setEditHours(String(entry.hours));
    setEditNotes(entry.notes ?? "");
    setError(null);
  }

  async function saveOvertime(id: string) {
    const h = parseFloat(editHours);
    if (!h || h <= 0) {
      setError("Enter a valid number of hours.");
      return;
    }
    setError(null);
    setBusyId(id);
    const res = await fetch(`/api/overtime/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ hours: h, notes: editNotes }),
    });
    setBusyId(null);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Couldn't save that.");
      return;
    }
    showToast("Overtime updated");
    setEditingOvertimeId(null);
    router.refresh();
  }

  async function removeOvertime(id: string) {
    setError(null);
    setBusyId(id);
    const res = await fetch(`/api/overtime/${id}`, { method: "DELETE" });
    setBusyId(null);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Couldn't remove that.");
      return;
    }
    showToast("Overtime removed");
    router.refresh();
  }

  const filteredLeave =
    typeFilter === "overtime"
      ? []
      : requests.filter((r) => {
          if (typeFilter !== "all" && r.type !== typeFilter) return false;
          if (statusFilter !== "all" && r.status !== statusFilter) return false;
          return true;
        });

  // Overtime has no status of its own, so a specific status filter (with
  // Type left at "all") intentionally hides it — selecting Type: Overtime
  // explicitly always shows it regardless of the status filter's value.
  const filteredOvertime = (() => {
    if (typeFilter === "annual" || typeFilter === "sick") return [];
    if (typeFilter === "all" && statusFilter !== "all") return [];
    return overtimeEntries;
  })();

  const combined: CombinedRow[] = [
    ...filteredLeave.map((r) => ({ kind: "leave" as const, sortDate: new Date(r.startDate).getTime(), data: r })),
    ...filteredOvertime.map((o) => ({ kind: "overtime" as const, sortDate: new Date(o.date).getTime(), data: o })),
  ].sort((a, b) => b.sortDate - a.sortDate);

  const selectClasses =
    "rounded-lg border border-line bg-white px-2.5 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-accent";

  if (requests.length === 0 && overtimeEntries.length === 0) {
    return (
      <div className="bg-white border border-line rounded-xl p-5 text-sm text-ink-soft">
        No leave requests or overtime yet.
      </div>
    );
  }

  return (
    <div className="bg-white border border-line rounded-xl overflow-hidden">
      <div className="flex flex-wrap gap-2 items-center px-5 py-3 border-b border-line bg-page/60">
        <span className="text-xs text-ink-soft">Filter:</span>
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value as (typeof TYPE_OPTIONS)[number])}
          className={selectClasses}
        >
          <option value="all">All types</option>
          <option value="annual">Annual leave</option>
          <option value="sick">Sick leave</option>
          <option value="overtime">Overtime</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as (typeof STATUS_OPTIONS)[number])}
          disabled={typeFilter === "overtime"}
          className={`${selectClasses} disabled:opacity-50`}
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "all" ? "All statuses" : s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>
        {(statusFilter !== "all" || typeFilter !== "all") && (
          <button
            onClick={() => {
              setStatusFilter("all");
              setTypeFilter("all");
            }}
            className="text-xs text-declined hover:underline ml-auto"
          >
            Clear filters
          </button>
        )}
      </div>

      {error && (
        <p className="text-sm text-declined px-5 pt-4" role="alert">
          {error}
        </p>
      )}

      {combined.length === 0 ? (
        <div className="p-5 text-sm text-ink-soft">No entries match those filters.</div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-ink-soft border-b border-line">
              <th className="px-5 py-3 font-medium">Dates</th>
              <th className="px-5 py-3 font-medium">Hours</th>
              <th className="px-5 py-3 font-medium">Status</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {combined.map((row, i) => {
              const zebra = i % 2 === 1;

              if (row.kind === "leave") {
                const r = row.data;
                return (
                  <tr key={`l${r.id}`} className={zebra ? "bg-card/40" : ""}>
                    <td className="px-5 py-3 border-t border-line font-mono text-xs">
                      {formatDate(r.startDate)} – {formatDate(r.endDate)}
                      {r.type === "sick" && (
                        <span className="ml-1.5 inline-block px-1.5 py-0.5 rounded text-[10px] font-medium bg-purple-100 text-purple-700 align-middle">
                          Sick
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-3 border-t border-line font-mono">{r.hours}h</td>
                    <td className="px-5 py-3 border-t border-line">
                      <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_STYLES[r.status]}`}>
                        {r.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 border-t border-line text-right">
                      {(r.status === "pending" || r.status === "approved") && (
                        <button
                          onClick={() => handleWithdraw(r.id)}
                          disabled={busyId === r.id}
                          className="text-xs text-declined hover:underline disabled:opacity-60"
                        >
                          {busyId === r.id ? "Withdrawing…" : "Withdraw"}
                        </button>
                      )}
                    </td>
                  </tr>
                );
              }

              const o = row.data;

              if (editingOvertimeId === o.id) {
                return (
                  <tr key={`o${o.id}`} className={zebra ? "bg-card/40" : ""}>
                    <td colSpan={4} className="px-5 py-4 border-t border-line">
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
                        <div>
                          <label className="block text-xs text-ink-soft mb-1">Hours</label>
                          <input
                            type="number"
                            step="0.5"
                            value={editHours}
                            onChange={(e) => setEditHours(e.target.value)}
                            className="w-full rounded-lg border border-line px-2 py-1.5 text-sm font-mono"
                          />
                        </div>
                        <div className="col-span-2">
                          <label className="block text-xs text-ink-soft mb-1">Notes</label>
                          <input
                            value={editNotes}
                            onChange={(e) => setEditNotes(e.target.value)}
                            className="w-full rounded-lg border border-line px-2 py-1.5 text-sm"
                          />
                        </div>
                        <div className="flex gap-2">
                          <button
                            disabled={busyId === o.id}
                            onClick={() => saveOvertime(o.id)}
                            className="flex-1 rounded-lg bg-primary text-white text-sm py-1.5 hover:bg-header disabled:opacity-60"
                          >
                            Save
                          </button>
                          <button
                            onClick={() => setEditingOvertimeId(null)}
                            className="flex-1 rounded-lg border border-line text-sm py-1.5 hover:bg-card"
                          >
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
                <tr key={`o${o.id}`} className={zebra ? "bg-card/40" : ""}>
                  <td className="px-5 py-3 border-t border-line font-mono text-xs">{formatDate(o.date)}</td>
                  <td className="px-5 py-3 border-t border-line font-mono">+{o.hours}h</td>
                  <td className="px-5 py-3 border-t border-line">
                    <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                      Overtime
                    </span>
                  </td>
                  <td className="px-5 py-3 border-t border-line text-right">
                    <div className="flex gap-3 justify-end">
                      <button onClick={() => startEditOvertime(o)} className="text-xs text-coverage hover:underline">
                        Edit
                      </button>
                      <button
                        disabled={busyId === o.id}
                        onClick={() => removeOvertime(o.id)}
                        className="text-xs text-declined hover:underline disabled:opacity-60"
                      >
                        Remove
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}