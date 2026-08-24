"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type NeedsCoverageItem = { key: string; namesOnLeave: string[] };

function fmt(key: string) {
  return new Date(key + "T00:00:00.000Z").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export default function NeedsCoverageList({ items }: { items: NeedsCoverageItem[] }) {
  const router = useRouter();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function cover(dateKey: string) {
    setError(null);
    setBusyKey(dateKey);
    const res = await fetch("/api/coverage", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ date: dateKey }),
    });
    setBusyKey(null);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Couldn't add you to that date.");
      return;
    }
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <div className="bg-white border border-line rounded-xl p-5 text-sm text-ink-soft">
        No coverage gaps in the next 60 days. 🎉
      </div>
    );
  }

  return (
    <div className="bg-white border border-line rounded-xl divide-y divide-line">
      {error && <p className="text-sm text-declined px-5 py-3">{error}</p>}
      {items.map((item) => (
        <div key={item.key} className="flex items-center justify-between px-5 py-3">
          <div>
            <div className="font-mono text-sm">{fmt(item.key)}</div>
            <div className="text-xs text-ink-soft">{item.namesOnLeave.join(", ")} away — no cover yet</div>
          </div>
          <button
            disabled={busyKey === item.key}
            onClick={() => cover(item.key)}
            className="text-sm rounded-lg bg-coverage text-white px-3 py-1.5 hover:opacity-90 disabled:opacity-60"
          >
            {busyKey === item.key ? "Adding…" : "I'll cover this"}
          </button>
        </div>
      ))}
    </div>
  );
}
