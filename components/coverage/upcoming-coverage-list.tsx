"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type CoverageAssignmentItem = { id: string; dateKey: string; userName: string };

function fmt(key: string) {
  return new Date(key + "T00:00:00.000Z").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export default function UpcomingCoverageList({ items }: { items: CoverageAssignmentItem[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function remove(id: string) {
    setError(null);
    setBusyId(id);
    const res = await fetch(`/api/coverage/${id}`, { method: "DELETE" });
    setBusyId(null);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Couldn't remove that.");
      return;
    }
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <div className="bg-white border border-line rounded-xl p-5 text-sm text-ink-soft">
        No coverage scheduled yet.
      </div>
    );
  }

  return (
    <div className="bg-white border border-line rounded-xl divide-y divide-line">
      {error && <p className="text-sm text-declined px-5 py-3">{error}</p>}
      {items.map((item) => (
        <div key={item.id} className="flex items-center justify-between px-5 py-3 text-sm">
          <div>
            <span className="font-mono">{fmt(item.dateKey)}</span>
            <span className="text-ink-soft"> — {item.userName}</span>
          </div>
          <button
            disabled={busyId === item.id}
            onClick={() => remove(item.id)}
            className="text-xs text-declined hover:underline disabled:opacity-60"
          >
            {busyId === item.id ? "Removing…" : "Remove"}
          </button>
        </div>
      ))}
    </div>
  );
}
