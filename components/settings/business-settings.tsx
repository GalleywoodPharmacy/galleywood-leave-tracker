"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

type OpenDayKey =
  | "openSunday"
  | "openMonday"
  | "openTuesday"
  | "openWednesday"
  | "openThursday"
  | "openFriday"
  | "openSaturday";

const DAYS: { key: OpenDayKey; label: string }[] = [
  { key: "openSunday", label: "Sunday" },
  { key: "openMonday", label: "Monday" },
  { key: "openTuesday", label: "Tuesday" },
  { key: "openWednesday", label: "Wednesday" },
  { key: "openThursday", label: "Thursday" },
  { key: "openFriday", label: "Friday" },
  { key: "openSaturday", label: "Saturday" },
];

export default function BusinessSettings({
  organization,
}: {
  organization: {
    name: string;
    logoUrl: string | null;
    themeColor: string | null;
    openSunday: boolean;
    openMonday: boolean;
    openTuesday: boolean;
    openWednesday: boolean;
    openThursday: boolean;
    openFriday: boolean;
    openSaturday: boolean;
    statutoryLeaveWeeks: number;
  };
}) {
  const router = useRouter();
  const showToast = useToast();

  const [name, setName] = useState(organization.name);
  const [logoUrl, setLogoUrl] = useState(organization.logoUrl ?? "");
  const [themeColor, setThemeColor] = useState(organization.themeColor ?? "");
  const [openDays, setOpenDays] = useState<Record<OpenDayKey, boolean>>({
    openSunday: organization.openSunday,
    openMonday: organization.openMonday,
    openTuesday: organization.openTuesday,
    openWednesday: organization.openWednesday,
    openThursday: organization.openThursday,
    openFriday: organization.openFriday,
    openSaturday: organization.openSaturday,
  });
  const [statutoryLeaveWeeks, setStatutoryLeaveWeeks] = useState(String(organization.statutoryLeaveWeeks));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function toggleDay(key: OpenDayKey) {
    setOpenDays((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const weeks = parseFloat(statutoryLeaveWeeks);
    if (!weeks || weeks <= 0) {
      setError("Enter a valid number of weeks.");
      return;
    }

    setSubmitting(true);
    const res = await fetch("/api/settings/organization", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        logoUrl,
        themeColor,
        ...openDays,
        statutoryLeaveWeeks: weeks,
      }),
    });
    setSubmitting(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Couldn't save that.");
      return;
    }
    showToast("Business settings saved");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-line rounded-xl p-5 space-y-5">
      <div>
        <label className="block text-sm font-medium text-ink mb-1">Business name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1">Logo URL (optional)</label>
        <input
          value={logoUrl}
          onChange={(e) => setLogoUrl(e.target.value)}
          placeholder="https://…"
          className="w-full rounded-lg border border-line px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <p className="text-xs text-ink-soft mt-1">Not shown anywhere in the app yet — saved for a future update.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1">Theme colour (optional)</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={themeColor || "#0E5F59"}
            onChange={(e) => setThemeColor(e.target.value)}
            className="h-9 w-14 rounded border border-line cursor-pointer"
          />
          <input
            value={themeColor}
            onChange={(e) => setThemeColor(e.target.value)}
            placeholder="#0E5F59"
            className="flex-1 rounded-lg border border-line px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </div>
        <p className="text-xs text-ink-soft mt-1">Not applied anywhere in the app yet — saved for a future update.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-2">Which days is the business open?</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {DAYS.map((d) => (
            <label key={d.key} className="flex items-center gap-2 text-sm text-ink">
              <input
                type="checkbox"
                checked={openDays[d.key]}
                onChange={() => toggleDay(d.key)}
                className="rounded border-line"
              />
              {d.label}
            </label>
          ))}
        </div>
        <p className="text-xs text-ink-soft mt-1">
          Not yet used by the Calendar or hours calculations — saved for a future update.
        </p>
      </div>

      <div>
        <label className="block text-sm font-medium text-ink mb-1">Statutory annual leave (weeks)</label>
        <input
          type="number"
          step="0.1"
          min="0"
          value={statutoryLeaveWeeks}
          onChange={(e) => setStatutoryLeaveWeeks(e.target.value)}
          className="w-32 rounded-lg border border-line px-3 py-2 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-accent"
        />
        <p className="text-xs text-ink-soft mt-1">
          Defaults to the UK statutory minimum (5.6 weeks). Not yet used in balance calculations — saved for a
          future update.
        </p>
      </div>

      {error && <p className="text-sm text-declined">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-primary text-white text-sm font-medium px-4 py-2 hover:bg-header transition-colors disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Save business settings"}
      </button>
    </form>
  );
}