"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export type NeedsCoverageItem = { requestId: string; dateKey: string; name: string };

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

  async function cover(item: NeedsCoverageItem) {
    const key = item.requestId + item.dateKey;
    setError(null);
    setBusyKey(key);
    const res = await fetch(`/api/leave/${item.requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "set-cover",
        scope: "day",
        date: item.dateKey,
        cover: { type: "staff", userId: "self" },
      }),
    });
    setBusyKey(null);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Couldn't cover that day.");
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
      {items.map((item) => {
        const key = item.requestId + item.dateKey;
        return (
          <div key={key} className="flex items-center justify-between px-5 py-3">
            <div>
              <div className="font-mono text-sm">{fmt(item.dateKey)}</div>
              <div className="text-xs text-ink-soft">{item.name} away — no cover yet</div>
            </div>
            <button
              disabled={busyKey === key}
              onClick={() => cover(item)}
              className="text-sm rounded-lg bg-coverage text-white px-3 py-1.5 hover:opacity-90 disabled:opacity-60"
            >
              {busyKey === key ? "Adding…" : "I'll cover this"}
            </button>
          </div>
        );
      })}
    </div>
  );
}