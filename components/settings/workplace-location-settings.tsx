"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";

export default function WorkplaceLocationSettings({
  timeClockEnabled: initialEnabled,
  location,
}: {
  timeClockEnabled: boolean;
  location: { name: string; latitude: number; longitude: number; radiusMeters: number } | null;
}) {
  const router = useRouter();
  const showToast = useToast();
  const [timeClockEnabled, setTimeClockEnabled] = useState(initialEnabled);
  const [name, setName] = useState(location?.name ?? "Workplace");
  const [latitude, setLatitude] = useState(location ? String(location.latitude) : "");
  const [longitude, setLongitude] = useState(location ? String(location.longitude) : "");
  const [radiusMeters, setRadiusMeters] = useState(String(location?.radiusMeters ?? 150));
  const [locating, setLocating] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function useCurrentLocation() {
    setError(null);
    if (!navigator.geolocation) {
      setError("Your browser doesn't support location.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLatitude(String(position.coords.latitude));
        setLongitude(String(position.coords.longitude));
        setLocating(false);
      },
      () => {
        setLocating(false);
        setError("Couldn't get your location — check you've allowed location access.");
      },
      { enableHighAccuracy: true, timeout: 15000 }
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    const lat = parseFloat(latitude);
    const lng = parseFloat(longitude);
    const radius = parseInt(radiusMeters, 10);
    if (isNaN(lat) || isNaN(lng)) {
      setError('Set a location first — use "Use my current location" while standing at the workplace, or enter coordinates manually.');
      return;
    }
    if (isNaN(radius) || radius < 10) {
      setError("Enter a valid radius (at least 10m).");
      return;
    }
    setSubmitting(true);
    const res = await fetch("/api/settings/workplace-location", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ timeClockEnabled, name, latitude: lat, longitude: lng, radiusMeters: radius }),
    });
    setSubmitting(false);
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(data.error ?? "Couldn't save.");
      return;
    }
    showToast("Time Clock settings saved");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white border border-line rounded-xl p-5 space-y-3">
      <label className="flex items-center gap-2 text-sm font-medium text-ink">
        <input
          type="checkbox"
          checked={timeClockEnabled}
          onChange={(e) => setTimeClockEnabled(e.target.checked)}
          className="rounded border-line"
        />
        Enable Time Clock for this business
      </label>
      <p className="text-xs text-ink-soft">
        Lets staff clock in and out from their own phone, checked against the workplace location below. Off by
        default — switch on once you've set a location.
      </p>

      <div className="pt-2 border-t border-line space-y-3">
        <div>
          <label className="block text-xs text-ink-soft mb-1">Name (optional)</label>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm"
          />
        </div>

        <div>
          <button
            type="button"
            onClick={useCurrentLocation}
            disabled={locating}
            className="rounded-lg border border-primary text-primary text-sm font-medium px-4 py-2 hover:bg-primary/5 disabled:opacity-60"
          >
            {locating ? "Getting your location…" : "Use my current location"}
          </button>
          <p className="text-xs text-ink-soft mt-1">
            Stand at the workplace and click this — or enter coordinates manually below.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="block text-xs text-ink-soft mb-1">Latitude</label>
            <input
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm font-mono"
            />
          </div>
          <div>
            <label className="block text-xs text-ink-soft mb-1">Longitude</label>
            <input
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              className="w-full rounded-lg border border-line px-3 py-2 text-sm font-mono"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-ink-soft mb-1">Allowed radius (metres)</label>
          <input
            type="number"
            min="10"
            value={radiusMeters}
            onChange={(e) => setRadiusMeters(e.target.value)}
            className="w-32 rounded-lg border border-line px-3 py-2 text-sm font-mono"
          />
          <p className="text-xs text-ink-soft mt-1">
            How close staff need to be to clock in/out — 150m is a reasonable default for most single-building
            sites.
          </p>
        </div>
      </div>

      {error && <p className="text-sm text-declined">{error}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="rounded-lg bg-primary text-white text-sm font-medium px-4 py-2 hover:bg-header disabled:opacity-60"
      >
        {submitting ? "Saving…" : "Save Time Clock settings"}
      </button>
    </form>
  );
}