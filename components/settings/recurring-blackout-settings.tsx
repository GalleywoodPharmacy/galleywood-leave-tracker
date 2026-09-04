"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

export default function RecurringBlackoutSettings({
  config,
}: {
  config: {
    preChristmasBlackoutEnabled: boolean;
    preChristmasBlackoutWeeks: number;
    preEasterBlackoutEnabled: boolean;
    preEasterBlackoutWeeks: number;
  };
}) {
  const router = useRouter();
  const showToast = useToast();

  const [christmasEnabled, setChristmasEnabled] = useState(config.preChristmasBlackoutEnabled);
  const [christmasWeeks, setChristmasWeeks] = useState(String(config.preChristmasBlackoutWeeks));
  const [easterEnabled, setEasterEnabled] = useState(config.preEasterBlackoutEnabled);
  const [easterWeeks, setEasterWeeks] = useState(String(config.preEasterBlackoutWeeks));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    const cWeeks = parseInt(christmasWeeks, 10);
    const eWeeks = parseInt(easterWeeks, 10);
    if (isNaN(cWeeks) || cWeeks < 0 || isNaN(eWeeks) || eWeeks < 0) {
      setError("Enter a valid number of weeks for each.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/settings/organization", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        preChristmasBlackoutEnabled: christmasEnabled,
        preChristmasBlackoutWeeks: cWeeks,
        preEasterBlackoutEnabled: easterEnabled,
        preEasterBlackoutWeeks: eWeeks,
      }),
    });
    setSubmitting(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Couldn't save that.");
      return;
    }
    showToast("Saved");
    router.refresh();
  }

  return (
    <div className="bg-white border border-line rounded-xl p-5 space-y-3">
      <h3 className="text-sm font-medium text-ink">Recurring seasonal blackouts</h3>
      <p className="text-xs text-ink-soft">
        Computed fresh every year automatically — no need to re-add these. Ends the day before Christmas / Good
        Friday and stretches back the number of weeks below.
      </p>

      <div className="flex items-center gap-3 flex-wrap">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={christmasEnabled} onChange={(e) => setChristmasEnabled(e.target.checked)} className="rounded border-line" />
          Pre-Christmas
        </label>
        <input
          type="number"
          min="0"
          max="12"
          value={christmasWeeks}
          onChange={(e) => setChristmasWeeks(e.target.value)}
          disabled={!christmasEnabled}
          className="w-16 rounded-lg border border-line px-2 py-1 text-sm font-mono disabled:opacity-50"
        />
        <span className="text-xs text-ink-soft">week(s) before</span>
      </div>

      <div className="flex items-center gap-3 flex-wrap">
        <label className="flex items-center gap-2 text-sm text-ink">
          <input type="checkbox" checked={easterEnabled} onChange={(e) => setEasterEnabled(e.target.checked)} className="rounded border-line" />
          Pre-Easter
        </label>
        <input
          type="number"
          min="0"
          max="12"
          value={easterWeeks}
          onChange={(e) => setEasterWeeks(e.target.value)}
          disabled={!easterEnabled}
          className="w-16 rounded-lg border border-line px-2 py-1 text-sm font-mono disabled:opacity-50"
        />
        <span className="text-xs text-ink-soft">week(s) before</span>
      </div>

      {error && <p className="text-sm text-declined">{error}</p>}

      <button
        onClick={handleSave}
        disabled={submitting}
        className="rounded-lg bg-primary text-white text-sm font-medium px-4 py-2 hover:bg-header disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Save"}
      </button>
    </div>
  );
}