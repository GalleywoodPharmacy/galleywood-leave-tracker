"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

export type NeedsCoverageItem = { requestId: string; dateKey: string; name: string };

function fmt(key: string) {
  return new Date(key + "T00:00:00.000Z").toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
}

export default function NeedsCoverageList({
  items,
  isManager,
  staffList,
}: {
  items: NeedsCoverageItem[];
  isManager: boolean;
  staffList: { id: string; name: string }[];
}) {
  const router = useRouter();
  const showToast = useToast();
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [mode, setMode] = useState<"staff" | "external">("staff");
  const [staffUserId, setStaffUserId] = useState("");
  const [externalName, setExternalName] = useState("");

  async function submitCover(
    item: NeedsCoverageItem,
    coverPayload: { type: "staff"; userId: string } | { type: "external"; name: string }
  ) {
    const key = item.requestId + item.dateKey;
    setError(null);
    setBusyKey(key);
    const res = await fetch(`/api/leave/${item.requestId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "set-cover", scope: "day", date: item.dateKey, cover: coverPayload }),
    });
    setBusyKey(null);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Couldn't cover that day.");
      return;
    }
    showToast("Cover assigned");
    setExpandedKey(null);
    router.refresh();
  }

  async function coverSelf(item: NeedsCoverageItem) {
    await submitCover(item, { type: "staff", userId: "self" });
  }

  function startAssign(item: NeedsCoverageItem) {
    const key = item.requestId + item.dateKey;
    setExpandedKey(key);
    setMode("staff");
    setStaffUserId("");
    setExternalName("");
    setError(null);
  }

  function saveAssign(item: NeedsCoverageItem) {
    if (mode === "staff") {
      if (!staffUserId) {
        setError("Pick a colleague.");
        return;
      }
      submitCover(item, { type: "staff", userId: staffUserId });
    } else {
      if (!externalName.trim()) {
        setError("Enter a name.");
        return;
      }
      submitCover(item, { type: "external", name: externalName.trim() });
    }
  }

  if (items.length === 0) {
    return (
      <div className="bg-white border border-line rounded-xl p-5 text-sm text-ink-soft">
        No coverage gaps. 🎉
      </div>
    );
  }

  return (
    <div className="bg-white border border-line rounded-xl divide-y divide-line">
      {error && <p className="text-sm text-declined px-5 py-3">{error}</p>}
      {items.map((item) => {
        const key = item.requestId + item.dateKey;
        const expanded = expandedKey === key;

        return (
          <div key={key} className="px-5 py-3">
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="font-mono text-sm">{fmt(item.dateKey)}</div>
                <div className="text-xs text-ink-soft">{item.name} away — no cover yet</div>
              </div>
              {!expanded &&
                (isManager ? (
                  <button
                    disabled={busyKey === key}
                    onClick={() => startAssign(item)}
                    className="text-sm rounded-lg bg-coverage text-white px-3 py-1.5 hover:opacity-90 disabled:opacity-60"
                  >
                    Assign cover
                  </button>
                ) : (
                  <button
                    disabled={busyKey === key}
                    onClick={() => coverSelf(item)}
                    className="text-sm rounded-lg bg-coverage text-white px-3 py-1.5 hover:opacity-90 disabled:opacity-60"
                  >
                    {busyKey === key ? "Adding…" : "I'll cover this"}
                  </button>
                ))}
            </div>

            {expanded && (
              <div className="mt-3 space-y-2">
                <div className="flex gap-1 text-xs">
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
                    Someone else (e.g. locum)
                  </button>
                </div>

                {mode === "staff" ? (
                  <select
                    autoFocus
                    value={staffUserId}
                    onChange={(e) => setStaffUserId(e.target.value)}
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
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
                    className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                    onKeyDown={(e) => {
                      if (e.key === "Enter") saveAssign(item);
                    }}
                  />
                )}

                {error && <p className="text-xs text-declined">{error}</p>}

                <div className="flex gap-2">
                  <button
                    disabled={busyKey === key}
                    onClick={() => saveAssign(item)}
                    className="flex-1 rounded-lg bg-primary text-white text-sm py-1.5 hover:bg-header disabled:opacity-60"
                  >
                    {busyKey === key ? "Saving…" : "Save"}
                  </button>
                  <button
                    onClick={() => setExpandedKey(null)}
                    className="flex-1 rounded-lg border border-line text-sm py-1.5 hover:bg-card"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}