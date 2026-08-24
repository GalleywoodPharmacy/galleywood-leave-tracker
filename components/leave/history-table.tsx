"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { LEAVE_TYPE_LABELS } from "@/lib/leave";

type LeaveRequestRow = {
  id: string;
  type: "annual" | "sick" | "other";
  startDate: string;
  endDate: string;
  hours: number;
  notes: string | null;
  status: "pending" | "approved" | "denied" | "cancelled";
  submittedAt: string;
};

const STATUS_STYLES: Record<LeaveRequestRow["status"], string> = {
  pending: "bg-pending/10 text-pending",
  approved: "bg-primary/10 text-primary",
  denied: "bg-declined/10 text-declined",
  cancelled: "bg-ink-soft/10 text-ink-soft",
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
}

export default function HistoryTable({ requests }: { requests: LeaveRequestRow[] }) {
  const router = useRouter();
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleWithdraw(id: string) {
    setError(null);
    setWithdrawingId(id);
    const res = await fetch(`/api/leave/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "withdraw" }),
    });
    setWithdrawingId(null);

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't withdraw that request.");
      return;
    }
    router.refresh();
  }

  if (requests.length === 0) {
    return (
      <div className="bg-white border border-line rounded-xl p-5 text-sm text-ink-soft">
        No leave requests yet.
      </div>
    );
  }

  return (
    <div className="bg-white border border-line rounded-xl overflow-hidden">
      {error && (
        <p className="text-sm text-declined px-5 pt-4" role="alert">
          {error}
        </p>
      )}
      <table className="w-full text-sm">
        <thead>
          <tr className="text-left text-ink-soft border-b border-line">
            <th className="px-5 py-3 font-medium">Type</th>
            <th className="px-5 py-3 font-medium">Dates</th>
            <th className="px-5 py-3 font-medium">Hours</th>
            <th className="px-5 py-3 font-medium">Status</th>
            <th className="px-5 py-3 font-medium"></th>
          </tr>
        </thead>
        <tbody>
          {requests.map((r, i) => (
            <tr key={r.id} className={i % 2 === 1 ? "bg-card/40" : ""}>
              <td className="px-5 py-3 border-t border-line">{LEAVE_TYPE_LABELS[r.type]}</td>
              <td className="px-5 py-3 border-t border-line font-mono text-xs">
                {formatDate(r.startDate)} – {formatDate(r.endDate)}
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
                    disabled={withdrawingId === r.id}
                    className="text-xs text-declined hover:underline disabled:opacity-60"
                  >
                    {withdrawingId === r.id ? "Withdrawing…" : "Withdraw"}
                  </button>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
