"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import DateInput from "@/components/date-input";
import { useToast } from "@/components/toast-provider";

export default function SaturdayTeamsSettings({
  config,
}: {
  config: {
    enabled: boolean;
    anchorDateKey: string | null;
    teamANames: string[];
    teamBNames: string[];
  };
}) {
  const router = useRouter();
  const showToast = useToast();

  const [enabled, setEnabled] = useState(config.enabled);
  const [anchorDate, setAnchorDate] = useState(config.anchorDateKey ?? "");
  const [teamANames, setTeamANames] = useState(config.teamANames.join(", "));
  const [teamBNames, setTeamBNames] = useState(config.teamBNames.join(", "));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSave() {
    setError(null);
    if (enabled && (!anchorDate || !teamANames.trim() || !teamBNames.trim())) {
      setError("Fill in an anchor date and both teams' names, or switch this off.");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/settings/organization", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        saturdayTeamsEnabled: enabled,
        saturdayTeamAnchorDate: anchorDate,
        saturdayTeamANames: teamANames,
        saturdayTeamBNames: teamBNames,
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
      <label className="flex items-center gap-2 text-sm font-medium text-ink">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} className="rounded border-line" />
        Alternating Saturday teams
      </label>
      <p className="text-xs text-ink-soft">
        Two rotating groups of named staff shown on the Calendar, swapping every other Saturday. Only relevant if
        your business schedules staff that way — leave switched off otherwise.
      </p>

      {enabled && (
        <div className="space-y-3 pt-1">
          <div>
            <label className="block text-xs text-ink-soft mb-1">Anchor date (a Saturday Team A works)</label>
            <DateInput value={anchorDate} onChange={setAnchorDate} />
          </div>
          <div>
            <label className="block text-xs text-ink-soft mb-1">Team A names (comma-separated)</label>
            <input
              value={teamANames}
              onChange={(e) => setTeamANames(e.target.value)}
              placeholder="e.g. Anna, Kirsty, Irma"
              className="w-full rounded-lg border border-line px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-soft mb-1">Team B names (comma-separated)</label>
            <input
              value={teamBNames}
              onChange={(e) => setTeamBNames(e.target.value)}
              placeholder="e.g. Aleks, Hayley"
              className="w-full rounded-lg border border-line px-3 py-2 text-sm"
            />
          </div>
        </div>
      )}

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